const token = localStorage.getItem('token');
if (!token || localStorage.getItem('role') !== 'admin') {
    window.location.href = 'login.html';
}

function logout() {
    apiLogout();
}

document.addEventListener('DOMContentLoaded', loadHistory);

let historyData = []; // Saari history yahin cache hoti hai

async function loadHistory() {
    try {
        const res = await apiFetch('/api/dispatches/history');
        if (!res.ok) {
            return;
        }

        historyData = await res.json();
        renderTable(historyData);
    } catch (err) {
        console.error(err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No matching records found.</td></tr>`;
        return;
    }

    data.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.gatePassNumber}</strong></td>
                <td>${item.department}</td>
                <td>${item.vehicleNumber}</td>
                <td>${item.scrapType} (${item.weight} kg)</td>
                <td>${item.driverName}</td>
                <td class="text-center">
                    <button onclick="viewDetails(${index})" class="btn btn-sm btn-info text-white py-0">View Receipt</button>
                    <button onclick="printChallan(${index})" class="btn btn-sm btn-outline-primary py-0">Print Challan</button>
                </td>
            </tr>
        `;
    });
}

function filterHistory() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = historyData.filter(item => {
        return item.gatePassNumber.toLowerCase().includes(query) ||
               item.vehicleNumber.toLowerCase().includes(query) ||
               item.department.toLowerCase().includes(query) ||
               (item.driverName || '').toLowerCase().includes(query);
    });
    renderTable(filteredData);
}

function exportToCSV() {
    if (historyData.length === 0) {
        alert('No data to export!');
        return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Gate Pass Number,Department,Vehicle Number,Scrap Type,Weight (kg),Driver Name,Driver License,Destination,Dispatch Date\n';

    historyData.forEach(item => {
        const row = [
            `"${item.gatePassNumber}"`,
            `"${item.department}"`,
            `"${item.vehicleNumber}"`,
            `"${item.scrapType}"`,
            item.weight,
            `"${item.driverName || ''}"`,
            `"${item.driverLicense || ''}"`,
            `"${item.destination || ''}"`,
            `"${new Date(item.dispatchDate).toLocaleDateString('en-IN')}"`
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BHEL_Scrap_Dispatch_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printChallan(index) {
    const item = historyData[index];
    document.getElementById('p-gatepass').innerText = item.gatePassNumber;
    document.getElementById('p-date').innerText = new Date(item.dispatchDate).toLocaleDateString('en-IN');
    document.getElementById('p-dept').innerText = item.department;
    document.getElementById('p-dest').innerText = item.destination;
    document.getElementById('p-truck').innerText = item.vehicleNumber;
    document.getElementById('p-dname').innerText = item.driverName;
    document.getElementById('p-dlic').innerText = item.driverLicense;
    document.getElementById('p-dphone').innerText = item.driverContact;

    const rate = item.baseRate || 0;
    const baseValue = item.weight * rate;
    const cgst = baseValue * 0.09;
    const sgst = baseValue * 0.09;
    const tcs = baseValue * 0.01;
    const grandTotal = baseValue + cgst + sgst + tcs;

    document.getElementById('p-material').innerText = item.scrapType;
    document.getElementById('p-weight').innerText = `${item.weight} kg`;
    document.getElementById('p-rate').innerText = `₹${rate}`;
    document.getElementById('p-base-val').innerText = baseValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    document.getElementById('p-cgst').innerText = cgst.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    document.getElementById('p-sgst').innerText = sgst.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    document.getElementById('p-tcs').innerText = tcs.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    document.getElementById('p-grand-total').innerText = grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    const printArea = document.getElementById('printArea');
    printArea.classList.remove('d-none');
    printArea.scrollIntoView({ behavior: 'smooth' });
}

function closePrintView() {
    document.getElementById('printArea').classList.add('d-none');
}

function viewDetails(index) {
    const item = historyData[index];

    const rate = item.baseRate || 0;
    const baseValue = item.weight * rate;
    const cgst = baseValue * 0.09;
    const sgst = baseValue * 0.09;
    const tcs = baseValue * 0.01;
    const grandTotal = baseValue + cgst + sgst + tcs;

    const modalBody = document.getElementById('modal-receipt-body');
    modalBody.innerHTML = `
        <div class="p-3">
            <h4 class="text-primary text-center mb-4">Gate Pass No: ${item.gatePassNumber}</h4>
            <div class="row g-3">
                <div class="col-md-6 border-end">
                    <h5>Logistics & Driver Details</h5>
                    <p><strong>Truck Number:</strong> ${item.vehicleNumber}</p>
                    <p><strong>Driver Name:</strong> ${item.driverName}</p>
                    <p><strong>Driver License:</strong> ${item.driverLicense}</p>
                    <p><strong>Driver Contact:</strong> ${item.driverContact}</p>
                    <p><strong>Destination:</strong> ${item.destination}</p>
                </div>
                <div class="col-md-6">
                    <h5>Consignment & Weights</h5>
                    <p><strong>Origin Department:</strong> ${item.department}</p>
                    <p><strong>Material Type:</strong> ${item.scrapType}</p>
                    <p><strong>Gross Weight:</strong> ${item.grossWeight} kg</p>
                    <p><strong>Tare Weight:</strong> ${item.tareWeight} kg</p>
                    <p><strong>Net Dispatch Weight:</strong> ${item.weight} kg</p>
                </div>
            </div>
            <hr>
            <h5 class="mb-3">Tax Invoice Summary</h5>
            <div class="table-responsive">
                <table class="table table-bordered text-center">
                    <thead>
                        <tr>
                            <th>Base Rate (₹/kg)</th>
                            <th>Assessable Value</th>
                            <th>CGST (9%)</th>
                            <th>SGST (9%)</th>
                            <th>TCS (1%)</th>
                            <th>Grand Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>₹${rate}</td>
                            <td>₹${baseValue.toLocaleString('en-IN')}</td>
                            <td>₹${cgst.toLocaleString('en-IN')}</td>
                            <td>₹${sgst.toLocaleString('en-IN')}</td>
                            <td>₹${tcs.toLocaleString('en-IN')}</td>
                            <td class="text-success fw-bold">₹${grandTotal.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const myModal = new bootstrap.Modal(document.getElementById('receiptModal'));
    myModal.show();
}
