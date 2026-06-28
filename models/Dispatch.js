const mongoose = require('mongoose');

const DispatchSchema = new mongoose.Schema({
    scrapReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScrapReport',
        required: true
    },
    gatePassNumber: { type: String, required: true, unique: true },
    scrapType: { type: String, required: true },
    weight: { type: Number, required: true },        // Net weight (kg)
    grossWeight: { type: Number, required: true },
    tareWeight: { type: Number, required: true },
    department: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    destination: { type: String, required: true },
    baseRate: { type: Number, required: true },
    // Driver details
    driverName: { type: String, required: true },
    driverLicense: { type: String, required: true },
    driverContact: { type: String, required: true },
    dispatchDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Dispatched' }
});

module.exports = mongoose.model('Dispatch', DispatchSchema);
