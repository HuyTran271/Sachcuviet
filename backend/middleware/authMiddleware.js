import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
    try {
        let token = req.cookies?.jwt;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication failed. No token provided.' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'sachcuviet_super_secret_jwt_key_2026');

        if (!decodedToken) {
            return res.status(401).json({ message: 'Authentication failed. Invalid token' });
        }

        req.user = await User.findById(decodedToken.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Authentication failed: ' + (error.message || 'Invalid or expired token')
        });
    }
};

const admin = (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Authorization failed: Not authorized as an admin'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export { protect, admin };