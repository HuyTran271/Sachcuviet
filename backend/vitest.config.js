import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup-env.js'],
        // Khoi dong MongoDB in-memory (dac biet la replica set) lan dau
        // co the mat vai phut do phai tai binary mongod.
        testTimeout: 300000,
        hookTimeout: 300000,
        // Chay cac file test tuan tu trong 1 worker: moi file khoi dong
        // 1 MongoDB in-memory rieng, chay song song tren may yeu de
        // chet mongod (ECONNREFUSED) va lam test flaky.
        pool: 'forks',
        forks: { singleFork: true },
    },
});
