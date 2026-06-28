require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const scrapRoutes = require('./routes/scrapRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const masterRoutes = require('./routes/masterRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const User = require('./models/User');
const Agreement = require('./models/Agreement');
const DepartmentMaster = require('./models/DepartmentMaster');
const ScrapMaster = require('./models/ScrapMaster');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bhel_scrap_mvc_v2';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to Local MongoDB (bhel_scrap_mvc_v2)');
    await seedUsers();
    await seedAgreement();
    await seedMasters();
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/scrap', scrapRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/masters', masterRoutes);

// ------- Default users seed -------
async function seedUsers() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await new User({ username: 'admin', password: hashedPassword, role: 'admin' }).save();
      console.log('Admin seeded: admin / admin123');
    }
    const foundryExists = await User.findOne({ username: 'foundry_dept' });
    if (!foundryExists) {
      const hashedPassword = await bcrypt.hash('dept123', 10);
      await new User({
        username: 'foundry_dept',
        password: hashedPassword,
        role: 'department',
        department: 'Foundry Shop'
      }).save();
      console.log('Foundry Dept seeded: foundry_dept / dept123');
    }
    const machineExists = await User.findOne({ username: 'machine_dept' });
    if (!machineExists) {
      const hashedPassword = await bcrypt.hash('dept123', 10);
      await new User({
        username: 'machine_dept',
        password: hashedPassword,
        role: 'department',
        department: 'Machine Shop'
      }).save();
      console.log('Machine Dept seeded: machine_dept / dept123');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// ------- Default agreement seed -------
async function seedAgreement() {
  try {
    const existing = await Agreement.findOne();
    if (!existing) {
      await new Agreement({
        title: 'Scrap Sale Agreement - E-Auction Winning Bidder (MSTC Platform)',
        content: `THIS SCRAP SALE AGREEMENT is issued by Bharat Heavy Electricals Limited (BHEL), Jhansi Plant ("the Seller") to the successful bidder ("the Buyer") declared winner (H-1) through the e-auction conducted on the MSTC Limited portal, against the relevant auction/lot reference. This Agreement governs the lifting and removal of scrap material from BHEL Jhansi premises and is binding from the date of issue until full and final lifting of the contracted quantity.

1. PRICE AND VALIDITY (NO RENEGOTIATION CLAUSE)
   a. The rate payable by the Buyer shall be strictly the final winning bid rate (Rs. per kg) accepted on the MSTC e-auction platform, as recorded in this system at the time of dispatch.
   b. The Buyer shall have NO RIGHT to renegotiate, dispute, or seek revision of the accepted rate on any ground whatsoever, including but not limited to subsequent market fluctuation, change in scrap grade perception, transportation cost, or delay attributable to the Buyer.
   c. This rate is final and binding for the entire quantity covered under this Agreement and remains fixed irrespective of the number of dispatch lots or the time taken for complete lifting, subject to the validity period mentioned in the original auction terms.

2. SCOPE OF SUPPLY
   a. Material shall be released only against a valid Gate Pass / Material Dispatch Clearance Challan (MDCC) generated through this system after weighbridge verification.
   b. Quantity supplied shall be based on the Net Weight (Gross Truck Weight minus Tare Truck Weight) recorded at the BHEL weighbridge at the time of dispatch. This weighbridge reading shall be final and binding on both parties.
   c. BHEL reserves the right to inspect, reject, or hold back any material found not conforming to the description declared at the time of auction.

3. TAXATION AND STATUTORY COMPLIANCE
   a. The Buyer shall bear, in addition to the assessable value, applicable CGST and SGST (currently 9% + 9%) and Tax Collected at Source (TCS) at 1% under Section 206C of the Income Tax Act, 1961, or as amended from time to time.
   b. Statutory rates of GST/TCS shall apply as prevailing on the date of dispatch and are outside the scope of the price-lock under Clause 1; only the base assessable rate (per kg) is locked, not the statutory levies.
   c. The Buyer is solely responsible for furnishing valid GSTIN/PAN details and complying with all applicable tax laws for the lifting of scrap material.

4. LOGISTICS AND SECURITY
   a. Only vehicles and drivers with valid registration, driving license, and identification recorded against the Gate Pass shall be permitted entry/exit from BHEL premises.
   b. The Buyer shall ensure the carrying vehicle is suitable and roadworthy for the declared load, and shall be solely responsible for any damage, loss, or statutory violation occurring during transportation after the material exits BHEL premises.
   c. BHEL Security shall have the right to re-verify gross/tare weight at the exit gate; any discrepancy beyond permissible tolerance shall be reconciled before final exit clearance.

5. LIFTING PERIOD AND DEFAULT
   a. The Buyer shall lift the entire contracted quantity within the validity period specified in the original e-auction sale order. Failure to lift within this period, without written extension from BHEL, may result in forfeiture of earnest money/security deposit as per MSTC/BHEL disposal policy, and BHEL may re-auction the unlifted quantity at the Buyer's risk and cost.
   b. Partial lifting under multiple gate passes is permitted, provided the cumulative quantity does not exceed the contracted quantity and the locked rate under Clause 1 applies uniformly to every dispatch.

6. DISPUTE RESOLUTION
   a. Any dispute arising out of or in connection with this Agreement shall first be referred to the Stores & Disposal Officer, BHEL Jhansi, for resolution.
   b. Unresolved disputes shall be subject to the exclusive jurisdiction of the courts at Jhansi, Uttar Pradesh, and shall be governed by the laws of India.

7. GENERAL
   a. This Agreement, once issued against a specific auction lot, supersedes any verbal understanding or prior correspondence on price for that lot.
   b. BHEL reserves the right to amend the standard terms (Clauses 2 to 7) for future auction lots; any such amendment shall not retrospectively alter the locked price under Clause 1 for material already won/dispatched under an earlier issued Agreement.
   c. This document is maintained as a live digital record. The version available on this portal at the time of dispatch shall be treated as the operative and binding version.

Issued by: Stores & Disposal Department, Bharat Heavy Electricals Limited, Jhansi.`,
        updatedBy: 'admin'
      }).save();
      console.log('Default agreement seeded successfully.');
    }
  } catch (err) {
    console.error('Agreement seeding error:', err);
  }
}

// ------- Default masters seed -------
async function seedMasters() {
  try {
    const deptCount = await DepartmentMaster.countDocuments();
    if (deptCount === 0) {
      await DepartmentMaster.insertMany([
        { name: 'Foundry Shop' },
        { name: 'Machine Shop' },
        { name: 'Boiler Shop' }
      ]);
      console.log('Department Masters Seeded.');
    }
    const scrapCount = await ScrapMaster.countDocuments();
    if (scrapCount === 0) {
      await ScrapMaster.insertMany([
        { materialName: 'Copper Scrap', baseRatePerKg: 650 },
        { materialName: 'Steel Scrap', baseRatePerKg: 90 },
        { materialName: 'CRGO Scrap', baseRatePerKg: 150 },
        { materialName: 'Aluminium Scrap', baseRatePerKg: 180 }
      ]);
      console.log('Scrap Material Masters Seeded.');
    }
  } catch (err) {
    console.error('Error seeding masters:', err);
  }
}

// ------- Agreement APIs -------
app.get('/api/agreement', authMiddleware, async (req, res) => {
  try {
    const agreement = await Agreement.findOne();
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }
    res.status(200).json(agreement);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agreement' });
  }
});

app.put('/api/agreement', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required.' });
    }
    const updated = await Agreement.findOneAndUpdate(
      {},
      { content, lastUpdated: Date.now(), updatedBy: req.user.username },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Agreement updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating agreement' });
  }
});

// Catch-all 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

app.listen(PORT, () => console.log(`BHEL Scrap Dispatch Server running at http://localhost:${PORT}`));
