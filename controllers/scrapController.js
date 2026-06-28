const ScrapReport = require('../models/ScrapReport');

// 1. Department dwara naya scrap report darj karna (Auto reportedId generation)
exports.reportScrap = async (req, res) => {
    try {
        const { scrapType, weight } = req.body;

        if (req.user.role !== 'department') {
            return res.status(403).json({ message: 'Only departments can report scrap.' });
        }

        if (!scrapType || !weight || weight <= 0) {
            return res.status(400).json({ message: 'Valid scrap type and weight are required.' });
        }

        // --- SCRAP-YYYY-XXX Auto Generation Logic ---
        const currentYear = new Date().getFullYear();
        const count = await ScrapReport.countDocuments({
            reportedId: { $regex: `^SCRAP-${currentYear}-` }
        });
        const nextSeq = String(count + 1).padStart(3, '0');
        const reportedId = `SCRAP-${currentYear}-${nextSeq}`;

        const newReport = new ScrapReport({
            reportedId,
            department: req.user.department,
            scrapType,
            weight,
            reportedBy: req.user.username
        });

        await newReport.save();
        res.status(201).json({ message: 'Scrap generation reported successfully!', id: reportedId });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting scrap', error: error.message });
    }
};

// 2. Department ya admin ke according scrap reports dekhna
exports.getScrapReports = async (req, res) => {
    try {
        let reports;
        if (req.user.role === 'admin') {
            // Admin ko sirf Pending requests dikhengi
            reports = await ScrapReport.find({ status: 'Pending' }).sort({ reportedDate: -1 });
        } else {
            // Departments ko unki apni saari reports dikhengi
            reports = await ScrapReport.find({ department: req.user.department }).sort({ reportedDate: -1 });
        }
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving reports', error: error.message });
    }
};
