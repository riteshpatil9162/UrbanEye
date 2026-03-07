import API from './api';

export const getDashboardStats = () => API.get('/api/officer/stats');
export const getOfficerIssues = (params) => API.get('/api/officer/issues', { params });
export const getOfficerIssueDetail = (id) => API.get(`/api/officer/issues/${id}`);
export const verifyIssue = (id) => API.put(`/api/officer/issues/${id}/verify`);
export const assignIssue = (id, workerId) => API.put(`/api/officer/issues/${id}/assign`, { workerId });
export const rejectIssue = (id, reason) => API.put(`/api/officer/issues/${id}/reject`, { reason });
export const verifyResolution = (id, approved, workerNotes) =>
  API.put(`/api/officer/issues/${id}/verify-resolution`, { approved, workerNotes });
export const getWorkers = (params) => API.get('/api/officer/workers', { params });
export const createStaff = (data) => API.post('/api/officer/staff', data);
