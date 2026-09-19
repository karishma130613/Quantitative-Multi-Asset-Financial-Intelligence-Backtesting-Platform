// QUANTLAB API Client Service
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // Default for local development vs same-origin production deployment
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('quantlab_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Extract detailed validation errors if returned by FastAPI (e.g. 422)
      let errorMsg = data.detail || data.message;
      if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      }
      if (!errorMsg) {
        if (res.status === 404 && !import.meta.env.VITE_API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          errorMsg = 'Backend API URL is not configured. In your cloud deployment dashboard (e.g. Vercel / Netlify), set VITE_API_URL to your backend URL (e.g. https://your-backend.onrender.com).';
        } else {
          errorMsg = `Request failed with status ${res.status}`;
        }
      }
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    // If it's a TypeError from fetch, the backend is either down, waking up, or blocked by CORS
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(
        'Unable to reach QUANTLAB backend server. If freshly deployed or on a cold-start host (e.g. Render/Railway), please allow ~30 seconds for the backend to spin up.'
      );
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    signup: (body) => request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        email: body.email ? body.email.trim().toLowerCase() : body.email,
      })
    }),
    login: (body) => request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        email: body.email ? body.email.trim().toLowerCase() : body.email,
      })
    }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    forgotPassword: (body) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request('/api/auth/me'),
    updateProfile: (body) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Market
  market: {
    getAssets: () => request('/api/market/assets'),
    getHistory: (symbol, startDate, endDate) => {
      let query = `?symbol=${encodeURIComponent(symbol)}`;
      if (startDate) query += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) query += `&end_date=${encodeURIComponent(endDate)}`;
      return request(`/api/market/history${query}`);
    },
  },

  // Correlation
  correlation: {
    getMatrix: (startDate, endDate, rollingWindow = 60) => {
      let query = `?rolling_window=${rollingWindow}`;
      if (startDate) query += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) query += `&end_date=${encodeURIComponent(endDate)}`;
      return request(`/api/correlation/matrix${query}`);
    },
  },

  // Strategy Lab
  strategy: {
    getPresets: () => request('/api/strategy/presets'),
    runBacktest: (body) => request('/api/strategy/backtest', { method: 'POST', body: JSON.stringify(body) }),
    runVisualBacktest: (body) => request('/api/strategy/visual-backtest', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Strategy Detective
  detective: {
    analyze: (body) => request('/api/detective/analyze', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Market Weather
  weather: {
    getTimeline: (asset, startDate, endDate) => {
      let query = `?asset=${encodeURIComponent(asset)}`;
      if (startDate) query += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) query += `&end_date=${encodeURIComponent(endDate)}`;
      return request(`/api/weather/timeline${query}`);
    },
  },

  // Stress Testing
  stress: {
    run: (body) => request('/api/stress/run', { method: 'POST', body: JSON.stringify(body) }),
  },

  // AI Research Assistant
  ai: {
    query: (query, contextData) => request('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, context_data: contextData }),
    }),
  },

  // Experiments & Saved Strategies
  experiments: {
    list: () => request('/api/experiments'),
    save: (body) => request('/api/experiments', { method: 'POST', body: JSON.stringify(body) }),
    rename: (id, name) => request(`/api/experiments/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
    delete: (id) => request(`/api/experiments/${id}`, { method: 'DELETE' }),
    listSavedStrategies: () => request('/api/experiments/saved-strategies/list'),
    saveStrategy: (body) => request('/api/experiments/saved-strategies/save', { method: 'POST', body: JSON.stringify(body) }),
    deleteStrategy: (id) => request(`/api/experiments/saved-strategies/${id}`, { method: 'DELETE' }),
  },
};
