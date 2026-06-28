const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'bhel_jhansi_scrap_dispatch_super_secret_2026';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '20m';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'bhel_jhansi_refresh_token_secret_change_this_2026';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const REFRESH_TOKEN_EXPIRY_MS = Number(process.env.REFRESH_TOKEN_EXPIRY_MS) || 7 * 24 * 60 * 60 * 1000;

// COOKIE_SECURE=true on production (HTTPS). Keep false for local http testing.
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

function buildAccessToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username, role: user.role, department: user.department },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

function buildRefreshToken(user) {
    // Refresh token me sirf id rakha jaata hai - role/department hamesha DB se fresh liya jaayega
    return jwt.sign({ id: user._id, jti: crypto.randomBytes(16).toString('hex') }, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    });
}

function setRefreshCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,            // JavaScript se kabhi access nahi ho sakta -> XSS se safe
        secure: COOKIE_SECURE,     // production (HTTPS) me true rakhna zaroori hai
        sameSite: 'strict',        // CSRF se basic protection
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
        path: '/api/auth'          // sirf auth routes ko bhejega, baaki requests me load nahi hoga
    });
}

// 1. User Login - issues a short-lived Access Token + a long-lived Refresh Token (httpOnly cookie)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // Database me user dhoondo
        const user = await User.findOne({ username: username.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Bcrypt se password compare karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Short-lived Access Token (frontend me localStorage/memory me rakha jaata hai)
        const accessToken = buildAccessToken(user);

        // Long-lived Refresh Token - sirf hash DB me save hota hai, raw token httpOnly cookie me jaata hai
        const refreshToken = buildRefreshToken(user);
        user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await user.save();
        setRefreshCookie(res, refreshToken);

        res.status(200).json({
            message: 'Login successful',
            token: accessToken,
            username: user.username,
            role: user.role,
            department: user.department
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// 1b. Refresh Access Token using the httpOnly Refresh Token cookie
// Frontend calls this silently when an API call returns 401 because the Access Token expired.
exports.refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token. Please log in again.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Refresh token invalid or expired. Please log in again.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
        }

        // Check ki yeh wahi refresh token hai jo humne issue kiya tha (rotation/invalidation check)
        const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
            return res.status(401).json({ message: 'Refresh token has been invalidated. Please log in again.' });
        }

        // Refresh Token Rotation - har refresh pe naya refresh token bhi issue karo
        const newAccessToken = buildAccessToken(user);
        const newRefreshToken = buildRefreshToken(user);
        user.refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        await user.save();
        setRefreshCookie(res, newRefreshToken);

        res.status(200).json({
            token: newAccessToken,
            username: user.username,
            role: user.role,
            department: user.department
        });
    } catch (err) {
        res.status(500).json({ message: 'Error refreshing token', error: err.message });
    }
};

// 1c. Logout - invalidates the refresh token both in the DB and the cookie
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies && req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
                await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
            } catch (err) {
                // Token already invalid/expired - nothing to clean up server-side
            }
        }
        res.clearCookie('refreshToken', { path: '/api/auth' });
        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error during logout', error: err.message });
    }
};

// 2. Secure Department User Registration (Admin Only)
exports.registerDept = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { username, password, department } = req.body;

        if (!username || !password || !department) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const cleanUsername = username.toLowerCase().trim();
        const userExists = await User.findOne({ username: cleanUsername });
        if (userExists) {
            return res.status(400).json({ message: 'Username already taken. Choose another.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDeptUser = new User({
            username: cleanUsername,
            password: hashedPassword,
            role: 'department',
            department
        });

        await newDeptUser.save();

        res.status(201).json({
            message: `Credentials generated successfully for ${department}! Username: ${cleanUsername}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
};

// 3. List all department-user credentials (Admin Only)
// Used by the "Manage Masters" screen to show a full credential register.
exports.listDeptUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        // Password kabhi bhi client ko nahi bhejna - select se hata diya
        const users = await User.find({ role: 'department' })
            .select('-password')
            .sort({ department: 1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching credential records', error: err.message });
    }
};

// 4. Update a department user's credentials (Admin Only)
// Admin can change username, department mapping, and/or reset the password.
exports.updateDeptUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { username, password, department } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser || targetUser.role !== 'department') {
            return res.status(404).json({ message: 'Department user not found.' });
        }

        if (username) {
            const cleanUsername = username.toLowerCase().trim();
            if (cleanUsername !== targetUser.username) {
                const exists = await User.findOne({ username: cleanUsername });
                if (exists) {
                    return res.status(400).json({ message: 'Username already taken. Choose another.' });
                }
                targetUser.username = cleanUsername;
            }
        }

        if (department) {
            targetUser.department = department;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters.' });
            }
            targetUser.password = await bcrypt.hash(password, 10);
            targetUser.refreshTokenHash = null; // force re-login with new password
        }

        await targetUser.save();

        res.status(200).json({ message: `Credentials updated successfully for ${targetUser.username}.` });
    } catch (err) {
        res.status(500).json({ message: 'Error updating credentials', error: err.message });
    }
};

// 5. Delete a department user's credentials (Admin Only)
exports.deleteDeptUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser || targetUser.role !== 'department') {
            return res.status(404).json({ message: 'Department user not found.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `Login credentials for ${targetUser.username} removed successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting credentials', error: err.message });
    }
};

// 6. Change own password (any logged-in user - admin or department)
// Used right after first login / deployment to replace the default seeded password.
exports.changeOwnPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.refreshTokenHash = null; // password change ke baad purana refresh token bhi invalid kar do
        await user.save();
        res.clearCookie('refreshToken', { path: '/api/auth' });

        res.status(200).json({ message: 'Password updated successfully. Please log in again with your new password.' });
    } catch (err) {
        res.status(500).json({ message: 'Error changing password', error: err.message });
    }
};
