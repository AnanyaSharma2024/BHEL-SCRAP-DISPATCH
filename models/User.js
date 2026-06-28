const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'department'],
        required: true
    },
    department: {
        type: String,
        default: null // Admin ke liye null, departments ke liye 'Foundry Shop' etc.
    },
    // Current refresh token ka hash - isse purane/stolen refresh token ko invalidate kar sakte hain
    refreshTokenHash: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
