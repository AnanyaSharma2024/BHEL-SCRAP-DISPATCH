const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'bhel_jhansi_scrap_dispatch_super_secret_2026';

module.exports = (req, res, next) => {
    // Request header se token nikalo
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        // 'Bearer <token>' format se token alag karo
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Token verify karo
        const decoded = jwt.verify(cleanToken, JWT_SECRET);
        req.user = decoded; // User data ko request object me save karo
        next(); // Aage controller pe jao
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
    }
};
