const mongoose = require('mongoose');

const ScrapReportSchema = new mongoose.Schema({
    reportedId: {
        type: String,
        required: true,
        unique: true // e.g. SCRAP-2026-001
    },
    department: { type: String, required: true },
    scrapType: { type: String, required: true },
    weight: { type: Number, required: true }, // Estimated weight in kg
    reportedBy: { type: String, required: true },
    reportedDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'Dispatched'],
        default: 'Pending'
    }
});

module.exports = mongoose.model('ScrapReport', ScrapReportSchema);
