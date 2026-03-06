import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, Clock, TrendingUp, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { getWorkers, createStaff } from '../../services/officerService';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { AREAS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'worker', area: '', phone: '' };

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = () => {
    setLoading(true);
    getWorkers()
      .then((res) => setWorkers(res.data.workers))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      await createStaff(form);
      toast.success(`${form.role === 'worker' ? 'Worker' : 'Officer'} account created!`);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchWorkers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="page-title">Worker Management</h1>
          <p className="page-subtitle">{workers.length} registered workers</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="btn-primary gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Workers', value: workers.length, color: 'text-blue-600 bg-blue-50', icon: Users },
          { label: 'Available', value: workers.filter((w) => w.isAvailable).length, color: 'text-green-600 bg-green-50', icon: CheckCircle },
          { label: 'On Task', value: workers.filter((w) => !w.isAvailable).length, color: 'text-orange-600 bg-orange-50', icon: Clock },
          { label: 'Avg. Efficiency', value: workers.length > 0 ? `${Math.round(workers.reduce((a, w) => a + parseInt(w.efficiency || 0), 0) / workers.length)}%` : '0%', color: 'text-purple-600 bg-purple-50', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? <TableSkeleton rows={5} cols={6} /> : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Worker</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Area</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Assigned</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Resolved</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    No workers registered
                  </td>
                </tr>
              ) : workers.map((worker) => (
                <tr key={worker._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {worker.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{worker.name}</p>
                        <p className="text-xs text-gray-400">{worker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{worker.area?.split(',')[0]}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${worker.isAvailable ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <span className="text-xs text-gray-700">{worker.isAvailable ? 'Available' : 'On Task'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-gray-900">{worker.totalAssigned}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-green-700">{worker.resolved}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${worker.efficiency}%`,
                            background: worker.efficiency >= 70 ? '#10b981' : worker.efficiency >= 40 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{worker.efficiency}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Add New Staff Account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Create a worker or officer account</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
                {/* Role toggle */}
                <div>
                  <label className="label">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['worker', 'officer'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm({ ...form, role: r })}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                          form.role === r
                            ? r === 'worker'
                              ? 'bg-green-50 border-green-400 text-green-700'
                              : 'bg-purple-50 border-purple-400 text-purple-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="9876543210"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Area</label>
                    <select
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select area</option>
                      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary justify-center py-2"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Create Account</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkersPage;
