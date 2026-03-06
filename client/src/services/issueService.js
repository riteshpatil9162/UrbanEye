import API from './api';

export const reportIssue = (formData) =>
  API.post('/api/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const validateIssueImage = (formData) =>
  API.post('/api/issues/validate-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getIssues = (params) => API.get('/api/issues', { params });
export const getIssue = (id) => API.get(`/api/issues/${id}`);
export const getMyIssues = (params) => API.get('/api/issues/my-issues', { params });
export const likeIssue = (id) => API.put(`/api/issues/${id}/like`);
export const confirmResolution = (id) => API.put(`/api/issues/${id}/confirm`);
