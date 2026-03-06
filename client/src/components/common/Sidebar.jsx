import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, AlertCircle, PlusCircle, Gift, Bell,
  MapPin, BarChart2, Users, Wrench, Route, LogOut, X, CheckCircle, Users2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const citizenLinks = [
  { to: '/citizen', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/citizen/report', icon: PlusCircle, label: 'Report Issue' },
  { to: '/citizen/my-issues', icon: AlertCircle, label: 'My Issues' },
  { to: '/citizen/community', icon: Users2, label: 'Community' },
  { to: '/citizen/rewards', icon: Gift, label: 'Rewards' },
  { to: '/citizen/notifications', icon: Bell, label: 'Notifications' },
];

const officerLinks = [
  { to: '/officer', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/officer/issues', icon: AlertCircle, label: 'All Issues' },
  { to: '/officer/workers', icon: Users, label: 'Workers' },
  { to: '/officer/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/officer/vouchers', icon: Gift, label: 'Vouchers' },
  { to: '/officer/map', icon: MapPin, label: 'Map View' },
  { to: '/officer/notifications', icon: Bell, label: 'Notifications' },
];

const workerLinks = [
  { to: '/worker', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/issues', icon: AlertCircle, label: 'My Tasks' },
  { to: '/worker/route', icon: Route, label: 'Route Planner' },
  { to: '/worker/notifications', icon: Bell, label: 'Notifications' },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'citizen'
    ? citizenLinks
    : user?.role === 'officer'
    ? officerLinks
    : workerLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">
            Urban<span className="text-primary-600">Eye</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role} · {user?.area?.split(',')[0]}</p>
          </div>
        </div>
        {user?.role === 'citizen' && (
          <div className="mt-3 px-3 py-2 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Reward Points</span>
              <span className="text-sm font-bold text-primary-600">{user?.points || 0} pts</span>
            </div>
          </div>
        )}
        {user?.role === 'worker' && (
          <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${user?.isAvailable ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-xs font-medium text-gray-700">
                  {user?.isAvailable ? 'Available' : 'On Task'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/citizen') || to.endsWith('/officer') || to.endsWith('/worker')}
            onClick={onClose}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
