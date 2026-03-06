import API from './api';

export const getNotifications = (params) => API.get('/api/notifications', { params });
export const markAsRead = (id) => API.put(`/api/notifications/${id}/read`);
export const markAllAsRead = () => API.put('/api/notifications/read-all');
export const deleteNotification = (id) => API.delete(`/api/notifications/${id}`);
