const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, dispatchController.createDispatch);
router.get('/history', authMiddleware, dispatchController.getDispatchHistory);

module.exports = router;
