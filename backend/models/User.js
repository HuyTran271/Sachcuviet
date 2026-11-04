
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        trim: true
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    status: {
        type: String,
        enum: ['active', 'locked'],
        default: 'active'
    },

    phone: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);

export default User;
