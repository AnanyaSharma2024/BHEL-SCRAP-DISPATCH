const mongoose = require('mongoose');

const ScrapMasterSchema = new mongoose.Schema({
    materialName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    baseRatePerKg: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('ScrapMaster', ScrapMasterSchema);
