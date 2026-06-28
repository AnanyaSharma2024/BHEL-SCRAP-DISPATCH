const token = localStorage.getItem('token');
if (!token || localStorage.getItem('role') !== 'admin') {
    window.location.href = 'login.html';
}

function logout() {
    apiLogout();
}

document.addEventListener('DOMContentLoaded', () => {
    loadPendingRequests();
    loadDashboardStats();
});

async function loadPendingRequests() {
    try {
        const res = await apiFetch('/api/scrap');

        if (!res.ok) {
            return;
        }

        const data = await res.json();
        const tbody = document.getElementById('admin-table-body');
        tbody.innerHTML = '';
        document.getElementById('stat-pending-count').innerText = data.length;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No pending release requests from departments.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const date = new Date(item.reportedDate).toLocaleDateString('en-IN');
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.department}</strong></td>
                    <td>${item.scrapType}</td>
                    <td>${item.weight} kg</td>
                    <td>${date}</td>
                    <td class="text-center">
                        <button onclick="goToDispatch('${item._id}', '${item.scrapType}', '${item.weight}', '${item.department}')" class="btn btn-sm btn-success">Prepare Dispatch</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadDashboardStats() {
    try {
        const res = await apiFetch('/api/dispatches/history');

        if (!res.ok) {
            return;
        }

        const historyData = await res.json();
        let totalWeight = 0;
        historyData.forEach(item => { totalWeight += Number(item.weight || 0); });

        document.getElementById('stat-dispatched-weight').innerText = `${totalWeight.toLocaleString('en-IN')} kg`;
        document.getElementById('stat-truck-count').innerText = historyData.length;
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

// 'Prepare Dispatch' button click -> dispatch-form.html pe data le jaata hai
function goToDispatch(id, type, weight, dept) {
    localStorage.setItem('temp_dispatch_id', id);
    localStorage.setItem('temp_dispatch_type', type);
    localStorage.setItem('temp_dispatch_weight', weight);
    localStorage.setItem('temp_dispatch_dept', dept);
    window.location.href = 'dispatch-form.html';
}
