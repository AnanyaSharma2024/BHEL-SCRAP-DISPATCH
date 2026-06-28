const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoint: Login
router.post('/login', authController.login);

// Public endpoints: Refresh Access Token / Logout (these use the httpOnly cookie, not the Authorization header)
router.post('/refresh-token', authController.refreshAccessToken);
router.post('/logout', authController.logout);

// Protected endpoint: Register department user (Admin only)
router.post('/register-dept', authMiddleware, authController.registerDept);

// Protected endpoints: Manage department credentials (Admin only)
router.get('/dept-users', authMiddleware, authController.listDeptUsers);
router.put('/dept-users/:id', authMiddleware, authController.updateDeptUser);
router.delete('/dept-users/:id', authMiddleware, authController.deleteDeptUser);

// Any logged-in user (admin or department) can change their own password
router.put('/change-password', authMiddleware, authController.changeOwnPassword);

module.exports = router;
