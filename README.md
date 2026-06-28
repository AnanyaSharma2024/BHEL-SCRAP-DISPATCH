# BHEL Jhansi — Scrap Dispatch Management System

A secure, web-based material dispatch and clearance system built for **Bharat Heavy Electricals Limited (BHEL), Jhansi Plant**. It digitizes the entire workflow of scrap disposal — from a production shop reporting generated scrap, to the Stores/Security department weighing, taxing, and gate-passing the material out of the plant.

---

## 1. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5 | Responsive UI, no build step needed |
| Frontend Logic | Vanilla JavaScript (ES6+) | Talks to backend via REST (fetch API) |
| Backend | Node.js + Express.js | Lightweight REST API server |
| Architecture | MVC (Model–View–Controller) | Clean separation: models / controllers / routes |
| Database | MongoDB (via Mongoose ODM) | Flexible schema for evolving scrap/dispatch records |
| Authentication | JSON Web Tokens (JWT) | Stateless, role-based session handling |
| Password Security | Bcrypt.js | One-way password hashing (never stored in plain text) |
| PDF Export | jsPDF + jsPDF-AutoTable (CDN) | Browser-side credential register export |
| Print/Challan PDF | Browser native print -> Save as PDF | No extra PDF library needed for gate pass |

---

## 2. Why this stack
- **Node + Express + MongoDB** is industry-standard for fast CRUD-heavy internal tools — easy to demonstrate, easy to extend.
- **MVC structure** keeps the codebase organized and easy to explain module-by-module to an examiner: Models = data shape, Controllers = business logic, Routes = API endpoints, Public = UI.
- **JWT + Bcrypt** is the standard, secure way to handle logins without storing sessions server-side.
- **Bootstrap 5** gives a clean, professional, mobile-responsive look without writing CSS from scratch.

---

## 3. Folder Structure (MVC)

```text
bhel-scrap-dispatch/
├── models/
│   ├── User.js              -> Login accounts (admin / department), role + department mapping
│   ├── ScrapReport.js        -> Scrap reported by a department (Pending / Dispatched)
│   ├── Dispatch.js           -> Final consignment record (weighbridge + driver + tax data)
│   ├── ScrapMaster.js        -> Master list of scrap material types & approved rates
│   ├── DepartmentMaster.js   -> Master list of plant departments/shops
│   └── Agreement.js          -> Live legal Sale Agreement document (editable by admin)
│
├── controllers/
│   ├── authController.js     -> Login, create/edit/delete department credentials
│   ├── scrapController.js    -> Department scrap reporting & listing
│   ├── dispatchController.js -> Convert a pending report into a dispatched consignment
│   └── masterController.js   -> CRUD for scrap types & departments
│
├── routes/                    -> Maps URLs (/api/...) to controller functions
├── middleware/
│   └── authMiddleware.js      -> Verifies JWT on every protected request
│
├── public/                    -> All static frontend files served directly
│   ├── login.html, admin-dashboard.html, dept-dashboard.html
│   ├── dispatch-form.html, history.html, masters.html, agreement.html
│   ├── css/style.css          -> BHEL blue theme
│   ├── img/bhel-logo.svg
│   └── js/                    -> One JS file per page (auth.js, admin.js, dept.js, dispatch.js, history.js)
│
├── .env                       -> Port, MongoDB URI, JWT secret (kept out of code)
├── package.json
└── server.js                  -> App entry point, DB connection, auto-seeding, Agreement API
```

---

## 4. User Roles & What Each One Can Do

### A. Stores Admin (Security & Dispatch Officer)
- Views all **Pending** scrap requests raised by departments.
- "Prepares Dispatch": enters vehicle number, MSTC-approved base rate, destination, **Gross/Tare weight** (system auto-calculates Net Weight), and driver details (name, license, mobile).
- System auto-generates a unique **Gate Pass Number** (`GP-2026-XXX`) and locks the record.
- Views complete **Dispatch History** — searchable by Gate Pass / Vehicle / Department / Driver.
- Generates the official **Material Dispatch Clearance Challan (MDCC)** — a tax invoice with CGST 9% + SGST 9% + TCS 1% — printable/savable as PDF directly from the browser.
- Exports full dispatch history to **CSV (Excel-ready)**.
- Manages **Master Data**: add/remove scrap material types & their base rates, add departments.
- **Creates department login credentials** for new shops, and now also:
  - Views a full **Credential Register** (every department username + when it was created).
  - **Edits** any department's username, assigned department, or resets their password.
  - **Deletes** a department's login entirely.
  - **Exports** the credential register as CSV or as a formatted PDF.
