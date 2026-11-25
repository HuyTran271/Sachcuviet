import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup-env.js'],
        // Khoi dong MongoDB in-memory (dac biet la replica set) lan dau
        // co the mat vai phut do phai tai binary mongod.
        testTimeout: 300000,
        hookTimeout: 300000,
    },
});
