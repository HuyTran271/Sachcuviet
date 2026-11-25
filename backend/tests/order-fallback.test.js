import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import app from '../app.js';
import { startTestDb, stopTestDb, seedUsers, makeProduct, authCookie, orderPayload } from './helpers.js';
import { transactionsSupported } from '../controllers/orderController.js';

// Test duong fallback cua N1: MongoDB standalone khong ho tro transaction,
// createOrder phai dung tru kho nguyen tu + boi thuong ma van chan duoc
// ban vuot kho va kho am.

let server;
let ctx;

beforeAll(async () => {
    server = await startTestDb('standalone');
    ctx = await seedUsers();
}, 300000);

afterAll(async () => {
    await stopTestDb(server);
});

beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
});

describe('N1 fallback: MongoDB standalone (khong transaction)', () => {
    it('nhan dien duoc standalone de khong dung transaction', () => {
        expect(transactionsSupported()).toBe(false);
    });

    it('2 don dong thoi cho cuon cuoi cung: chi 1 don thanh cong, kho khong am', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 1 });

        const payload = orderPayload([{ product: String(product._id), quantity: 1 }]);
        const [resA, resB] = await Promise.all([
            request(app).post('/api/orders').set('Cookie', authCookie(ctx.buyer)).send(payload),
            request(app).post('/api/orders').set('Cookie', authCookie(ctx.buyer)).send(payload),
        ]);

        const statuses = [resA.status, resB.status].sort();
        expect(statuses).toEqual([201, 400]);
        expect(await Order.countDocuments()).toBe(1);
        const after = await Product.findById(product._id);
        expect(after.stock).toBe(0);
    });

    it('gop 2 dong trung product vuot kho thi 400, kho duoc hoan lai', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 5 });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .send(orderPayload([
                { product: String(product._id), quantity: 3 },
                { product: String(product._id), quantity: 3 },
            ]));

        expect(res.status).toBe(400);
        expect(await Order.countDocuments()).toBe(0);
        const after = await Product.findById(product._id);
        expect(after.stock).toBe(5);
    });
});
