import API from './api';

export const getVouchers = () => API.get('/api/vouchers');
export const createVoucher = (data) => API.post('/api/vouchers', data);
export const redeemVoucher = (id) => API.post(`/api/vouchers/${id}/redeem`);
export const deleteVoucher = (id) => API.delete(`/api/vouchers/${id}`);
