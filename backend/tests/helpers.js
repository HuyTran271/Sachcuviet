import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Khoi dong MongoDB in-memory cho test.
// kind = 'replset' (ho tro transaction) hoac 'standalone' (khong ho tro).
export async function startTestDb(kind = 'replset') {
    const server =
        kind === 'replset'
            ? await MongoMemoryReplSet.create({
                  replSet: { count: 1, storageEngine: 'wiredTiger' },
              })
            : await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    return server;
}

export async function stopTestDb(server) {
    await mongoose.disconnect();
    if (server) await server.stop();
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
