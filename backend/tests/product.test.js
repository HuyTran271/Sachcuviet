import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import app from '../app.js';
import { startTestDb, stopTestDb, seedUsers, makeProduct, authCookie } from './helpers.js';

// Test cho N3 (loc san pham theo shop o backend) va C2 (seller khong
// duoc doi status san pham).

let server;
let ctx;
let shopB;

beforeAll(async () => {
    server = await startTestDb('replset');
    ctx = await seedUsers();
    const sellerB = await User.create({
        name: 'Seller B',
        email: 'seller-b@test.local',
        password: 'password123',
        role: 'user',
    });
    shopB = await Shop.create({ name: 'Shop B', owner: sellerB._id, description: '', status: 'active' });
}, 300000);

afterAll(async () => {
    await stopTestDb(server);
});

beforeEach(async () => {
    await Product.deleteMany({});
});

describe('N3: loc san pham theo shop o backend', () => {
    it('GET /products?shop=<id> chi tra san pham cua shop do, du shop co hon 12 sach', async () => {
        for (let i = 0; i < 15; i++) {
            await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 5, name: `Sach A-${i}` });
        }
        for (let i = 0; i < 3; i++) {
            await makeProduct({ shop: shopB, category: ctx.category, stock: 5, name: `Sach B-${i}` });
        }

        const res = await request(app)
            .get(`/api/products?shop=${ctx.shop._id}&limit=100`)
            .expect(200);

        expect(res.body.total).toBe(15);
        expect(res.body.products).toHaveLength(15);
        expect(res.body.products.every((p) => String(p.shop?._id || p.shop) === String(ctx.shop._id))).toBe(true);
    });

    it('shop id sai dinh dang thi 400', async () => {
        const res = await request(app).get('/api/products?shop=khong-phai-object-id');
        expect(res.status).toBe(400);
    });

    it('khong truyen shop thi hanh vi cu khong doi (mac dinh 12/trang)', async () => {
        for (let i = 0; i < 15; i++) {
            await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 5, name: `Sach A-${i}` });
        }
        const res = await request(app).get('/api/products').expect(200);
        expect(res.body.products).toHaveLength(12);
        expect(res.body.total).toBe(15);
    });
});

describe('C2: seller khong duoc doi status san pham', () => {
    it('seller gui status=active thi bi bo qua: san pham admin vua an van an, cac field khac van doi duoc', async () => {
        const product = await makeProduct({
            shop: ctx.shop,
            category: ctx.category,
            stock: 5,
            status: 'inactive',
            name: 'Sach bi an',
        });

        const res = await request(app)
            .put(`/api/products/${product._id}`)
            .set('Cookie', authCookie(ctx.seller))
            .send({ status: 'active', name: 'Ten moi' });
        expect(res.status).toBe(200);

        const after = await Product.findById(product._id);
        expect(after.status).toBe('inactive');
        expect(after.name).toBe('Ten moi');
    });

    it('admin van doi duoc status qua route admin', async () => {
        const product = await makeProduct({
            shop: ctx.shop,
            category: ctx.category,
            stock: 5,
            status: 'inactive',
            name: 'Sach bi an',
        });

        const res = await request(app)
            .put(`/api/admin/products/${product._id}/status`)
            .set('Cookie', authCookie(ctx.admin))
            .send({ status: 'active' });
        expect(res.status).toBe(200);

        const after = await Product.findById(product._id);
        expect(after.status).toBe('active');
    });
});
