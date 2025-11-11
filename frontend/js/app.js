document.addEventListener('DOMContentLoaded', () => {
    const rawResponseBox = document.getElementById('rawResponse');
    const timelineList = document.getElementById('activityTimeline');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const healthStatusEl = document.getElementById('healthStatus');
    const healthServicesEl = document.getElementById('healthServices');
    const sidebarHealthEl = document.getElementById('sidebarHealth');

    const state = {
        users: [],
        restaurants: [],
        orders: [],
        payments: []
    };

    const serviceMap = {
        users: {
            endpoint: '/api/user/users/',
            buttonId: 'fetchUsersBtn',
            tableContainer: 'usersTableContainer',
            preferredColumns: ['id', 'username', 'email', 'role']
        },
        restaurants: {
            endpoint: '/api/restaurant/restaurants/',
            buttonId: 'fetchRestaurantsBtn',
            tableContainer: 'restaurantsTableContainer',
            preferredColumns: ['id', 'name', 'city', 'status']
        },
        orders: {
            endpoint: '/api/order/orders/',
            buttonId: 'fetchOrdersBtn',
            tableContainer: 'ordersTableContainer',
            preferredColumns: ['id', 'user_id', 'restaurant_id', 'status']
        },
        payments: {
            endpoint: '/api/payment/payments/',
            buttonId: 'fetchPaymentsBtn',
            tableContainer: 'paymentsTableContainer',
            preferredColumns: ['id', 'order_id', 'status', 'amount']
        }
    };

    initializeUserProfile();
    attachEventHandlers();

    checkGatewayHealth();
    ['users', 'restaurants'].forEach(handleServiceFetch);

    function attachEventHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        Object.entries(serviceMap).forEach(([key, config]) => {
            const button = document.getElementById(config.buttonId);
            if (button) {
                button.addEventListener('click', () => handleServiceFetch(key));
            }
        });

        document.querySelectorAll('.section-refresh').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-service');
                if (target) {
                    handleServiceFetch(target);
                }
            });
        });

        const refreshHealthBtn = document.getElementById('refreshHealthBtn');
        if (refreshHealthBtn) {
            refreshHealthBtn.addEventListener('click', checkGatewayHealth);
        }
    }

    function initializeUserProfile() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userId').textContent = user.id ?? 'N/A';
            document.getElementById('userUsername').textContent = user.username ?? 'N/A';
            document.getElementById('userRole').textContent = user.role ?? 'N/A';
        } else {
            window.location.href = 'login.html';
        }
    }

    async function handleServiceFetch(serviceKey) {
        const config = serviceMap[serviceKey];
        if (!config) return;

        setSectionLoading(config.tableContainer);
        setRawResponse('Loading...');

        try {
            const payload = await fetchWithAuth(config.endpoint);
            if (typeof payload === 'undefined') {
                throw new Error('Tidak ada respons dari server');
            }

            const records = normalizeCollection(payload);
            state[serviceKey] = records;

            renderTable(config.tableContainer, records, config.preferredColumns);
            updateMetrics();
            updateTimeline();
            setLastUpdated();

            setRawResponse(payload);
        } catch (error) {
            console.error(`Failed to fetch ${serviceKey}:`, error);
            displaySectionError(config.tableContainer, error.message);
            setRawResponse({ success: false, service: serviceKey, error: error.message });
        }
    }

    function normalizeCollection(payload) {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
        if (Array.isArray(payload.items)) return payload.items;
        if (Array.isArray(payload.results)) return payload.results;
        if (Array.isArray(payload.content)) return payload.content;
        if (Array.isArray(payload.rows)) return payload.rows;
        if (payload.payload && Array.isArray(payload.payload)) return payload.payload;

        const objectValues = Object.values(payload).filter(Boolean);
        if (objectValues.every((value) => Array.isArray(value))) {
            return objectValues.flat();
        }
        if (objectValues.length && objectValues.every((value) => typeof value === 'object')) {
            return objectValues;
        }

        return [payload];
    }

    function renderTable(containerId, records, preferredColumns = []) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!records || records.length === 0) {
            container.innerHTML = '<p class="placeholder">Belum ada data dari layanan ini.</p>';
            return;
        }

        const columns = deriveColumns(records, preferredColumns);
        const headerHtml = columns.map((col) => `<th>${formatHeader(col)}</th>`).join('');
        const rowsHtml = records.slice(0, 25).map((item) => {
            const cells = columns.map((col) => `<td>${formatCell(item[col])}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        container.innerHTML = `
            <table>
                <thead>
                    <tr>${headerHtml}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <p class="placeholder">Menampilkan ${Math.min(records.length, 25)} dari ${records.length} baris.</p>
        `;
    }

    function deriveColumns(records, preferredColumns) {
        const sampleKeys = new Set();
        records.slice(0, 5).forEach((item) => {
            Object.keys(item || {}).forEach((key) => {
                if (typeof item[key] !== 'object' || item[key] === null) {
                    sampleKeys.add(key);
                }
            });
        });

        const ordered = preferredColumns.filter((col) => sampleKeys.has(col));
        const remaining = Array.from(sampleKeys).filter((col) => !ordered.includes(col));

        return [...ordered, ...remaining].slice(0, 6);
    }

    function formatHeader(key) {
        return (key || '')
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function formatCell(value) {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'object') {
            return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
        }
        if (looksLikeDate(value)) {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
        }
        return value;
    }

    function looksLikeDate(value) {
        return typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value);
    }

    function setSectionLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<p class="placeholder">Loading data...</p>';
        }
    }

    function displaySectionError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class="placeholder">${message || 'Gagal memuat data.'}</p>`;
        }
    }

    function setRawResponse(payload) {
        if (!rawResponseBox) return;
        if (typeof payload === 'string') {
            rawResponseBox.textContent = payload;
        } else {
            rawResponseBox.textContent = JSON.stringify(payload, null, 2);
        }
    }

    function setLastUpdated() {
        if (!lastUpdatedEl) return;
        const now = new Date();
        lastUpdatedEl.textContent = `Updated ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function updateMetrics() {
        updateMetricCard('metricUsers', 'metricUsersMeta', state.users.length, summarizeRoles(state.users));

        const activeRestaurants = state.restaurants.filter((restaurant) => {
            return isActiveValue(restaurant.status) || isActiveValue(restaurant.is_active) || isActiveValue(restaurant.isOpen);
        }).length;
        updateMetricCard('metricRestaurants', 'metricRestaurantsMeta', state.restaurants.length, activeRestaurants ? `${activeRestaurants} aktif` : 'Status belum tersedia');

        const pendingOrders = state.orders.filter((order) => matchesStatus(order.status, ['pending', 'preparing', 'accepted'])).length;
        updateMetricCard('metricOrders', 'metricOrdersMeta', state.orders.length, pendingOrders ? `${pendingOrders} in progress` : 'Tidak ada order berjalan');

        const totalPayments = state.payments.reduce((sum, payment) => sum + detectAmount(payment), 0);
        const formattedTotal = formatCurrency(totalPayments);
        updateMetricCard('metricPayments', 'metricPaymentsMeta', formattedTotal, state.payments.length ? `${state.payments.length} transaksi` : 'Belum ada pembayaran');
    }

    function updateMetricCard(valueId, metaId, value, metaText) {
        const valueEl = document.getElementById(valueId);
        const metaEl = document.getElementById(metaId);
        if (valueEl) valueEl.textContent = value;
        if (metaEl) metaEl.textContent = metaText || '';
    }

    function summarizeRoles(users) {
        if (!users.length) return 'Menunggu data';
        const adminCount = users.filter((user) => matchesStatus(user.role, ['admin'])).length;
        return adminCount ? `${adminCount} admin terdeteksi` : 'Belum ada admin';
    }

    function isActiveValue(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.toLowerCase();
            return ['active', 'open', 'available', 'ready'].includes(normalized);
        }
        return false;
    }

    function matchesStatus(value, allowed) {
        if (!value) return false;
        return allowed.includes(String(value).toLowerCase());
    }

    function detectAmount(payment) {
        if (!payment || typeof payment !== 'object') return 0;
        const candidates = ['amount', 'total', 'nominal', 'grand_total', 'price'];
        for (const key of candidates) {
            const candidateValue = payment[key];
            if (candidateValue !== undefined && candidateValue !== null) {
                const parsed = Number(candidateValue);
                if (!Number.isNaN(parsed)) {
                    return parsed;
                }
            }
        }
        return 0;
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function updateTimeline() {
        if (!timelineList) return;

        const events = [];

        state.orders.forEach((order) => {
            events.push({
                type: 'Order',
                id: order.id ?? order.order_id ?? order.orderId ?? order.code,
                status: order.status ?? order.orderStatus ?? 'N/A',
                ref: order.user_id ?? order.customer_id ?? order.customerId,
                date: guessDate(order)
            });
        });

        state.payments.forEach((payment) => {
            events.push({
                type: 'Payment',
                id: payment.id ?? payment.payment_id ?? payment.reference,
                status: payment.status ?? payment.paymentStatus ?? 'N/A',
                ref: payment.order_id ?? payment.orderId,
                date: guessDate(payment),
                amount: detectAmount(payment)
            });
        });

        const recent = events
            .filter((event) => event.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        if (!recent.length) {
            timelineList.innerHTML = '<li class="placeholder">Timeline akan tampil setelah data order atau payment tersedia.</li>';
            return;
        }

        timelineList.innerHTML = recent.map((event) => {
            const refPart = event.ref ? `<span>Ref: ${event.ref}</span>` : '';
            const amountPart = event.amount ? `<span>${formatCurrency(event.amount)}</span>` : '';
            return `
                <li class="timeline-item">
                    <strong>${event.type}</strong> #${event.id ?? '-'} - ${event.status}
                    <span>${formatDate(event.date)}</span>
                    ${refPart}
                    ${amountPart}
                </li>
            `;
        }).join('');
    }

    function guessDate(entity) {
        if (!entity) return null;
        const candidates = [
            'updated_at',
            'updatedAt',
            'created_at',
            'createdAt',
            'orderDate',
            'date',
            'timestamp',
            'paid_at',
            'payment_date',
            'paymentDate'
        ];
        for (const key of candidates) {
            if (entity[key]) return entity[key];
        }
        return null;
    }

    function formatDate(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    }

    async function checkGatewayHealth() {
        if (!healthStatusEl || !healthServicesEl) return;

        setHealthState('Checking...');
        healthServicesEl.innerHTML = '<li>Memeriksa...</li>';

        try {
            const response = await fetch(`${API_GATEWAY_URL}/health`);
            if (!response.ok) {
                throw new Error(`Gateway health failed: ${response.status}`);
            }
            const data = await response.json();
            const isHealthy = data.status === 'healthy';
            applyHealthState(isHealthy, data.status || 'unknown');

            const services = Array.isArray(data.services) ? data.services : [];
            healthServicesEl.innerHTML = services.length
                ? services.map((service) => `<li>${service}</li>`).join('')
                : '<li>Tidak ada daftar service.</li>';
        } catch (error) {
            console.error('Health check failed:', error);
            applyHealthState(false, 'Unavailable');
            healthServicesEl.innerHTML = '<li>Gateway tidak dapat dihubungi</li>';
        }
    }

    function setHealthState(label) {
        if (!healthStatusEl) return;
        healthStatusEl.textContent = label;
        healthStatusEl.classList.remove('healthy', 'down');
    }

    function applyHealthState(isHealthy, label) {
        setHealthState(label);
        if (healthStatusEl) {
            healthStatusEl.classList.add(isHealthy ? 'healthy' : 'down');
        }

        if (sidebarHealthEl) {
            sidebarHealthEl.textContent = label;
            sidebarHealthEl.classList.remove('healthy', 'down');
            sidebarHealthEl.classList.add(isHealthy ? 'healthy' : 'down');
        }
    }
});
