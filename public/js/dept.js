const token = localStorage.getItem('token');
const deptName = localStorage.getItem('department');

if (!token || localStorage.getItem('role') !== 'department') {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('dept-title');
  titleEl.innerHTML =
    `<img src="img/bhel-logo.svg" alt="BHEL"><span>BHEL Jhansi<span class="brand-sub">${deptName} — Department Portal</span></span>`;
  loadScrapDropdown();
  loadMyScrapReports();
});

function logout() {
  apiLogout();
}

// Master database se scrap materials dropdown load karna
async function loadScrapDropdown() {
  try {
    const res = await apiFetch('/api/masters/scraps');

    if (!res.ok) {
      document.getElementById('scrapType').innerHTML = '<option value="">Failed to load materials</option>';
      return;
    }

    const scraps = await res.json();
    const select = document.getElementById('scrapType');

    if (scraps.length === 0) {
      select.innerHTML = '<option value="">No scrap materials in database</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Select Material --</option>';
    scraps.forEach(item => {
      const rate = item.baseRatePerKg || 'N/A';
      select.innerHTML += `<option value="${item.materialName}">${item.materialName} (₹${rate}/kg)</option>`;
    });
  } catch (err) {
    console.error('Scrap Dropdown Load Error:', err);
    document.getElementById('scrapType').innerHTML = '<option value="">Error loading materials</option>';
  }
}

// Naya scrap report submit karna
document.getElementById('report-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const scrapType = document.getElementById('scrapType').value;
  const weight = Number(document.getElementById('weight').value);

  try {
    const res = await apiFetch('/api/scrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrapType, weight })
    });

    if (res.ok) {
      alert('Scrap Generation Reported!');
      document.getElementById('report-form').reset();
      loadMyScrapReports();
    } else {
      const errorData = await res.json();
      alert('Failed to report scrap: ' + (errorData.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Form submission error:', err);
    alert('Error submitting form');
  }
});

// Apne department ki saari reports load karna
async function loadMyScrapReports() {
  try {
    const res = await apiFetch('/api/scrap');

    const data = await res.json();
    const tbody = document.getElementById('dept-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No scrap reports submitted yet.</td></tr>';
      return;
    }

    data.forEach(item => {
      const date = new Date(item.reportedDate).toLocaleDateString('en-IN');
      const badge = item.status === 'Pending' ? 'bg-warning text-dark' : 'bg-success text-white';
      tbody.innerHTML += `
        <tr>
          <td><strong>${item.scrapType}</strong></td>
          <td>${item.weight} kg</td>
          <td>${date}</td>
          <td><span class="badge ${badge}">${item.status}</span></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error loading reports:', err);
    document.getElementById('dept-table-body').innerHTML =
      '<tr><td colspan="4" class="text-danger text-center">Error loading reports</td></tr>';
  }
}
