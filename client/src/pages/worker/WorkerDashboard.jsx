import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWorkerIssues, updateAvailability } from '../../services/workerService';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Star, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-5 flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await getWorkerIssues();
        // Backend returns { success: true, issues: [...] }
        const data = res.data?.issues ?? res.data ?? [];
        setIssues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('WorkerDashboard fetch error:', err);
        toast.error('Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await updateAvailability(!isAvailable);
      const newVal = res.data?.isAvailable ?? !isAvailable;
      setIsAvailable(newVal);
      toast.success(`You are now ${newVal ? 'available' : 'unavailable'}`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setToggling(false);
    }
  };

  const stats = {
    assigned: issues.filter(i => i.status === 'assigned').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    total: issues.length,
  };

  const recentIssues = [...issues]
    .filter(i => ['assigned', 'in-progress'].includes(i.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.area || 'Worker'} — Worker Dashboard
          </p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border transition-all ${
            isAvailable
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
        >
          {isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<AlertCircle className="w-6 h-6 text-amber-600" />} label="Assigned" value={stats.assigned} color="bg-amber-50" />
          <StatCard icon={<Clock className="w-6 h-6 text-blue-600" />} label="In Progress" value={stats.inProgress} color="bg-blue-50" />
          <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} label="Resolved" value={stats.resolved} color="bg-green-50" />
          <StatCard icon={<TrendingUp className="w-6 h-6 text-primary-600" />} label="Total Assigned" value={stats.total} color="bg-primary-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active issues list */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Active Issues
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active issues — all clear!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentIssues.map(issue => (
                  <div key={issue._id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{issue.title}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {issue.area} · {timeAgo(issue.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile card */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary-500" />
            Your Profile
          </h2>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-primary-600">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-3 w-full bg-slate-50 rounded-lg p-3 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Area</span>
                <span className="font-medium text-slate-700">{user?.area || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-slate-700">{user?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Efficiency</span>
                <span className="font-medium text-slate-700">
                  {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
