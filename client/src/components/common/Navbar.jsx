import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const map = { citizen: '/citizen', officer: '/officer', worker: '/worker' };
    return map[user.role] || '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">Urban</span>
              <span className="text-lg font-bold text-primary-600">Eye</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
                <Link to="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
                <Link to="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  How It Works
                </Link>
                <Link to="/login" className="btn-secondary text-sm py-2">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to={getDashboardPath()} className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
                <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 leading-none">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50"
                        onBlur={() => setDropdownOpen(false)}
                      >
                        <div className="px-3 py-2 border-b border-gray-50">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {user.role === 'citizen' && (
                          <div className="px-3 py-2 border-b border-gray-50">
                            <p className="text-xs text-gray-500">Reward Points</p>
                            <p className="text-sm font-semibold text-primary-600">{user.points || 0} pts</p>
                          </div>
                        )}
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2"
          >
            {!user ? (
              <>
                <Link to="/login" className="btn-secondary !flex w-full justify-center" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary !flex w-full justify-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                  <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <Link to={getDashboardPath()} className="sidebar-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="btn-danger w-full justify-center mt-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
