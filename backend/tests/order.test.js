import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import app from '../app.js';
import { startTestDb, stopTestDb, seedUsers, makeProduct, authCookie, orderPayload } from './helpers.js';
import { transactionsSupported } from '../controllers/orderController.js';

// Test cho N1 (transaction + gop trung product + tru kho nguyen tu)
// va N2 (Idempotency-Key). Chay tren replica set 1 node de transaction
// hoat dong duoc.

let server;
let ctx;

beforeAll(async () => {
    server = await startTestDb('replset');
    ctx = await seedUsers();
}, 300000);

afterAll(async () => {
    await stopTestDb(server);
});

beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
});

describe('N1: tao don hang an toan ton kho', () => {
    it('nhan dien duoc replica set de dung transaction', () => {
        expect(transactionsSupported()).toBe(true);
    });

    it('gop 2 dong trung product thanh 1 dong, tru dung tong so luong', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 10 });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .send(orderPayload([
                { product: String(product._id), quantity: 3 },
                { product: String(product._id), quantity: 3 },
            ]));

        expect(res.status).toBe(201);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].quantity).toBe(6);
        expect(res.body.totalPrice).toBe(600000);

        const after = await Product.findById(product._id);
        expect(after.stock).toBe(4);
    });

    it('2 dong trung product vuot kho thi 400, khong tao don, kho khong doi', async () => {
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

    it('san pham inactive thi 400, kho cua san pham khac khong doi', async () => {
        const okProduct = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 5, name: 'Sach ok' });
        const badProduct = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 5, name: 'Sach an', status: 'inactive' });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .send(orderPayload([
                { product: String(okProduct._id), quantity: 1 },
                { product: String(badProduct._id), quantity: 1 },
            ]));

        expect(res.status).toBe(400);
        expect(await Order.countDocuments()).toBe(0);
        const after = await Product.findById(okProduct._id);
        expect(after.stock).toBe(5);
    });
});

describe('N2: Idempotency-Key cho POST /orders', () => {
    it('gui cung key 2 lan chi tao 1 don, tra dung ket qua cu, kho tru 1 lan', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 10 });
        const payload = orderPayload([{ product: String(product._id), quantity: 2 }]);

        const res1 = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .set('Idempotency-Key', 'key-001')
            .send(payload);
        expect(res1.status).toBe(201);

        const res2 = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .set('Idempotency-Key', 'key-001')
            .send(payload);
        expect(res2.status).toBe(201);
        expect(res2.body._id).toBe(res1.body._id);

        expect(await Order.countDocuments()).toBe(1);
        const after = await Product.findById(product._id);
        expect(after.stock).toBe(8);
    });

    it('cung key nhung body khac nhau thi 422', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 10 });

        const res1 = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .set('Idempotency-Key', 'key-002')
            .send(orderPayload([{ product: String(product._id), quantity: 1 }]));
        expect(res1.status).toBe(201);

        const res2 = await request(app)
            .post('/api/orders')
            .set('Cookie', authCookie(ctx.buyer))
            .set('Idempotency-Key', 'key-002')
            .send(orderPayload([{ product: String(product._id), quantity: 2 }]));
        expect(res2.status).toBe(422);
        expect(await Order.countDocuments()).toBe(1);
    });

    it('khong gui key thi moi request tao don rieng (tuong thich cu)', async () => {
        const product = await makeProduct({ shop: ctx.shop, category: ctx.category, stock: 10 });
        const payload = orderPayload([{ product: String(product._id), quantity: 1 }]);

        const res1 = await request(app).post('/api/orders').set('Cookie', authCookie(ctx.buyer)).send(payload);
        const res2 = await request(app).post('/api/orders').set('Cookie', authCookie(ctx.buyer)).send(payload);
        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);
        expect(res2.body._id).not.toBe(res1.body._id);
        expect(await Order.countDocuments()).toBe(2);
    });
});
