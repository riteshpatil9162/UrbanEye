import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, X, UserCheck, Search, AlertCircle,
  Eye, Image as ImageIcon, MapPin, User, Calendar, Phone,
} from 'lucide-react';
import {
  getOfficerIssues, getOfficerIssueDetail, verifyIssue,
  assignIssue, rejectIssue, verifyResolution, getWorkers,
} from '../../services/officerService';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo, getIssueTypeIcon, ISSUE_TYPES } from '../../utils/helpers';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const OfficerIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', issueType: '', area: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailModal, setDetailModal] = useState(null);      // full issue object for detail view
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(null);      // issue object
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [verifyResModal, setVerifyResModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await getOfficerIssues({ ...filters, page, limit: 10 });
      setIssues(res.data.issues);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [filters, page]);

  // When the assign modal opens, fetch only workers from the same city as the issue
  useEffect(() => {
    if (!assignModal) return;
    setWorkers([]);
    getWorkers({ area: assignModal.area })
      .then((r) => setWorkers(r.data.workers))
      .catch(() => toast.error('Failed to load workers for this area.'));
  }, [assignModal]);

  // Open issue detail modal — fetches full details from server
  const openDetail = async (issueId) => {
    setDetailLoading(true);
    setDetailModal({});
    try {
      const res = await getOfficerIssueDetail(issueId);
      setDetailModal(res.data.issue);
    } catch {
      toast.error('Failed to load issue details.');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (id) => {
    setActionLoading(id + '_verify');
    try {
      await verifyIssue(id);
      toast.success('Issue verified! You can now assign it to a worker.');
      fetchIssues();
      // Refresh detail modal if open
      if (detailModal?._id === id) openDetail(id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to verify.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssign = async (issueId, workerId) => {
    setActionLoading(issueId + '_assign');
    try {
      const res = await assignIssue(issueId, workerId);
      toast.success(`Issue assigned to ${res.data.assignedWorker?.name || 'worker'}!`);
      setAssignModal(null);
      setDetailModal(null);
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) return toast.error('Please provide a rejection reason.');
    setActionLoading(rejectModal.id + '_reject');
    try {
      await rejectIssue(rejectModal.id, rejectModal.reason);
      toast.success('Issue rejected.');
      setRejectModal({ open: false, id: null, reason: '' });
      setDetailModal(null);
      fetchIssues();
    } catch {
      toast.error('Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyResolution = async (approved) => {
    if (!verifyResModal) return;
    setActionLoading(verifyResModal._id + '_verifyres');
    try {
      await verifyResolution(verifyResModal._id, approved);
      toast.success(approved ? 'Resolution approved — issue marked resolved!' : 'Resolution rejected — worker notified.');
      setVerifyResModal(null);
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Issue Management</h1>
        <p className="page-subtitle">{total} total issues · Click <Eye className="w-3.5 h-3.5 inline" /> to view details before verifying or assigning</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          className="input-field w-auto text-sm"
        >
          <option value="">All Status</option>
          {['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <select
          value={filters.issueType}
          onChange={(e) => { setFilters({ ...filters, issueType: e.target.value }); setPage(1); }}
          className="input-field w-auto text-sm"
        >
          <option value="">All Types</option>
          {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Issues Table */}
      {loading ? <TableSkeleton rows={8} cols={7} /> : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Issue</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Area</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Assigned To</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">AI Score</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    No issues found
                  </td>
                </tr>
              ) : issues.map((issue) => (
                <tr key={issue._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 max-w-xs">
                      {issue.image && (
                        <img src={issue.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 truncate text-xs">{issue.title}</p>
                        <p className="text-xs text-gray-400">{issue.reportedBy?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs">{getIssueTypeIcon(issue.issueType)} {issue.issueType}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{issue.area?.split(',')[0]}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={issue.status} /></td>
                  {/* Assigned worker name */}
                  <td className="px-4 py-3.5">
                    {issue.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {issue.assignedTo.name?.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{issue.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {issue.aiAuthenticityScore != null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${issue.aiAuthenticityScore}%`,
                              background: issue.aiAuthenticityScore > 70 ? '#10b981' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">{issue.aiAuthenticityScore}%</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">N/A</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* View Details — always available */}
                      <button
                        onClick={() => openDetail(issue._id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1"
                        title="View full details"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {/* Verify — only for pending */}
                      {issue.status === 'pending' && (
                        <button
                          onClick={() => handleVerify(issue._id)}
                          disabled={actionLoading === issue._id + '_verify'}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-60"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {actionLoading === issue._id + '_verify' ? '...' : 'Verify'}
                        </button>
                      )}
                      {/* Assign — only after verified */}
                      {issue.status === 'verified' && (
                        <button
                          onClick={() => setAssignModal(issue)}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" /> Assign
                        </button>
                      )}
                      {/* Pending cannot assign — show tooltip */}
                      {issue.status === 'pending' && (
                        <span className="text-xs text-amber-500 italic" title="Verify the issue first before assigning">
                          Verify first
                        </span>
                      )}
                      {/* Reject — pending or verified */}
                      {['pending', 'verified'].includes(issue.status) && (
                        <button
                          onClick={() => setRejectModal({ open: true, id: issue._id, reason: '' })}
                          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      )}
                      {/* Review resolution proof */}
                      {issue.status === 'in-progress' && issue.proofUploaded && (
                        <button
                          onClick={() => setVerifyResModal(issue)}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Review Proof
                        </button>
                      )}
                      {issue.status === 'in-progress' && !issue.proofUploaded && (
                        <span className="text-xs text-gray-400 italic">Awaiting proof</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {Math.ceil(total / 10)}</span>
          <button onClick={() => setPage(page + 1)} disabled={issues.length < 10} className="btn-secondary text-sm py-1.5 px-3">Next</button>
        </div>
      )}

      {/* ===== Issue Detail Modal ===== */}
      <AnimatePresence>
        {detailModal !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-900">Issue Details</h3>
                <button onClick={() => setDetailModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detailLoading || !detailModal._id ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status + Type */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={detailModal.status} />
                    <span className="text-sm font-medium text-gray-700">{getIssueTypeIcon(detailModal.issueType)} {detailModal.issueType}</span>
                    {detailModal.autoAssigned && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Auto-assigned</span>
                    )}
                  </div>

                  {/* Title + Description */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">{detailModal.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{detailModal.description}</p>
                  </div>

                  {/* Issue image */}
                  {detailModal.image && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Issue Image</p>
                      <img src={detailModal.image} alt="Issue" className="w-full max-h-64 object-cover rounded-lg border border-gray-100" />
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Area</p>
                        <p className="font-medium text-gray-800">{detailModal.area}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Coordinates</p>
                        <p className="font-medium text-gray-800 text-xs">
                          {detailModal.location?.lat?.toFixed(5)}, {detailModal.location?.lng?.toFixed(5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Reported By</p>
                        <p className="font-medium text-gray-800">{detailModal.reportedBy?.name}</p>
                        <p className="text-xs text-gray-500">{detailModal.reportedBy?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Reported</p>
                        <p className="font-medium text-gray-800">{timeAgo(detailModal.createdAt)}</p>
                      </div>
                    </div>
                    {detailModal.assignedTo && (
                      <div className="col-span-2 flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Assigned To</p>
                          <p className="font-medium text-gray-800">{detailModal.assignedTo.name}</p>
                          <p className="text-xs text-gray-500">{detailModal.assignedTo.email} · {detailModal.assignedTo.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI score */}
                  {detailModal.aiAuthenticityScore != null && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                      <span className="font-medium">AI Authenticity Score: </span>{detailModal.aiAuthenticityScore}%
                      {detailModal.aiFraudProbability != null && (
                        <span className="ml-3 text-amber-700">Fraud Probability: {detailModal.aiFraudProbability}%</span>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {detailModal.rejectionReason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                      <span className="font-medium">Rejection Reason: </span>{detailModal.rejectionReason}
                    </div>
                  )}

                  {/* Action buttons inside detail modal */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                    {detailModal.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(detailModal._id)}
                        disabled={actionLoading === detailModal._id + '_verify'}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading === detailModal._id + '_verify' ? 'Verifying...' : 'Verify Issue'}
                      </button>
                    )}
                    {detailModal.status === 'verified' && (
                      <button
                        onClick={() => { setAssignModal(detailModal); setDetailModal(null); }}
                        className="flex items-center gap-2 text-sm px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <UserCheck className="w-4 h-4" /> Assign to Worker
                      </button>
                    )}
                    {detailModal.status === 'pending' && (
                      <p className="text-xs text-amber-600 self-center">
                        Verify this issue first before assigning it to a worker.
                      </p>
                    )}
                    {['pending', 'verified'].includes(detailModal.status) && (
                      <button
                        onClick={() => { setRejectModal({ open: true, id: detailModal._id, reason: '' }); setDetailModal(null); }}
                        className="flex items-center gap-2 text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    )}
                    {detailModal.status === 'in-progress' && detailModal.proofUploaded && (
                      <button
                        onClick={() => { setVerifyResModal(detailModal); setDetailModal(null); }}
                        className="flex items-center gap-2 text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Eye className="w-4 h-4" /> Review Proof
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Assign Modal ===== */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Assign Issue to Worker</h3>
              <button onClick={() => setAssignModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">"{assignModal.title}"</p>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {assignModal.area}
            </p>

            {workers.filter((w) => w.isAvailable).length === 0 ? (
              <p className="text-sm text-amber-600">No available workers in <strong>{assignModal.area}</strong> at the moment.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workers.filter((w) => w.isAvailable).map((worker) => (
                  <button
                    key={worker._id}
                    onClick={() => handleAssign(assignModal._id, worker._id)}
                    disabled={actionLoading === assignModal._id + '_assign'}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left transition-colors disabled:opacity-60"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {worker.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{worker.name}</p>
                      <p className="text-xs text-gray-500">{worker.area?.split(',')[0]} · {worker.resolved || 0} resolved</p>
                      {worker.activeIssue && (
                        <p className="text-xs text-amber-600 mt-0.5">Working on: {worker.activeIssue.title}</p>
                      )}
                    </div>
                    <div className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Available</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ===== Reject Modal ===== */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Reject Issue</h3>
              <button onClick={() => setRejectModal({ open: false, id: null, reason: '' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="label">Rejection Reason *</label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Explain why this issue is being rejected..."
              className="input-field h-24 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal({ open: false, id: null, reason: '' })} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleReject} disabled={!!actionLoading} className="btn-danger flex-1 justify-center">Reject Issue</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== Verify Resolution Modal ===== */}
      {verifyResModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Review Resolution Proof</h3>
              <button onClick={() => setVerifyResModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">"{verifyResModal.title}"</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Before</p>
                {verifyResModal.beforeImage
                  ? <img src={verifyResModal.beforeImage} alt="Before" className="w-full h-36 object-cover rounded-lg border border-gray-100" />
                  : <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">After (Worker Proof)</p>
                {verifyResModal.afterImage
                  ? <img src={verifyResModal.afterImage} alt="After" className="w-full h-36 object-cover rounded-lg border border-gray-100" />
                  : <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
              </div>
            </div>

            {verifyResModal.aiResolutionScore != null && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <span className="font-medium">AI Resolution Score: </span>{verifyResModal.aiResolutionScore}%
              </div>
            )}
            {verifyResModal.workerNotes && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-700">
                <span className="font-medium text-gray-900">Worker Notes: </span>{verifyResModal.workerNotes}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleVerifyResolution(false)}
                disabled={!!actionLoading}
                className="btn-secondary flex-1 justify-center text-red-600 hover:bg-red-50 border-red-200"
              >
                <X className="w-4 h-4" /> Reject Proof
              </button>
              <button
                onClick={() => handleVerifyResolution(true)}
                disabled={!!actionLoading}
                className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" /> Approve & Resolve
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OfficerIssuesPage;