- Views and **edits the live Sale Agreement** terms — changes are saved instantly to the database for every user to see.

### B. Department User (e.g. Foundry Shop, Machine Shop)
- Logs in with credentials issued by the Admin.
- Selects a scrap material (from the master list, with live rate shown) and reports an estimated quantity generated by their shop.
- Views only their **own** submission history with live status (Pending / Dispatched).
- Can view (read-only) and print the Sale Agreement, but cannot edit it.
- Cannot see other departments' data, cannot create dispatches, cannot manage masters.

---

## 5. End-to-End Workflow

```text
1. Admin logs in -> Masters -> confirms/adds scrap material rates & departments
                  -> (optional) creates a new department login if a new shop needs access

2. Department logs in -> selects scrap type + estimated weight -> Submit
                       -> request saved as "Pending", visible to Admin only

3. Admin -> Active Requests -> clicks "Prepare Dispatch" on a pending request
         -> enters Vehicle No., approved auction Base Rate, Destination
         -> enters Gross Weight & Tare Weight -> system computes Net Weight automatically
         -> enters Driver Name, License Number, Contact Number
         -> Submit

4. System -> validates (gross > tare) -> generates Gate Pass No. (GP-2026-XXX)
          -> saves to Dispatch History -> marks original request "Dispatched"

5. Admin -> Dispatch History
         -> "View Receipt"  -> full tax breakup (CGST + SGST + TCS + Grand Total)
         -> "Print Challan" -> opens official BHEL MDCC format -> Save as PDF
         -> "Export to CSV" -> downloads entire history as a spreadsheet

6. Any user -> Sale Agreement page
            -> Department: read-only view + print
            -> Admin: can edit & publish updated legal terms instantly
```

---

## 6. Security Measures Implemented
- Passwords are **never stored in plain text** — hashed with Bcrypt (10 salt rounds).
- All protected API routes require a valid **JWT** (expires automatically; default 8 hours).
- Role checks happen **server-side** on every sensitive action (e.g., only `role: 'admin'` can create dispatches or edit masters), not just hidden in the UI.
- Department users can only ever see/submit data tied to their **own** department — enforced in the controller, not just the frontend.
- Duplicate Gate Pass numbers and duplicate usernames are rejected at the database level.

---

## 7. Installation & Running

### Prerequisites
- Node.js installed
- MongoDB Community Server running locally on port `27017`

### Steps
```bash
cd bhel-scrap-dispatch
npm install
node server.js
```
On first run, the system **auto-seeds**:
- Default accounts (see table below)
- Starter scrap material masters (Copper, Steel, CRGO, Aluminium)
- Starter departments (Foundry Shop, Machine Shop, Boiler Shop)
- The default Sale Agreement document

Then open: **http://localhost:5000**

---

## 8. Default Demo Credentials

| Role | Username | Password | Purpose |
|---|---|---|---|
| Admin | `admin` | `admin123` | Stores & Security Officer Portal |
| Department | `foundry_dept` | `dept123` | Foundry Shop |
| Department | `machine_dept` | `dept123` | Machine Shop |

---

## 9. Suggested Live Demo Order (for showing Sir)
1. Login as **admin** -> show Masters page (scrap rates, departments, credential register).
2. Login as **foundry_dept** -> submit a scrap report.
3. Back to **admin** -> Active Requests -> Prepare Dispatch -> fill weighbridge & driver details -> Submit.
4. Show the auto-generated **Gate Pass** in Dispatch History.
5. Click **View Receipt** (tax breakup) and **Print Challan** (official MDCC -> Save as PDF).
6. Show **Export to CSV** on the history page.
7. Show **Sale Agreement** — view as department (read-only), then edit as admin and show it update live.
8. Show **Export PDF/CSV** of the department credential register on the Masters page.

---

## 10. Possible Future Enhancements
- Email/SMS notification to department when their material is dispatched.
- Multi-level approval (Shop Head -> Stores -> Security) before gate pass issue.
- Integration with an actual weighbridge device (serial/IoT reading instead of manual entry).
- Audit log of every edit/delete made by the admin (who changed what, when).
