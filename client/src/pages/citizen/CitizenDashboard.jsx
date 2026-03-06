import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, AlertCircle, CheckCircle, Clock, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyIssues } from '../../services/issueService';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo, getIssueTypeIcon } from '../../utils/helpers';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyIssues({ limit: 5 })
      .then((res) => setIssues(res.data.issues))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Reported', value: issues.length, icon: AlertCircle, color: 'text-blue-600 bg-blue-50' },
    { label: 'Resolved', value: issues.filter((i) => i.status === 'resolved').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'In Progress', value: issues.filter((i) => i.status === 'in-progress' || i.status === 'assigned').length, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Reward Points', value: user?.points || 0, icon: Award, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">{user?.area} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/citizen/report" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Report Issue
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Points Banner */}
      {user?.points > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100 p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">You have {user.points} reward points</p>
            <p className="text-xs text-gray-500">Redeem them for vouchers and discounts.</p>
          </div>
          <Link to="/citizen/rewards" className="btn-primary text-xs py-1.5 px-3">
            Redeem
          </Link>
        </div>
      )}

      {/* Recent Issues */}
      <div className="card">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-heading mb-0">Recent Reports</h2>
          <Link to="/citizen/my-issues" className="text-xs text-primary-600 font-medium hover:underline">
            View all
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No issues reported yet.</p>
            <Link to="/citizen/report" className="btn-primary mt-4 text-sm">
              <PlusCircle className="w-4 h-4" /> Report Your First Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {issues.map((issue) => (
              <div key={issue._id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {getIssueTypeIcon(issue.issueType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{issue.area} · {timeAgo(issue.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
