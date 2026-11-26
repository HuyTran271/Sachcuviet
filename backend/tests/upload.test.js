import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const cloudinaryMock = vi.hoisted(() => ({
    config: vi.fn(),
    uploader: {
        upload: vi.fn(),
        destroy: vi.fn()
    }
}));
vi.mock('cloudinary', () => ({ v2: cloudinaryMock }));

import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import app from '../app.js';
import { startTestDb, stopTestDb, seedUsers, authCookie } from './helpers.js';

// Test cho C1 (stored XSS qua upload anh).
// Upload that qua POST /api/products (seller da co shop), kiem tra:
// - anh that (magic bytes khop) duoc chap nhan,
// - file .html/.svg, gif, va file .png nhung noi dung la HTML deu bi 400
//   va khong luu file nao tren dia,
// - file upload duoc phuc vu kem header CSP sandbox.

const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

// PNG 1x1 that.
const realPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAwMCAO+ip1sAAAAASUVORK5CYII=',
    'base64'
);
const htmlContent = Buffer.from('<html><body><script>alert(1)</script></body></html>', 'utf8');
const svgContent = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    'utf8'
);
const gifContent = Buffer.from('GIF89a', 'ascii');

let server;
let ctx;
let filesBefore;

beforeAll(async () => {
    server = await startTestDb('replset');
    ctx = await seedUsers();
}, 300000);

afterAll(async () => {
    await stopTestDb(server);
});

beforeEach(async () => {
    await Product.deleteMany({});
    filesBefore = new Set(fs.readdirSync(uploadsDir));
});

afterEach(async () => {
    // Xoa file nao test vua tao trong uploads/ (de repo sach).
    for (const name of fs.readdirSync(uploadsDir)) {
        if (!filesBefore.has(name)) {
            fs.rmSync(path.join(uploadsDir, name), { force: true });
        }
    }
});

const createProductWithImage = (fileBuffer, filename, mimetype) =>
    request(app)
        .post('/api/products')
        .set('Cookie', authCookie(ctx.seller))
        .field('name', 'Sach upload test')
        .field('description', 'Mo ta test')
        .field('category', String(ctx.category._id))
        .field('price', '100000')
        .field('stock', '5')
        .field('condition', 'used')
        .attach('images', fileBuffer, { filename, contentType: mimetype });

describe('C1: upload anh chong stored XSS', () => {
    it('upload anh hop le len Cloudinary va luu secure_url', async () => {
        const cloudinaryEnv = {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
        };
        process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
        process.env.CLOUDINARY_API_KEY = 'test-key';
        process.env.CLOUDINARY_API_SECRET = 'test-secret';
        cloudinary.uploader.upload.mockResolvedValue({
            secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/sachcuviet/test.png',
            public_id: 'sachcuviet/test'
        });

        try {
            const res = await createProductWithImage(realPng, 'anh.png', 'image/png');
            expect(res.status).toBe(201);
            expect(res.body.product.images).toEqual([
                'https://res.cloudinary.com/test-cloud/image/upload/sachcuviet/test.png'
            ]);
            expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ folder: 'sachcuviet', resource_type: 'image' })
            );
        } finally {
            for (const [key, value] of Object.entries(cloudinaryEnv)) {
                if (value === undefined) delete process.env[key];
                else process.env[key] = value;
            }
            cloudinary.uploader.upload.mockReset();
        }
    });

    it('anh PNG that duoc chap nhan, phuc vu kem CSP sandbox', async () => {
        const res = await createProductWithImage(realPng, 'anh.png', 'image/png');
        expect(res.status).toBe(201);
        expect(res.body.product.images).toHaveLength(1);

        const imageUrl = res.body.product.images[0];
        expect(imageUrl.startsWith('/uploads/')).toBe(true);
        const savedPath = path.join(uploadsDir, path.basename(imageUrl));
        expect(fs.existsSync(savedPath)).toBe(true);

        const getRes = await request(app).get(imageUrl).expect(200);
        expect(getRes.headers['content-security-policy']).toContain('sandbox');
        expect(getRes.headers['x-content-type-options']).toBe('nosniff');
    });

    it('file .html du mimetype khai image/png thi 400, khong luu file', async () => {
        const res = await createProductWithImage(htmlContent, 'xss.html', 'image/png');
        expect(res.status).toBe(400);
        const newFiles = fs.readdirSync(uploadsDir).filter((n) => !filesBefore.has(n));
        expect(newFiles).toHaveLength(0);
    });

    it('file .png nhung noi dung la HTML thi 400, khong luu file', async () => {
        const res = await createProductWithImage(htmlContent, 'gia-danh.png', 'image/png');
        expect(res.status).toBe(400);
        const newFiles = fs.readdirSync(uploadsDir).filter((n) => !filesBefore.has(n));
        expect(newFiles).toHaveLength(0);
    });

    it('file .svg bi 400', async () => {
        const res = await createProductWithImage(svgContent, 'hinh.svg', 'image/svg+xml');
        expect(res.status).toBe(400);
        const newFiles = fs.readdirSync(uploadsDir).filter((n) => !filesBefore.has(n));
        expect(newFiles).toHaveLength(0);
    });

    it('file .gif bi 400 (chi cho jpg/jpeg/png/webp)', async () => {
        const res = await createProductWithImage(gifContent, 'hinh.gif', 'image/gif');
        expect(res.status).toBe(400);
        const newFiles = fs.readdirSync(uploadsDir).filter((n) => !filesBefore.has(n));
        expect(newFiles).toHaveLength(0);
    });
});
