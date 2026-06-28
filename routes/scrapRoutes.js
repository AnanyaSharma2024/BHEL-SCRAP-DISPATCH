const express = require('express');
const router = express.Router();
const scrapController = require('../controllers/scrapController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, scrapController.reportScrap);
router.get('/', authMiddleware, scrapController.getScrapReports);

module.exports = router;
