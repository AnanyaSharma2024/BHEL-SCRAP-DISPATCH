const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/departments', authMiddleware, masterController.getDepartments);
router.post('/departments', authMiddleware, masterController.addDepartment);
router.delete('/departments/:id', authMiddleware, masterController.deleteDepartment);

router.get('/scraps', authMiddleware, masterController.getScraps);
router.post('/scraps', authMiddleware, masterController.addScrap);
router.delete('/scraps/:id', authMiddleware, masterController.deleteScrap);

module.exports = router;
