document.addEventListener('DOMContentLoaded', () => {
    const resultBox = document.getElementById('result');
    
    // --- Inisialisasi Data Pengguna di Sidebar ---
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userId').textContent = user.id;
        document.getElementById('userUsername').textContent = user.username;
        document.getElementById('userRole').textContent = user.role;
    } else {
        // Redirect jika user tidak terautentikasi
        window.location.href = 'login.html';
    }
    // --- End Inisialisasi ---

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // 1. Tombol Fetch Users
    document.getElementById('fetchUsersBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // Endpoint: /api/{service_name}/{resource}
        const data = await fetchWithAuth('/api/user/users/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });

    // 2. Tombol Fetch Restaurants
    document.getElementById('fetchRestaurantsBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // Endpoint: /api/{service_name}/{resource}
        const data = await fetchWithAuth('/api/restaurant/restaurants/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });

    // 3. Tombol Fetch Orders
    document.getElementById('fetchOrdersBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // Endpoint: /api/{service_name}/{resource}
        const data = await fetchWithAuth('/api/order/orders/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });
});