const BASE_URL = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiFetch('/auth/me'),
  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiFetch(`/events${qs}`);
  },
  getEvent: (id) => apiFetch(`/events/${id}`),
  createEvent: (eventData) => apiFetch('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, updates) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  joinWaitlist: (eventId) => apiFetch(`/events/${eventId}/waitlist`, { method: 'POST' }),

  // Registrations (Atomic Lock)
  registerForEvent: (eventId) => apiFetch('/registrations', { method: 'POST', body: JSON.stringify({ eventId }) }),
  getMyTickets: () => apiFetch('/registrations/my'),
  cancelRegistration: (id) => apiFetch(`/registrations/${id}`, { method: 'DELETE' }),
  getEventAttendees: (eventId) => apiFetch(`/registrations/event/${eventId}`),

  // Check-In (Door Scanner)
  verifyTicket: (ticketCode) => apiFetch('/checkin/verify', { method: 'POST', body: JSON.stringify({ ticketCode }) }),

  // Admin
  getAdminStats: () => apiFetch('/admin/stats'),
  getAdminSummary: () => apiFetch('/admin/events-summary')
};
