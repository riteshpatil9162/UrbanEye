import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, CheckCircle, MapPin, Filter, PlusCircle } from 'lucide-react';
import { getMyIssues, confirmResolution } from '../../services/issueService';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo, getIssueTypeIcon, ISSUE_TYPES } from '../../utils/helpers';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const MyIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await getMyIssues({ status: filter, page, limit: 10 });
      setIssues(res.data.issues);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [filter, page]);

  const handleConfirm = async (id) => {
    try {
      await confirmResolution(id);
      toast.success('Resolution confirmed! 50 points earned.');
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">My Reported Issues</h1>
          <p className="page-subtitle">{total} total reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/citizen/community" className="btn-secondary text-sm py-2 px-3">
            Community View
          </Link>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="input-field w-auto py-2 text-sm"
            >
              <option value="">All Status</option>
              {['pending','verified','assigned','in-progress','resolved','rejected'].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : issues.length === 0 ? (
        <div className="card p-16 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No issues found.</p>
          <Link to="/citizen/report" className="btn-primary mt-4 text-sm inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Report an Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <motion.div
              key={issue._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                {issue.image && (
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base">{getIssueTypeIcon(issue.issueType)}</span>
                        <h3 className="text-sm font-semibold text-gray-900">{issue.title}</h3>
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {issue.area} · {timeAgo(issue.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {issue.status === 'resolved' && !issue.rewardGiven && (
                        <button
                          onClick={() => handleConfirm(issue._id)}
                          className="btn-success text-xs py-1.5 px-3"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Confirm & Earn 50pts
                        </button>
                      )}
                    </div>
                  </div>
                  {issue.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{issue.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {/* Like count — display only (citizens can't like their own issues) */}
                    <div
                      className="flex items-center gap-1.5 text-xs text-gray-500"
                      title="Likes from other citizens in your area"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${issue.likes > 0 ? 'fill-red-400 text-red-400' : ''}`}
                      />
                      {issue.likes ?? 0} {issue.likes === 1 ? 'like' : 'likes'}
                    </div>
                    {issue.aiAuthenticityScore && (
                      <div className="text-xs text-gray-500">
                        AI Score: <span className="font-medium text-primary-600">{issue.aiAuthenticityScore}%</span>
                      </div>
                    )}
                    {issue.assignedTo && (
                      <div className="text-xs text-gray-500">
                        Worker: <span className="font-medium">{issue.assignedTo.name}</span>
                      </div>
                    )}
                    {issue.autoAssigned && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">Auto-assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3">Prev</button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={issues.length < 10} className="btn-secondary text-sm py-1.5 px-3">Next</button>
        </div>
      )}
    </div>
  );
};

export default MyIssuesPage;
