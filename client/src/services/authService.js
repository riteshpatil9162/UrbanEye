import API from './api';

export const register = (data) => API.post('/api/auth/register', data);
export const login = (data) => API.post('/api/auth/login', data);
export const getMe = () => API.get('/api/auth/me');
export const updateProfile = (data) => API.put('/api/auth/profile', data);
export const changePassword = (data) => API.put('/api/auth/change-password', data);
export const getDemoUsers = () => API.get('/api/auth/demo-users');
