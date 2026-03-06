import API from './api';

export const getWorkerIssues = (params) => API.get('/api/worker/issues', { params });
export const acceptIssue = (id) => API.put(`/api/worker/issues/${id}/accept`);
export const rejectWorkerIssue = (id) => API.put(`/api/worker/issues/${id}/reject`);
export const uploadResolutionProof = (id, formData) =>
  API.put(`/api/worker/issues/${id}/resolve`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getOptimizedRoute = () => API.get('/api/worker/route');
export const updateAvailability = (data) => API.put('/api/worker/availability', data);
