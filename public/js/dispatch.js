const token = localStorage.getItem('token');
if (!token || localStorage.getItem('role') !== 'admin') {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Localstorage se pending request ki details bharo
  document.getElementById('disp-dept').value = localStorage.getItem('temp_dispatch_dept') || '';
  document.getElementById('disp-material').value =
    `${localStorage.getItem('temp_dispatch_type') || ''} (${localStorage.getItem('temp_dispatch_weight') || 0} kg)`;
});

function calculateNetWeight() {
  const gross = Number(document.getElementById('grossWeight').value) || 0;
  const tare = Number(document.getElementById('tareWeight').value) || 0;
  const net = gross - tare;
  document.getElementById('netWeight').value = net >= 0 ? net : 0;
}

document.getElementById('final-dispatch-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const gross = Number(document.getElementById('grossWeight').value);
  const tare = Number(document.getElementById('tareWeight').value);
  const netWeight = Number(document.getElementById('netWeight').value);

  if (gross <= tare) {
    alert('Gross weight must be greater than tare weight. Please check the values.');
    return;
  }

  const payload = {
    scrapReportId: localStorage.getItem('temp_dispatch_id'),
    scrapType: localStorage.getItem('temp_dispatch_type'),
    weight: netWeight,
    grossWeight: gross,
    tareWeight: tare,
    department: localStorage.getItem('temp_dispatch_dept'),
    vehicleNumber: document.getElementById('vehicleNumber').value,
    destination: document.getElementById('destination').value,
    baseRate: Number(document.getElementById('baseRate').value),
    driverName: document.getElementById('driverName').value,
    driverLicense: document.getElementById('driverLicense').value,
    driverContact: document.getElementById('driverContact').value
  };

  try {
    const res = await apiFetch('/api/dispatches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok) {
      alert('Consignment Dispatched! Gate Pass: ' + result.data.gatePassNumber);
      localStorage.removeItem('temp_dispatch_id');
      localStorage.removeItem('temp_dispatch_type');
      localStorage.removeItem('temp_dispatch_weight');
      localStorage.removeItem('temp_dispatch_dept');
      window.location.href = 'history.html';
    } else {
      alert(result.message || 'Error executing dispatch.');
    }
  } catch (err) {
    console.error(err);
    alert('Server connection error.');
  }
});
