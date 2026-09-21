const BASE_URL = '/api';

/**
 * Enhanced fetch wrapper with JWT header, error handling, and JSON parsing
 */
async function request(endpoint, options = {}) {
  const rawToken = localStorage.getItem('dagi_token');
  const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login, clear token and notify
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('dagi_token');
      localStorage.removeItem('dagi_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || (data.errors ? data.errors[0]?.message : 'An error occurred');
    throw new Error(errorMsg);
  }

  return data;
}

export const authAPI = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getProfile: () => request('/auth/me'),
  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

export const dashboardAPI = {
  getSummary: () => request('/dashboard/summary'),
  getTopDebtors: (limit = 10) => request(`/dashboard/top-debtors?limit=${limit}`),
};

export const customersAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return request(`/customers${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/customers/${id}`),
  create: (data) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status, blacklist_reason) =>
    request(`/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, blacklist_reason }),
    }),
  delete: (id) =>
    request(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

export const creditsAPI = {
  listByCustomer: (customerId) => request(`/customers/${customerId}/credits`),
  create: (customerId, data) =>
    request(`/customers/${customerId}/credits`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (creditId, data) =>
    request(`/credits/${creditId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (creditId) =>
    request(`/credits/${creditId}`, {
      method: 'DELETE',
    }),
};

export const paymentsAPI = {
  listByCustomer: (customerId) => request(`/customers/${customerId}/payments`),
  create: (customerId, data) =>
    request(`/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (paymentId) =>
    request(`/payments/${paymentId}`, {
      method: 'DELETE',
    }),
};

export const activityAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return request(`/activity${qs ? `?${qs}` : ''}`);
  },
  listByCustomer: (customerId) => request(`/activity/customer/${customerId}`),
};
