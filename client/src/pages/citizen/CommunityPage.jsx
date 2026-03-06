import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, Search, Users, X, Calendar,
  ThumbsUp, Flame, Clock, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Zap, Filter,
} from 'lucide-react';
import { getIssues, likeIssue } from '../../services/issueService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  timeAgo, formatDate, getIssueTypeIcon,
  getIssueTypeColor, ISSUE_TYPES,
} from '../../utils/helpers';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

// ─── Issue Detail Modal ────────────────────────────────────────────────────────
function IssueDetailModal({ issue, onClose, onLike, liking, isLiked, isOwn }) {
  if (!issue) return null;
  const liked = isLiked(issue);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
      >
        {/* Header image */}
        {issue.image && (
          <div className="relative h-52 w-full overflow-hidden rounded-t-2xl bg-gray-100">
            <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getIssueTypeColor(issue.issueType)}`}>
                {getIssueTypeIcon(issue.issueType)} {issue.issueType}
              </span>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* No-image close */}
          {!issue.image && (
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getIssueTypeColor(issue.issueType)}`}>
                {getIssueTypeIcon(issue.issueType)} {issue.issueType}
              </span>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Title + status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-base font-bold text-gray-900 leading-snug">{issue.title}</h2>
            <StatusBadge status={issue.status} />
          </div>

          {/* Description */}
          {issue.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{issue.description}</p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3 mb-4 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
              <span className="font-medium text-gray-700 truncate">{issue.area}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
              <span>{formatDate(issue.createdAt)}</span>
            </div>
            {issue.reportedBy?.name && (
              <div className="flex items-center gap-2 text-gray-500 col-span-2">
                <Users className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <span>Reported by <span className="font-medium text-gray-700">{issue.reportedBy.name}</span></span>
              </div>
            )}
          </div>

          {/* After image (if resolved) */}
          {issue.afterImage && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Resolution Photo</p>
              <img src={issue.afterImage} alt="Resolved" className="w-full h-36 object-cover rounded-xl border border-green-100" />
            </div>
          )}

          {/* Auto-assigned banner */}
          {issue.autoAssigned && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-700 font-medium">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              Auto-assigned after community support reached 5 likes
            </div>
          )}

          {/* AI score */}
          {issue.aiAuthenticityScore != null && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400">AI Authenticity</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${issue.aiAuthenticityScore}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-primary-400 rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-primary-600">{issue.aiAuthenticityScore}%</span>
            </div>
          )}

          {/* Like button */}
          <button
            onClick={() => !isOwn && onLike(issue._id)}
            disabled={isOwn || liking[issue._id]}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95
              ${isOwn
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : liked
                ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''} ${liking[issue._id] ? 'animate-pulse' : ''}`} />
            {liked ? 'Liked' : 'Like this issue'} · {issue.likes ?? 0}
            {isOwn && <span className="text-xs font-normal ml-1">(your issue)</span>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Issue Card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, index, onLike, liking, isLiked, isOwn, onOpen }) {
  const liked = isLiked(issue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card flex flex-col overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpen(issue)}
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100 flex-shrink-0">
        {issue.image ? (
          <img
            src={issue.image}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-4xl">{getIssueTypeIcon(issue.issueType)}</span>
          </div>
        )}
        {/* Issue type chip on image */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm ${getIssueTypeColor(issue.issueType)}`}>
            {issue.issueType}
          </span>
        </div>
        {/* Resolved overlay */}
        {issue.status === 'resolved' && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </div>
        )}
        {/* Auto-assigned flash */}
        {issue.autoAssigned && (
          <div className="absolute bottom-2 right-2 bg-amber-400/90 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> Auto-assigned
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{issue.title}</h3>

        {/* Description */}
        {issue.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{issue.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{issue.area}</span>
          <span className="mx-1 text-gray-300">·</span>
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="flex-shrink-0">{timeAgo(issue.createdAt)}</span>
        </div>

        {/* Reporter */}
        {issue.reportedBy?.name && (
          <p className="text-xs text-gray-400 mb-3 truncate">
            By <span className="font-medium text-gray-600">{issue.reportedBy.name}</span>
          </p>
        )}

        {/* Footer: status + like */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <StatusBadge status={issue.status} />

          <button
            onClick={(e) => { e.stopPropagation(); if (!isOwn) onLike(issue._id); }}
            disabled={isOwn || liking[issue._id]}
            title={isOwn ? "Your own issue" : liked ? 'Unlike' : 'Like to support'}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95
              ${isOwn
                ? 'text-gray-400 cursor-default'
                : liked
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
              }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all ${liking[issue._id] ? 'animate-pulse' : ''} ${liked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
            />
            {issue.likes ?? 0}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CommunityPage = () => {
  const { user } = useAuth();
  const [issues, setIssues]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [liking, setLiking]           = useState({});
  const [typeFilter, setTypeFilter]   = useState('');   // issue type chip
  const [statusFilter, setStatusFilter] = useState(''); // status dropdown
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const searchTimer = useRef(null);

  const LIMIT = 12;

  // Debounce search input
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIssues({
        area: user?.area,
        issueType: typeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setIssues(res.data.issues || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load community issues.');
    } finally {
      setLoading(false);
    }
  }, [user?.area, typeFilter, statusFilter, search, page]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleLike = async (issueId) => {
    if (liking[issueId]) return;
    setLiking((prev) => ({ ...prev, [issueId]: true }));
    try {
      await likeIssue(issueId);
      const updater = (issue) => {
        if (issue._id !== issueId) return issue;
        const alreadyLiked = issue.likedBy?.some(
          (id) => (id?._id || id) === user?._id
        );
        return {
          ...issue,
          likes: alreadyLiked ? issue.likes - 1 : issue.likes + 1,
          likedBy: alreadyLiked
            ? issue.likedBy.filter((id) => (id?._id || id) !== user?._id)
            : [...(issue.likedBy || []), user?._id],
        };
      };
      setIssues((prev) => prev.map(updater));
      // Also update modal issue if open
      setSelectedIssue((prev) => prev?._id === issueId ? updater(prev) : prev);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to like issue.');
    } finally {
      setLiking((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const isLiked = (issue) =>
    issue.likedBy?.some((id) => (id?._id || id) === user?._id);

  const isOwn = (issue) =>
    issue.reportedBy?._id === user?._id || issue.reportedBy === user?._id;

  // Summary stats
  const totalPages = Math.ceil(total / LIMIT);
  const resolved   = issues.filter((i) => i.status === 'resolved').length;
  const pending    = issues.filter((i) => i.status === 'pending').length;
  const topLiked   = [...issues].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="page-title">Community Issues</h1>
        <p className="page-subtitle">
          See what's happening in <span className="font-semibold text-gray-700">{user?.area}</span> — like issues to push them up the priority queue.
        </p>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users,        color: 'bg-blue-50 text-blue-600',   value: total,             label: 'Total Issues'  },
          { icon: CheckCircle2, color: 'bg-green-50 text-green-600', value: resolved,           label: 'Resolved'      },
          { icon: AlertCircle,  color: 'bg-amber-50 text-amber-600', value: pending,            label: 'Pending'       },
          { icon: ThumbsUp,     color: 'bg-red-50 text-red-500',     value: topLiked?.likes ?? 0, label: 'Most Liked'  },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="card p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 mb-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, description…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm w-full"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Issue type chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setTypeFilter(''); setPage(1); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              typeFilter === ''
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            }`}
          >
            All Types
          </button>
          {ISSUE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t === typeFilter ? '' : t); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                typeFilter === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {getIssueTypeIcon(t)} {t}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {['pending', 'verified', 'assigned', 'in-progress', 'resolved'].map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {(typeFilter || statusFilter || search) && (
            <button
              onClick={() => { setTypeFilter(''); setStatusFilter(''); setSearch(''); setSearchInput(''); setPage(1); }}
              className="text-xs text-primary-600 hover:underline font-medium ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3 px-1">
          Showing {issues.length} of {total} issue{total !== 1 ? 's' : ''}
          {typeFilter && <> · <span className="font-medium text-gray-600">{typeFilter}</span></>}
          {statusFilter && <> · <span className="capitalize font-medium text-gray-600">{statusFilter}</span></>}
        </p>
      )}

      {/* ── Issues grid ── */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : issues.length === 0 ? (
        <div className="card p-16 text-center">
          <Flame className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">No issues found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {issues.map((issue, i) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                index={i}
                onLike={handleLike}
                liking={liking}
                isLiked={isLiked}
                isOwn={isOwn(issue)}
                onOpen={setSelectedIssue}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page pills */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                  p === page
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-gray-400 ml-1">Page {page} of {totalPages}</span>
        </div>
      )}

      {/* ── Info tip ── */}
      <div className="mt-6 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <ThumbsUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Pro tip:</span> Issues that receive 5 or more community likes are automatically assigned to the nearest available worker for faster resolution.
        </p>
      </div>

      {/* ── Issue detail modal ── */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onLike={handleLike}
            liking={liking}
            isLiked={isLiked}
            isOwn={isOwn(selectedIssue)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPage;
