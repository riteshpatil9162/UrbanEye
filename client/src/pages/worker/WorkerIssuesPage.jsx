import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorkerIssues, acceptIssue, rejectWorkerIssue, uploadResolutionProof } from '../../services/workerService';
import { formatDate, timeAgo } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CheckCircle, XCircle, Upload, MapPin, Calendar,
  Eye, X, AlertTriangle, Image as ImageIcon, Navigation,
  Phone, User, ExternalLink, Loader, ShieldX,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ---------- Accept modal with full location details ----------
function AcceptModal({ issue, onConfirm, onClose, loading }) {
  const mapsUrl = issue?.location
    ? `https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
      >
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 text-center mb-1">Accept Issue</h3>
        <p className="text-sm text-slate-500 text-center mb-5">
          You will be assigned to resolve this issue.
        </p>

        {/* Issue Info */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-5">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Issue</p>
            <p className="text-sm font-semibold text-slate-800">{issue?.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Type</p>
              <p className="text-sm font-medium text-slate-700">{issue?.issueType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Area</p>
              <p className="text-sm font-medium text-slate-700">{issue?.area}</p>
            </div>
          </div>

          {/* Location coordinates */}
          {issue?.location && (
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Location Coordinates
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono font-medium text-slate-800">
                  {issue.location.lat?.toFixed(6)}, {issue.location.lng?.toFixed(6)}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium"
                  >
                    Open Map <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Reported by */}
          {issue?.reportedBy && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-start gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Reported by</p>
                  <p className="text-sm font-medium text-slate-700">{issue.reportedBy.name}</p>
                </div>
              </div>
              {issue.reportedBy.phone && (
                <div className="flex items-start gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-700">{issue.reportedBy.phone}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Issue image */}
          {issue?.beforeImage && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Issue Photo</p>
              <img src={issue.beforeImage} alt="Issue" className="w-full h-32 object-cover rounded-lg" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 font-medium py-2 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            {loading ? 'Processing...' : 'Accept & Start'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- Reject modal ----------
function RejectModal({ issue, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 text-center mb-1">Reject Issue</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Reject "{issue?.title}"? The officer will be notified.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 font-medium py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- Proof rejected popup ----------
function ProofRejectedPopup({ aiResult, onRetry, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Proof Not Accepted</h3>
          <p className="text-sm text-slate-500 mt-1">
            AI inspection determined the issue has not been fully resolved. The proof image was rejected.
          </p>
        </div>

        {/* AI Details */}
        <div className="space-y-3 mb-6">
          {aiResult?.detectedContent && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">What AI Saw in Your Proof</p>
              <p className="text-sm text-slate-700">{aiResult.detectedContent}</p>
            </div>
          )}

          {aiResult?.feedback && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Rejection Reason</p>
              <p className="text-sm text-red-800">{aiResult.feedback}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-100" />
            <span>
              Resolution Score:{' '}
              <span className={`font-semibold ${(aiResult?.resolutionScore ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {aiResult?.resolutionScore ?? 0}/100
              </span>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Confidence:{' '}
              <span className="font-semibold text-slate-600">{aiResult?.confidence ?? 0}%</span>
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Better Proof
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-3">
          Make sure the proof clearly shows the issue has been resolved.
        </p>
      </motion.div>
    </div>
  );
}

// ---------- Upload proof modal ----------
function UploadProofModal({ issue, onSuccess, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [rejectedResult, setRejectedResult] = useState(null); // AI rejection data
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAiResult(null);
    setRejectedResult(null);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select an after-image'); return; }
    setLoading(true);
    setAiResult(null);
    setRejectedResult(null);
    try {
      const formData = new FormData();
      formData.append('afterImage', file);
      formData.append('notes', notes);
      const res = await uploadResolutionProof(issue._id, formData);
      setAiResult(res.data?.aiAnalysis);
      toast.success('Proof uploaded successfully!');
      onSuccess();
    } catch (err) {
      // 422 = AI rejected the proof
      if (err.response?.status === 422 && err.response?.data?.aiAnalysis) {
        setRejectedResult(err.response.data.aiAnalysis);
      } else {
        toast.error(err.response?.data?.message || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRejectedResult(null);
    setFile(null);
    setPreview(null);
    setAiResult(null);
    // Trigger file picker
    setTimeout(() => fileRef.current?.click(), 100);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Upload Resolution Proof</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-1">{issue?.title}</p>
          <p className="text-xs text-slate-400 mb-4">
            AI will inspect your proof image to confirm the issue is resolved before submission.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Before</p>
              {issue?.beforeImage
                ? <img src={issue.beforeImage} alt="Before" className="w-full h-28 object-cover rounded-lg border" />
                : <div className="w-full h-28 bg-slate-100 rounded-lg flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-300" /></div>}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">After (Upload)</p>
              {preview
                ? <img src={preview} alt="After" className="w-full h-28 object-cover rounded-lg border" />
                : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-xs">Click to upload</span>
                  </button>
                )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {preview && (
            <button onClick={() => { setFile(null); setPreview(null); setRejectedResult(null); setAiResult(null); }} className="text-xs text-red-500 mb-3">
              Remove image
            </button>
          )}

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Resolution notes (optional) — describe what was done"
            rows={3}
            className="input-field w-full resize-none mb-4"
          />

          {aiResult && (
            <div className="p-3 rounded-xl mb-4 text-sm bg-green-50 border border-green-200 text-green-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold mb-0.5">AI Approved</p>
                <p>{aiResult.feedback}</p>
                <p className="text-xs mt-1 text-green-600">Score: {aiResult.resolutionScore}/100 · Confidence: {Math.round((aiResult.confidence || 0))}%</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> AI Inspecting...</>
              ) : (
                <><Upload className="w-4 h-4" /> Submit Proof</>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Proof rejected popup — shown on top of the modal */}
      <AnimatePresence>
        {rejectedResult && (
          <ProofRejectedPopup
            aiResult={rejectedResult}
            onRetry={handleRetry}
            onClose={() => { setRejectedResult(null); onClose(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------- Main page ----------
export default function WorkerIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null); // { issue, action: 'accept'|'reject' }
  const [uploadModal, setUploadModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchIssues = async () => {
    try {
      const res = await getWorkerIssues();
      const data = res.data?.issues ?? [];
      setIssues(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { issue, action } = confirmModal;
    setActionLoading(true);
    try {
      if (action === 'accept') {
        await acceptIssue(issue._id);
        toast.success('Issue accepted — marked as In Progress');
      } else {
        await rejectWorkerIssue(issue._id);
        toast.success('Issue rejected');
      }
      setConfirmModal(null);
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = issues.filter(i => filterStatus === 'all' || i.status === filterStatus);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Issues</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-field py-2 text-sm w-40"
        >
          <option value="all">All Statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(issue => (
              <motion.div
                key={issue._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {issue.beforeImage && (
                    <img
                      src={issue.beforeImage}
                      alt="Issue"
                      className="w-full sm:w-24 h-20 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 text-sm">{issue.title}</h3>
                      <StatusBadge status={issue.status} />
                      {issue.autoAssigned && (
                        <span className="badge-warning text-xs">Auto-assigned</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{issue.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{issue.area}
                      </span>
                      {issue.location && (
                        <a
                          href={`https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-500 hover:underline"
                        >
                          <Navigation className="w-3 h-3" />
                          {issue.location.lat?.toFixed(4)}, {issue.location.lng?.toFixed(4)}
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{timeAgo(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {issue.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => setConfirmModal({ issue, action: 'accept' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => setConfirmModal({ issue, action: 'reject' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {issue.status === 'in-progress' && !issue.proofUploaded && (
                      <button
                        onClick={() => setUploadModal(issue)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Upload Proof
                      </button>
                    )}
                    {issue.status === 'in-progress' && issue.proofUploaded && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                        <AlertTriangle className="w-4 h-4" /> Awaiting Verification
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{selectedIssue.title}</h3>
                <button onClick={() => setSelectedIssue(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedIssue.status} />
                  {selectedIssue.autoAssigned && <span className="badge-warning">Auto-assigned</span>}
                </div>
                <p className="text-slate-600">{selectedIssue.description}</p>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                  <div><p className="text-slate-400 text-xs">Area</p><p className="font-medium">{selectedIssue.area}</p></div>
                  <div><p className="text-slate-400 text-xs">Type</p><p className="font-medium capitalize">{selectedIssue.issueType}</p></div>
                  <div><p className="text-slate-400 text-xs">Reported</p><p className="font-medium">{formatDate(selectedIssue.createdAt)}</p></div>
                  {selectedIssue.location && (
                    <div>
                      <p className="text-slate-400 text-xs">Coordinates</p>
                      <a
                        href={`https://www.google.com/maps?q=${selectedIssue.location.lat},${selectedIssue.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:underline flex items-center gap-1 text-xs"
                      >
                        {selectedIssue.location.lat?.toFixed(5)}, {selectedIssue.location.lng?.toFixed(5)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                {selectedIssue.reportedBy && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Reported By</p>
                    <p className="font-medium text-slate-800">{selectedIssue.reportedBy.name}</p>
                    {selectedIssue.reportedBy.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{selectedIssue.reportedBy.phone}
                      </p>
                    )}
                  </div>
                )}
                {selectedIssue.beforeImage && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Before Image</p>
                    <img src={selectedIssue.beforeImage} alt="Before" className="w-full rounded-lg" />
                  </div>
                )}
                {selectedIssue.afterImage && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">After Image</p>
                    <img src={selectedIssue.afterImage} alt="After" className="w-full rounded-lg" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accept modal (with location details) */}
      {confirmModal?.action === 'accept' && (
        <AcceptModal
          issue={confirmModal.issue}
          onConfirm={handleConfirm}
          onClose={() => setConfirmModal(null)}
          loading={actionLoading}
        />
      )}

      {/* Reject modal */}
      {confirmModal?.action === 'reject' && (
        <RejectModal
          issue={confirmModal.issue}
          onConfirm={handleConfirm}
          onClose={() => setConfirmModal(null)}
          loading={actionLoading}
        />
      )}

      {/* Upload proof modal */}
      {uploadModal && (
        <UploadProofModal
          issue={uploadModal}
          onSuccess={() => { setUploadModal(null); fetchIssues(); }}
          onClose={() => setUploadModal(null)}
        />
      )}
    </div>
  );
}
