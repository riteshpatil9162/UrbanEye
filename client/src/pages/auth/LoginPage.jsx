import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Eye, EyeOff, LogIn, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDemoUsers } from '../../services/authService';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  citizen: { btn: 'text-blue-600 border-blue-200 hover:bg-blue-50', item: 'hover:bg-blue-50 hover:text-blue-700' },
  officer: { btn: 'text-purple-600 border-purple-200 hover:bg-purple-50', item: 'hover:bg-purple-50 hover:text-purple-700' },
  worker:  { btn: 'text-green-600 border-green-200 hover:bg-green-50',  item: 'hover:bg-green-50 hover:text-green-700' },
};

const DemoDropdown = ({ role, users, onSelect, loadingUsers }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const colors = ROLE_COLORS[role];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loadingUsers}
        className={`w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border capitalize font-medium transition-colors ${colors.btn} disabled:opacity-50`}
      >
        <span>{role}</span>
        {loadingUsers
          ? <Loader2 className="w-3 h-3 ml-1 animate-spin" />
          : <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {users.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No {role}s found</div>
            ) : users.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => { onSelect(u); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs text-gray-700 transition-colors border-b border-gray-50 last:border-0 ${colors.item}`}
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-gray-400 truncate">{u.email}</div>
                {u.area && <div className="text-gray-300 truncate">{u.area}</div>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoginPage = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState({ citizen: [], officer: [], worker: [] });
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    getDemoUsers()
      .then((res) => setDemoUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const paths = { citizen: '/citizen', officer: '/officer', worker: '/worker' };
      navigate(paths[user.role] || '/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (acc) => {
    setForm({ email: acc.email, password: '' });
    setLoading(true);
    try {
      const user = await loginWithToken(acc.token);
      toast.success(`Welcome, ${user.name}!`);
      const paths = { citizen: '/citizen', officer: '/officer', worker: '/worker' };
      navigate(paths[user.role] || '/');
    } catch (err) {
      toast.error('Quick login failed. Try logging in manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Urban<span className="text-primary-600">Eye</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">
              Quick login — all accounts from database
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['citizen', 'officer', 'worker'].map((role) => (
                <DemoDropdown
                  key={role}
                  role={role}
                  users={demoUsers[role] || []}
                  onSelect={handleDemoSelect}
                  loadingUsers={loadingUsers}
                />
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
