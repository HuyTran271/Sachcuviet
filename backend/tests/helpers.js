import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Khoi dong MongoDB in-memory cho test.
// kind = 'replset' (ho tro transaction) hoac 'standalone' (khong ho tro).
//
// LUU Y: /tmp tren may nay chi co 512 MB (tmpfs) va mongodb-memory-server
// mac dinh dat data dir o do; 2-3 instance WiredTiger la day /tmp lam
// mongod crash (fassert) khi khoi dong instance tiep theo. Vi vay data
// dir duoc dat rieng duoi ~/.cache/mongodb-data va xoa sau khi stop.
const DATA_ROOT = path.join(os.homedir(), '.cache', 'mongodb-data');

const makeDbPath = (kind) => {
    const dbPath = path.join(DATA_ROOT, `${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
    fs.mkdirSync(dbPath, { recursive: true });
    return dbPath;
};

export async function startTestDb(kind = 'replset') {
    const dbPath = makeDbPath(kind);
    const server =
        kind === 'replset'
            ? await MongoMemoryReplSet.create({
                  replSet: { count: 1, storageEngine: 'wiredTiger' },
                  instanceOpts: [{ dbPath }],
              })
            : await MongoMemoryServer.create({ instance: { dbPath } });
    server.__dbPath = dbPath;
    await mongoose.connect(server.getUri());
    return server;
}

export async function stopTestDb(server) {
    try {
        await mongoose.disconnect();
    } catch {
        // bo qua, van stop server ben duoi
    }
    if (server) {
        try {
            await server.stop();
        } catch {
            // bo qua
        }
    }
    // Xoa data dir rieng (mongodb-memory-server khong tu xoa dbPath
    // do minh chi dinh), tranh day o dia.
    if (server?.__dbPath) {
        fs.rmSync(server.__dbPath, { recursive: true, force: true });
    }
}

// Tao user admin / seller / buyer, 1 shop cua seller, 1 category.
export async function seedUsers() {
    const admin = await User.create({
        name: 'Admin',
        email: 'admin@test.local',
        password: 'password123',
        role: 'admin',
    });
    const seller = await User.create({
        name: 'Seller',
        email: 'seller@test.local',
        password: 'password123',
        role: 'user',
    });
    const buyer = await User.create({
        name: 'Buyer',
        email: 'buyer@test.local',
        password: 'password123',
        role: 'user',
    });
    const shop = await Shop.create({
        name: 'Shop Test',
        owner: seller._id,
        description: 'Shop phuc vu test',
        status: 'active',
    });
    const category = await Category.create({ name: 'Sach test', description: '' });
    return { admin, seller, buyer, shop, category };
}

export async function makeProduct({ shop, category, stock = 10, price = 100000, status = 'active', name = 'Sach test' }) {
    return Product.create({
        name,
        category: category._id,
        shop: shop._id,
        description: 'Mo ta test',
        price,
        stock,
        images: [],
        condition: 'used',
        author: 'Tac gia test',
        status,
    });
}

export const tokenFor = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

export const authCookie = (user) => `jwt=${tokenFor(user)}`;

export const orderPayload = (items, overrides = {}) => ({
    items,
    address: '123 Duong Test, Quan 1, TP.HCM. SDT: 0900000000',
    paymentMethod: 'COD',
    ...overrides,
});
