import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import { seedAdmin } from '../seeder.js';

// Exercise the real controllers, JWT middleware, validation and Mongoose save
// hooks. Only database I/O is replaced; no MongoDB service is contacted.
test('merged authentication, profile and seeder contracts', async (t) => {
  const records = new Map();
  const original = { findOne: User.findOne, findById: User.findById, insertOne: User.collection.insertOne, updateOne: User.collection.updateOne };
  const envKeys = ['JWT_SECRET', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.JWT_SECRET = 'integration-test-secret-used-only-by-this-process';
  User.findOne = ({ email }) => ({ collation: async () => {
    const record = [...records.values()].find((item) => item.email.toLowerCase() === email.toLowerCase());
    return record ? User.hydrate(record) : null;
  } });
  User.findById = (id) => ({ select: async (projection) => {
    assert.equal(projection, '-password');
    const record = records.get(String(id));
    return record ? User.hydrate(record) : null;
  } });
  User.collection.insertOne = async (record) => {
    records.set(String(record._id), { ...record });
    return { acknowledged: true, insertedId: record._id };
  };
  User.collection.updateOne = async (filter, update) => {
    Object.assign(records.get(String(filter._id)), update.$set);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  };
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    User.findOne = original.findOne; User.findById = original.findById;
    User.collection.insertOne = original.insertOne; User.collection.updateOne = original.updateOne;
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key];
    }
  });
  async function request(path, { method = 'GET', body, cookie, authorization } = {}) {
    return fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(authorization ? { Authorization: authorization } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  const registration = { name: '  Test Reader  ', email: '  Reader@Example.test  ', phone: '0912 345 678', password: 'reader-password-123' };
  let account, cookie;

  await t.test('register through /api/auth hashes once, sets cookie and preserves phone', async () => {
    const response = await request('/api/auth/register', { method: 'POST', body: registration });
    assert.equal(response.status, 201);
    account = await response.json();
    cookie = response.headers.get('set-cookie').split(';')[0];
    assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(response.headers.get('set-cookie'), /SameSite=Strict/i);
    assert.equal(account.email, 'reader@example.test');
    assert.equal(account.name, 'Test Reader');
    assert.equal(account.phone, '0912345678');
    assert.equal(account.password, undefined);
    assert.equal(account.role, 'user');
    assert.ok(await bcrypt.compare(registration.password, records.get(account._id).password));
    assert.notEqual(records.get(account._id).password, registration.password);
  });

  await t.test('old and new login APIs accept the same account and issue a valid token', async () => {
    for (const path of ['/api/users/login', '/api/auth/login']) {
      const response = await request(path, { method: 'POST', body: { email: ' READER@EXAMPLE.TEST ', password: registration.password } });
      assert.equal(response.status, 200);
      const session = await response.json();
      assert.equal(session._id, account._id);
      const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
      assert.equal(decoded.id, account._id);
      assert.equal(decoded.exp - decoded.iat, 3600);
    }
    const response = await request('/api/users/register', { method: 'POST', body: { name: 'Legacy Client', email: 'legacy@example.test', password: 'legacy123' } });
    assert.equal(response.status, 201);
    const legacy = await response.json();
    assert.ok(await bcrypt.compare('legacy123', records.get(legacy._id).password));
  });

  await t.test('reject duplicate email, malformed input and invalid password without DB writes', async () => {
    const before = records.size;
    assert.equal((await request('/api/auth/register', { method: 'POST', body: { ...registration, email: 'READER@example.test' } })).status, 409);
    assert.equal((await request('/api/auth/register', { method: 'POST', body: { ...registration, email: 'other@example.test', password: 'x' } })).status, 400);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: {}, password: 'x' } })).status, 400);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: 'reader@example.test', password: 'wrong' } })).status, 401);
    assert.equal(records.size, before);
  });

  await t.test('profile works with cookie and bearer, excludes password and denies anonymous/expired sessions', async () => {
    const response = await request('/api/users/profile', { cookie });
    assert.equal(response.status, 200);
    const profile = await response.json();
    assert.equal(profile.user.phone, '0912345678');
    assert.equal(profile.user.password, undefined);
    assert.equal((await request('/api/users/profile')).status, 401);
    const expired = jwt.sign({ id: account._id }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request('/api/users/profile', { cookie: `jwt=${expired}` })).status, 401);
    const valid = jwt.sign({ id: account._id }, process.env.JWT_SECRET);
    assert.equal((await request('/api/users/profile', { authorization: `Bearer ${valid}` })).status, 200);
  });

  await t.test('inactive users cannot log in or use existing sessions; admin route checks role', async () => {
    const record = records.get(account._id);
    record.status = 'inactive';
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: record.email, password: registration.password } })).status, 403);
    assert.equal((await request('/api/users/profile', { cookie })).status, 403);
    record.status = 'active';
    assert.equal((await request('/api/users/admin-dashboard', { cookie })).status, 403);
    record.role = 'admin';
    assert.equal((await request('/api/users/admin-dashboard', { cookie })).status, 200);
    record.role = 'user';
  });

  await t.test('saving an existing account does not rehash the stored password', async () => {
    const record = records.get(account._id);
    const hash = record.password;
    const user = User.hydrate(record);
    user.name = 'Updated Name';
    await user.save();
    assert.equal(records.get(account._id).password, hash);
    assert.ok(await bcrypt.compare(registration.password, records.get(account._id).password));
  });

  await t.test('seeder hashes once and never overwrites existing credentials or roles', async () => {
    process.env.SEED_ADMIN_EMAIL = 'seed-admin@example.test';
    process.env.SEED_ADMIN_PASSWORD = 'seed-password-123';
    const seeded = await seedAdmin();
    const stored = records.get(String(seeded._id));
    assert.ok(await bcrypt.compare(process.env.SEED_ADMIN_PASSWORD, stored.password));
    const hash = stored.password;
    stored.role = 'user';
    const count = records.size;
    await seedAdmin();
    assert.equal(records.size, count);
    assert.equal(stored.password, hash);
    assert.equal(stored.role, 'user');
  });

  await t.test('both logout endpoints clear cookies even without authentication', async () => {
    for (const path of ['/api/auth/logout', '/api/users/logout']) {
      const response = await request(path, { method: 'POST' });
      assert.equal(response.status, 200);
      assert.match(response.headers.get('set-cookie'), /jwt=;/);
      assert.match(response.headers.get('set-cookie'), /Expires=/i);
    }
  });

  await t.test('imported shop/product schemas validate their required fields', async () => {
    const shop = new Shop({ name: 'Test Shop', owner: new mongoose.Types.ObjectId(), description: 'Example', avatar: '/avatar.jpg' });
    await shop.validate();
    const product = new Product({ name: 'Example Book', category: new mongoose.Types.ObjectId(), shop: shop._id, description: 'Example', price: 45000, stock: 1, images: ['/cover.jpg'], condition: 'used' });
    await product.validate();
    product.price = -1;
    await assert.rejects(product.validate(), (error) => Boolean(error.errors.price));
  });
});
