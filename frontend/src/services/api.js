import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Axios instance — trailing slash on all endpoints to avoid 307 redirects
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentAPI = {
  getStudents: (skip = 0, limit = 100) =>
    api.get(`/api/students/?skip=${skip}&limit=${limit}`),
  getMyProfile: () => api.get('/api/students/me'),
  getStudent: (id) => api.get(`/api/students/${id}`),
  createStudent: (data) => api.post('/api/students/', data),
  updateStudent: (id, data) => api.put(`/api/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/api/students/${id}`),
};

// ── Teachers ──────────────────────────────────────────────────────────────────
export const teacherAPI = {
  getTeachers: (skip = 0, limit = 100) =>
    api.get(`/api/teachers/?skip=${skip}&limit=${limit}`),
  getMyProfile: () => api.get('/api/teachers/me'),
  getTeacher: (id) => api.get(`/api/teachers/${id}`),
  createTeacher: (data) => api.post('/api/teachers/', data),
  updateTeacher: (id, data) => api.put(`/api/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/api/teachers/${id}`),
};

// ── Parents ───────────────────────────────────────────────────────────────────
export const parentAPI = {
  getParents: (skip = 0, limit = 100) =>
    api.get(`/api/parents/?skip=${skip}&limit=${limit}`),
  getMyProfile: () => api.get('/api/parents/me'),
  getParent: (id) => api.get(`/api/parents/${id}`),
  createParent: (data) => api.post('/api/parents/', data),
  updateParent: (id, data) => api.put(`/api/parents/${id}`, data),
  deleteParent: (id) => api.delete(`/api/parents/${id}`),
};

// ── Management ────────────────────────────────────────────────────────────────
export const managementAPI = {
  getManagementStaff: (skip = 0, limit = 100) =>
    api.get(`/api/management/?skip=${skip}&limit=${limit}`),
  getManagementStaffMember: (id) => api.get(`/api/management/${id}`),
  createManagementStaff: (data) => api.post('/api/management/', data),
  updateManagementStaff: (id, data) => api.put(`/api/management/${id}`, data),
  deleteManagementStaff: (id) => api.delete(`/api/management/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAttendance: (params = {}) =>
    api.get('/api/attendance/', { params }),
  getAttendanceRecord: (id) => api.get(`/api/attendance/${id}`),
  markAttendance: (data) => api.post('/api/attendance/', data),
  updateAttendance: (id, data) => api.put(`/api/attendance/${id}`, data),
  deleteAttendance: (id) => api.delete(`/api/attendance/${id}`),
};

// ── Homework ──────────────────────────────────────────────────────────────────
export const homeworkAPI = {
  getHomework: (params = {}) =>
    api.get('/api/homework/', { params }),
  getHomeworkDetails: (id) => api.get(`/api/homework/${id}`),
  assignHomework: (data) => api.post('/api/homework/', data),
  updateHomework: (id, data) => api.put(`/api/homework/${id}`, data),
  deleteHomework: (id) => api.delete(`/api/homework/${id}`),
};

// ── Marks ─────────────────────────────────────────────────────────────────────
export const marksAPI = {
  getMarks: (params = {}) =>
    api.get('/api/marks/', { params }),
  getMarkDetails: (id) => api.get(`/api/marks/${id}`),
  uploadMarks: (data) => api.post('/api/marks/', data),
  updateMark: (id, data) => api.put(`/api/marks/${id}`, data),
  deleteMark: (id) => api.delete(`/api/marks/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getNotifications: (params = {}) =>
    api.get('/api/notifications/', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  sendNotification: (data) => api.post('/api/notifications/', data),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
};

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (query) => api.post('/api/ai/chat', { query }),
  getChatHistory: (skip = 0, limit = 50) =>
    api.get(`/api/ai/history?skip=${skip}&limit=${limit}`),
  getChatLog: (id) => api.get(`/api/ai/history/${id}`),
};

export default api;
