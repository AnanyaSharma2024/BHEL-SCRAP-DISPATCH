// Yeh helper har page use karega instead of plain fetch().
// Kaam: 1) Authorization header automatically lagana
//       2) Agar access token expire ho gaya (401) -> silently refresh-token cookie se naya
//          access token mangwana -> wahi request ek baar phir try karna
//       3) Agar refresh bhi fail ho jaaye -> user ko logout karke login page pe bhej dena

let isRefreshing = false;
let refreshWaiters = [];

async function refreshAccessToken() {
    if (isRefreshing) {
        // Agar already ek refresh chal rahi hai, to usi ka result wait karo (duplicate calls na ho)
        return new Promise((resolve) => refreshWaiters.push(resolve));
    }

    isRefreshing = true;
    try {
        const res = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            credentials: 'include' // httpOnly refresh cookie automatically bhej deta hai browser
        });

        if (!res.ok) {
            isRefreshing = false;
            refreshWaiters.forEach((fn) => fn(null));
            refreshWaiters = [];
            return null;
        }

        const data = await res.json();
        localStorage.setItem('token', data.token);

        isRefreshing = false;
        refreshWaiters.forEach((fn) => fn(data.token));
        refreshWaiters = [];
        return data.token;
    } catch (err) {
        isRefreshing = false;
        refreshWaiters.forEach((fn) => fn(null));
        refreshWaiters = [];
        return null;
    }
}

function forceLogoutToLogin() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// apiFetch(url, options) -> same signature as fetch(), use this everywhere instead of fetch()
async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    let token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(url, options);

    if (res.status === 401) {
        // Access token expire ho gaya hoga - silently refresh karke ek baar phir try karo
        const newToken = await refreshAccessToken();
        if (!newToken) {
            forceLogoutToLogin();
            // Caller ko ek "never resolves usefully" response na milte rahe, isliye yahin throw
            throw new Error('Session expired. Please log in again.');
        }
        options.headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, options);
    }

    return res;
}

// Server-side refresh token cookie bhi clear karne ke liye, sirf localStorage clear karna kaafi nahi
async function apiLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
        // Network fail ho bhi jaaye, local session to clear ho hi jaayega
    }
    localStorage.clear();
    window.location.href = 'login.html';
}
