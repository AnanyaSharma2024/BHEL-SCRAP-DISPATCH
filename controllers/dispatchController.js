const Dispatch = require('../models/Dispatch');
const ScrapReport = require('../models/ScrapReport');

// 1. Pending scrap report ko dispatch me convert karna (Auto Gate Pass + validation)
exports.createDispatch = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const {
            scrapReportId, scrapType, weight, grossWeight, tareWeight,
            department, vehicleNumber, destination, baseRate,
            driverName, driverLicense, driverContact
        } = req.body;

        // Basic validation
        if (!scrapReportId || !vehicleNumber || !destination || !baseRate ||
            !grossWeight || !tareWeight || !driverName || !driverLicense || !driverContact) {
            return res.status(400).json({ message: 'All fields are required to generate the dispatch.' });
        }

        if (Number(grossWeight) <= Number(tareWeight)) {
            return res.status(400).json({ message: 'Gross weight must be greater than tare weight.' });
        }

        // --- GP-YYYY-XXX Auto Generation Logic ---
        const currentYear = new Date().getFullYear();
        const count = await Dispatch.countDocuments({
            gatePassNumber: { $regex: `^GP-${currentYear}-` }
        });
        const nextSeq = String(count + 1).padStart(3, '0');
        const gatePassNumber = `GP-${currentYear}-${nextSeq}`;

        // Duplicate Gate Pass Check (safety)
        const existingGatePass = await Dispatch.findOne({ gatePassNumber });
        if (existingGatePass) {
            return res.status(400).json({ message: 'Gate Pass Already Exists! Please refresh and try again.' });
        }

        const newDispatch = new Dispatch({
            scrapReportId, gatePassNumber, scrapType, weight, grossWeight, tareWeight,
            department, vehicleNumber, destination, baseRate,
            driverName, driverLicense, driverContact
        });

        await newDispatch.save();

        // Original department report ka status 'Dispatched' kar do
        await ScrapReport.findByIdAndUpdate(scrapReportId, { status: 'Dispatched' });

        res.status(201).json({ message: 'Dispatch generated successfully!', data: newDispatch });
    } catch (error) {
        res.status(500).json({ message: 'Dispatch error', error: error.message });
    }
};

// 2. History - saare dispatched consignments
exports.getDispatchHistory = async (req, res) => {
    try {
        const history = await Dispatch.find().sort({ dispatchDate: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
};
