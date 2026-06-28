const mongoose = require('mongoose');

const AgreementSchema = new mongoose.Schema({
    title: { type: String, default: 'Active Framework Purchase & Sale Agreement' },
    content: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'admin' }
});

module.exports = mongoose.model('Agreement', AgreementSchema);
