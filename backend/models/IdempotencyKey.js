import mongoose from 'mongoose';

// Luu Idempotency-Key cua POST /orders de chong tao don trung khi client
// retry (mang cham, timeout, F5). Key duoc claim bang unique index truoc
// khi tao don, nen 2 request cung key khong the cung chay qua buoc tao don.
// - Cung key + cung body: tra lai dung response cu (replay).
// - Cung key + khac body: 422, vi day la loi cua client.
// - Key dang xu ly (in_progress): 409, client thu lai sau.
// Key het han sau 24 gio (TTL index tren createdAt).
const IdempotencyKeySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // SHA-256 cua noi dung don (user + items da gop + dia chi +
        // phuong thuc thanh toan), dung de phat hien key bi dung lai
        // voi body khac.
        fingerprint: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed'],
            default: 'in_progress',
        },
        responseStatus: {
            type: Number,
        },
        responseBody: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

IdempotencyKeySchema.index({ key: 1, user: 1 }, { unique: true });
IdempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const IdempotencyKey = mongoose.model('IdempotencyKey', IdempotencyKeySchema);

export default IdempotencyKey;
