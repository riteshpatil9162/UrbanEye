import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Gift, Trash2, X } from 'lucide-react';
import { getVouchers, createVoucher, deleteVoucher } from '../../services/voucherService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', pointsRequired: 50,
    expiryDate: '', category: 'Other', totalQuantity: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = () => {
    getVouchers()
      .then((res) => setVouchers(res.data.vouchers))
      .catch(() => toast.error('Failed to load vouchers.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createVoucher({ ...form, totalQuantity: form.totalQuantity || null });
      toast.success('Voucher created!');
      setModalOpen(false);
      setForm({ title: '', description: '', pointsRequired: 50, expiryDate: '', category: 'Other', totalQuantity: '' });
      fetchVouchers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoucher(id);
      toast.success('Voucher deactivated.');
      fetchVouchers();
    } catch { toast.error('Failed.'); }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">Reward Vouchers</h1>
          <p className="page-subtitle">Manage citizen reward vouchers</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Create Voucher
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-16 text-center">
          <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No vouchers created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v, i) => (
            <motion.div
              key={v._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{v.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{v.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-primary-600">{v.pointsRequired} pts</span>
                <span className="text-gray-400">Expires {formatDate(v.expiryDate)}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Redeemed by {v.redeemedBy?.length || 0} citizens
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Create Voucher</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field h-20 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Points Required *</label>
                  <input type="number" value={form.pointsRequired} onChange={(e) => setForm({...form, pointsRequired: e.target.value})} className="input-field" min={1} required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="input-field">
                    {['Food','Transport','Shopping','Healthcare','Education','Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expiry Date *</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="label">Quantity (empty = unlimited)</label>
                  <input type="number" value={form.totalQuantity} onChange={(e) => setForm({...form, totalQuantity: e.target.value})} className="input-field" placeholder="Unlimited" min={1} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Creating...' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VouchersPage;
