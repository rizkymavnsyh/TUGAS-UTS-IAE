// Alamat API Gateway Anda
const API_GATEWAY_URL = 'http://localhost:3000';

// Login function [cite: 407]
const login = async (username, password) => {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Connection error' };
  }
};

// Fungsi helper untuk request terotentikasi [cite: 428]
const fetchWithAuth = async (endpoint) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            logout();
            return;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
};

// Logout function [cite: 445]
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
};