document.addEventListener('DOMContentLoaded', () => {
    const rawResponseBox = document.getElementById('rawResponse');
    const timelineList = document.getElementById('activityTimeline');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const healthStatusEl = document.getElementById('healthStatus');
    const healthServicesEl = document.getElementById('healthServices');
    const sidebarHealthEl = document.getElementById('sidebarHealth');

    const crudModalElement = document.getElementById('crudModal');
    const bootstrapModal = new bootstrap.Modal(crudModalElement);
    const modalTitle = document.getElementById('modalTitle');
    const crudForm = document.getElementById('crudForm');
    const formFieldsContainer = document.getElementById('formFields');

    let currentService = '';
    let currentOperation = '';
    let currentRecordId = null;

    const state = {
        users: [],
        restaurants: [],
        orders: [],
        payments: []
    };

    const serviceMap = {
        users: {
            endpoint: '/api/user/users/',
            createEndpoint: '/api/user/users/',
            updateEndpoint: '/api/user/users/',
            deleteEndpoint: '/api/user/users/',
            buttonId: 'fetchUsersBtn',
            createButtonId: 'createUserBtn',
            tableContainer: 'usersTableContainer',
            preferredColumns: ['id', 'username', 'name', 'role', 'balance'],
            formFields: {
                create: [
                    { name: 'username', label: 'Username', type: 'text', required: true },
                    { name: 'name', label: 'Name', type: 'text', required: false },
                    { name: 'password', label: 'Password', type: 'password', required: true },
                    { name: 'role', label: 'Role', type: 'select', options: ['user', 'admin'], required: true, defaultValue: 'user' }
                ],
                update: [
                    { name: 'username', label: 'Username', type: 'text', required: true },
                    { name: 'name', label: 'Name', type: 'text', required: false },
                    { name: 'password', label: 'Password (leave blank to keep current)', type: 'password', required: false },
                    { name: 'role', label: 'Role', type: 'select', options: ['user', 'admin'], required: true }
                ]
            }
        },
        restaurants: {
            endpoint: '/api/restaurant/restaurants/',
            createEndpoint: '/api/restaurant/restaurants/',
            updateEndpoint: '/api/restaurant/restaurants/',
            deleteEndpoint: '/api/restaurant/restaurants/',
            buttonId: 'fetchRestaurantsBtn',
            createButtonId: 'createRestaurantBtn',
            tableContainer: 'restaurantsTableContainer',
            preferredColumns: ['id', 'name', 'address', 'is_active'],
            formFields: {
                create: [
                    { name: 'name', label: 'Restaurant Name', type: 'text', required: true },
                    { name: 'address', label: 'Address', type: 'text', required: true },
                    { name: 'is_active', label: 'Is Active', type: 'checkbox', required: false, defaultValue: true }
                ],
                update: [
                    { name: 'name', label: 'Restaurant Name', type: 'text', required: true },
                    { name: 'address', label: 'Address', type: 'text', required: true },
                    { name: 'is_active', label: 'Is Active', type: 'checkbox', required: false }
                ]
            }
        },
        orders: {
            endpoint: '/api/order/orders/',
            createEndpoint: '/api/order/orders/',
            updateEndpoint: '/api/order/orders/',
            deleteEndpoint: '/api/order/orders/',
            buttonId: 'fetchOrdersBtn',
            createButtonId: 'createOrderBtn',
            tableContainer: 'ordersTableContainer',
            preferredColumns: ['id', 'user_id', 'restaurant_id', 'total_price', 'status'],
            formFields: {
                create: [
                    { name: 'user_id', label: 'User ID', type: 'number', required: true },
                    { name: 'restaurant_id', label: 'Restaurant ID', type: 'number', required: true },
                    { name: 'menu_item_id', label: 'Menu Item ID', type: 'number', required: true },
                    { name: 'quantity', label: 'Quantity', type: 'number', required: true }
                ],
                update: [
                    { name: 'status', label: 'Status', type: 'select', options: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'], required: true }
                ]
            }
        },
        payments: {
            endpoint: '/api/payment/payments/',
            createEndpoint: '/api/payment/internal/process',
            updateEndpoint: '/api/payment/payments/',
            deleteEndpoint: '/api/payment/payments/',
            buttonId: 'fetchPaymentsBtn',
            createButtonId: 'createPaymentBtn',
            tableContainer: 'paymentsTableContainer',
            preferredColumns: ['id', 'user_id', 'order_id', 'amount', 'status'],
            formFields: {
                create: [
                    { name: 'user_id', label: 'User ID', type: 'number', required: true },
                    { name: 'order_id', label: 'Order ID', type: 'number', required: true },
                    { name: 'amount', label: 'Amount', type: 'number', required: true }
                ],
                update: [
                    { name: 'status', label: 'Status', type: 'select', options: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], required: true }
                ]
            }
        }
    };

    initializeUserProfile();
    attachEventHandlers();

    checkGatewayHealth();
    ['users', 'restaurants', 'orders', 'payments'].forEach(handleServiceFetch);

    function attachEventHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        Object.entries(serviceMap).forEach(([key, config]) => {
            const fetchButton = document.getElementById(config.buttonId);
            if (fetchButton) {
                fetchButton.addEventListener('click', () => handleServiceFetch(key));
            }
            const createButton = document.getElementById(config.createButtonId);
            if (createButton) {
                createButton.addEventListener('click', () => openCrudModal(key, 'create'));
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

        crudForm.addEventListener('submit', handleSubmitCrudForm);
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

            renderTable(config.tableContainer, records, config.preferredColumns, serviceKey);
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

    function renderTable(containerId, records, preferredColumns = [], serviceKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!records || records.length === 0) {
            container.innerHTML = '<p class="text-muted">Belum ada data dari layanan ini.</p>';
            return;
        }

        const columns = deriveColumns(records, preferredColumns);
        let headerHtml = columns.map((col) => `<th>${formatHeader(col)}</th>`).join('');
        headerHtml += '<th>Actions</th>';

        const rowsHtml = records.slice(0, 25).map((item) => {
            const cells = columns.map((col) => `<td>${formatCell(item[col])}</td>`).join('');
            const actions = `
                <td>
                    <button class="btn btn-sm btn-info edit-btn me-2" data-service="${serviceKey}" data-id="${item.id}"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-service="${serviceKey}" data-id="${item.id}"><i class="bi bi-trash"></i> Delete</button>
                </td>
            `;
            return `<tr>${cells}${actions}</tr>`;
        }).join('');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>${headerHtml}</tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            <p class="text-muted">Menampilkan ${Math.min(records.length, 25)} dari ${records.length} baris.</p>
        `;

        container.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const service = event.target.dataset.service;
                const id = event.target.dataset.id;
                const record = records.find(r => String(r.id) === String(id));
                openCrudModal(service, 'update', record);
            });
        });
        container.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const service = event.target.dataset.service;
                const id = event.target.dataset.id;
                if (confirm(`Are you sure you want to delete record ${id} from ${service}?`)) {
                    handleDelete(service, id);
                }
            });
        });
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
            container.innerHTML = '<p class="text-muted">Loading data...</p>';
        }
    }

    function displaySectionError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class="text-danger">${message || 'Gagal memuat data.'}</p>`;
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
            return restaurant.is_active;
        }).length;
        updateMetricCard('metricRestaurants', 'metricRestaurantsMeta', state.restaurants.length, activeRestaurants ? `${activeRestaurants} aktif` : 'Status belum tersedia');

        const pendingOrders = state.orders.filter((order) => matchesStatus(order.status, ['pending', 'preparing', 'accepted'])).length;
        updateMetricCard('metricOrders', 'metricOrdersMeta', state.orders.length, pendingOrders ? `${pendingOrders} in progress` : 'Tidak ada order berjalan');

        const totalPayments = state.payments.reduce((sum, payment) => sum + detectAmount(payment), 0);
        const formattedTotal = formatCurrency(totalPayments);
        updateMetricCard('metricPayments', 'metricPaymentsMeta', state.payments.length ? `${state.payments.length} transaksi` : 'Belum ada pembayaran', formattedTotal);
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
        // Format as USD with 2 decimal places
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2, // Ensure 2 decimal places for USD
            maximumFractionDigits: 2
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
            timelineList.innerHTML = '<li class="text-muted">Timeline akan tampil setelah data order atau payment tersedia.</li>';
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
        healthServicesEl.innerHTML = '<li class="list-inline-item">Memeriksa...</li>';

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
                ? services.map((service) => `<li class="list-inline-item">${service}</li>`).join('')
                : '<li class="list-inline-item">Tidak ada daftar service.</li>';
        } catch (error) {
            console.error('Health check failed:', error);
            applyHealthState(false, 'Unavailable');
            healthServicesEl.innerHTML = '<li class="list-inline-item">Gateway tidak dapat dihubungi</li>';
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

    function openCrudModal(serviceKey, operation, data = null) {
        currentService = serviceKey;
        currentOperation = operation;
        currentRecordId = data ? data.id : null;

        modalTitle.textContent = `${operation === 'create' ? 'Create New' : 'Edit'} ${serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1).replace(/s$/, '')}`;
        generateFormFields(serviceKey, operation, data);
        bootstrapModal.show();
    }

    function closeCrudModal() {
        bootstrapModal.hide();
        crudForm.reset();
        formFieldsContainer.innerHTML = '';
        currentService = '';
        currentOperation = '';
        currentRecordId = null;
    }

    function generateFormFields(serviceKey, operation, data = null) {
        formFieldsContainer.innerHTML = '';
        const fields = serviceMap[serviceKey].formFields[operation];

        fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.htmlFor = field.name;
            label.className = 'form-label';
            label.textContent = field.label + (field.required ? ' *' : '');
            div.appendChild(label);

            let inputElement;
            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = 'form-select';
                field.options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                    inputElement.appendChild(opt);
                });
            } else if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.className = 'form-control';
                inputElement.rows = 4;
            } else if (field.type === 'checkbox') {
                inputElement = document.createElement('input');
                inputElement.type = 'checkbox';
                inputElement.className = 'form-check-input';
                // Create a div for form-check to wrap the checkbox and label
                const formCheckDiv = document.createElement('div');
                formCheckDiv.className = 'form-check';
                formCheckDiv.appendChild(inputElement);
                label.className = 'form-check-label'; // Adjust label class for checkbox
                formCheckDiv.appendChild(label);
                div.appendChild(formCheckDiv); // Append the wrapper div instead of inputElement directly
            } else {
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.className = 'form-control';
                if (field.type === 'number' && (field.name === 'amount' || field.name === 'price')) {
                    inputElement.step = 'any'; // Allow decimal input for amount and price
                }
            }
            
            if (field.type !== 'checkbox') { // Only append directly if not a checkbox
                div.appendChild(inputElement);
            }

            inputElement.id = field.name;
            inputElement.name = field.name;
            inputElement.required = field.required;
            if (field.placeholder) {
                inputElement.placeholder = field.placeholder;
            }

            if (data && data[field.name] !== undefined) {
                if (field.type === 'textarea' && typeof data[field.name] === 'object') {
                    inputElement.value = JSON.stringify(data[field.name], null, 2);
                } else if (field.type === 'checkbox') {
                    inputElement.checked = data[field.name];
                } else {
                    inputElement.value = data[field.name];
                }
            } else if (operation === 'create' && field.defaultValue !== undefined) {
                if (field.type === 'checkbox') {
                    inputElement.checked = field.defaultValue;
                } else {
                    inputElement.value = field.defaultValue;
                }
            }

            if (field.type !== 'checkbox') { // Append div to formFieldsContainer only once
                formFieldsContainer.appendChild(div);
            } else {
                // If it's a checkbox, the formCheckDiv already contains the input and label
                // and was appended to 'div'. Now append 'div' to 'formFieldsContainer'.
                formFieldsContainer.appendChild(div);
            }
        });
    }

    async function handleSubmitCrudForm(event) {
        event.preventDefault();
        const formData = {};
        const fields = serviceMap[currentService].formFields[currentOperation];

        fields.forEach(field => {
            const input = document.getElementById(field.name);
            if (input) {
                let value;
                if (field.type === 'checkbox') {
                    value = input.checked;
                } else {
                    value = input.value;
                }
                
                if (field.type === 'number') {
                    value = parseFloat(value);
                    if (isNaN(value)) value = null;
                } else if (field.type === 'textarea' && field.name === 'items') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        alert('Invalid JSON for items field.');
                        return;
                    }
                }
                // Only add to formData if value is not null or empty string (unless it's a boolean false)
                if (value !== null && value !== '' || typeof value === 'boolean') {
                    formData[field.name] = value;
                }
            }
        });

        // Special handling for 'orders' create operation to construct the 'items' array
        if (currentService === 'orders' && currentOperation === 'create') {
            const menuItemId = formData['menu_item_id'];
            const quantity = formData['quantity'];

            if (menuItemId !== undefined && quantity !== undefined) {
                formData['items'] = [{ menu_item_id: menuItemId, quantity: quantity }];
                delete formData['menu_item_id'];
                delete formData['quantity'];
            } else {
                alert('Menu Item ID and Quantity are required for creating an order.');
                return; // Prevent submission if required fields are missing
            }
        }

        let response;
        if (currentOperation === 'create') {
            response = await handleCreate(currentService, formData);
        } else if (currentOperation === 'update') {
            response = await handleUpdate(currentService, currentRecordId, formData);
        }

        if (response && response.success !== false) {
            showNotification(`${currentService.charAt(0).toUpperCase() + currentService.slice(1)} ${currentOperation}d successfully!`);
            closeCrudModal();
            handleServiceFetch(currentService);
        } else {
            showNotification(`Error ${currentOperation}ing ${currentService}: ${response?.error || 'Unknown error'}`, 'error');
            setRawResponse(response);
        }
    }

    async function handleCreate(serviceKey, data) {
        const config = serviceMap[serviceKey];
        const endpoint = config.createEndpoint;
        return await sendAuthenticatedRequest('POST', endpoint, data);
    }

    async function handleUpdate(serviceKey, id, data) {
        const config = serviceMap[serviceKey];
        const endpoint = `${config.updateEndpoint}${id}`;
        return await sendAuthenticatedRequest('PUT', endpoint, data);
    }

    async function handleDelete(serviceKey, id) {
        const config = serviceMap[serviceKey];
        const endpoint = `${config.deleteEndpoint}${id}`;
        const response = await sendAuthenticatedRequest('DELETE', endpoint);
        if (response && response.success !== false) {
            showNotification(`${serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1)} deleted successfully!`);
            handleServiceFetch(serviceKey);
        } else {
            showNotification(`Error deleting ${serviceKey}: ${response?.error || 'Unknown error'}`, 'error');
            setRawResponse(response);
        }
    }

    function showNotification(message, type = 'success') {
        alert(message);
        console.log(`Notification (${type}): ${message}`);
    }
});