const DepartmentMaster = require('../models/DepartmentMaster');
const ScrapMaster = require('../models/ScrapMaster');

// 1. Departments list
exports.getDepartments = async (req, res) => {
    try {
        const depts = await DepartmentMaster.find().sort({ name: 1 });
        res.status(200).json(depts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching departments' });
    }
};

// 2. Naya department add karna (Admins only)
exports.addDepartment = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        if (!req.body.name) {
            return res.status(400).json({ message: 'Department name is required.' });
        }
        const newDept = new DepartmentMaster({ name: req.body.name.trim() });
        await newDept.save();
        res.status(201).json(newDept);
    } catch (err) {
        res.status(400).json({ message: 'Error adding department. Must be unique.' });
    }
};

// 3. Scrap masters list
exports.getScraps = async (req, res) => {
    try {
        const scraps = await ScrapMaster.find().sort({ materialName: 1 });
        res.status(200).json(scraps);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching scraps' });
    }
};

// 4. Naya scrap master add karna (Admins only)
exports.addScrap = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { materialName, baseRatePerKg } = req.body;
        if (!materialName || baseRatePerKg === undefined || baseRatePerKg < 0) {
            return res.status(400).json({ message: 'Valid material name and rate are required.' });
        }
        const newScrap = new ScrapMaster({ materialName: materialName.trim(), baseRatePerKg });
        await newScrap.save();
        res.status(201).json(newScrap);
    } catch (err) {
        res.status(400).json({ message: 'Error adding scrap type. Must be unique.' });
    }
};

// 5. Scrap master delete karna (Admins only)
exports.deleteScrap = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        await ScrapMaster.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Scrap type removed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error removing scrap type' });
    }
};

// 6. Department master delete karna (Admins only)
exports.deleteDepartment = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        await DepartmentMaster.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Department removed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error removing department' });
    }
};
