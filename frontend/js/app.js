document.addEventListener('DOMContentLoaded', () => {
    const resultBox = document.getElementById('result');

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // 1. Tombol Fetch Users
    document.getElementById('fetchUsersBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // PERBAIKAN: Menambahkan trailing slash (/) di akhir endpoint
        const data = await fetchWithAuth('/api/user/users/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });

    // 2. Tombol Fetch Restaurants
    document.getElementById('fetchRestaurantsBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // PERBAIKAN: Menambahkan trailing slash (/) di akhir endpoint
        const data = await fetchWithAuth('/api/restaurant/restaurants/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });

    // 3. Tombol Fetch Orders
    document.getElementById('fetchOrdersBtn').addEventListener('click', async () => {
        resultBox.textContent = 'Loading...';
        // PERBAIKAN: Menambahkan trailing slash (/) di akhir endpoint
        const data = await fetchWithAuth('/api/order/orders/');
        resultBox.textContent = JSON.stringify(data, null, 2);
    });
});