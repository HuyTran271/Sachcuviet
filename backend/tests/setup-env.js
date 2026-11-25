import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Bien moi truong chi dung cho test, chay truoc moi file test.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-chi-dung-cho-test';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Neu may nay da co san binary mongod 7.0.14 trong cache (tai tay tu
// downloads.mongodb.org vi fastdl.mongodb.org cham qua proxy), dung luon
// de khoi phai tai lai. May khac khong co file nay thi
// mongodb-memory-server tu tai binary nhu binh thuong.
const cachedMongod = path.join(os.homedir(), '.cache', 'mongodb-binaries', 'mongod-7.0.14');
if (!process.env.MONGOMS_SYSTEM_BINARY && fs.existsSync(cachedMongod)) {
    process.env.MONGOMS_SYSTEM_BINARY = cachedMongod;
}
