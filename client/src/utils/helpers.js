export const getStatusBadgeClass = (status) => {
  const map = {
    pending: 'badge-pending',
    verified: 'badge-verified',
    assigned: 'badge-assigned',
    'in-progress': 'badge-in-progress',
    resolved: 'badge-resolved',
    rejected: 'badge-rejected',
  };
  return map[status] || 'badge bg-gray-100 text-gray-600';
};

export const getStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    verified: 'Verified',
    assigned: 'Assigned',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

export const getIssueTypeColor = (type) => {
  const map = {
    'Pothole': 'bg-orange-100 text-orange-700',
    'Waste Overflow': 'bg-green-100 text-green-700',
    'Water Leakage': 'bg-blue-100 text-blue-700',
    'Electricity Fault': 'bg-yellow-100 text-yellow-700',
    'Sewage Blockage': 'bg-red-100 text-red-700',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
};

export const getIssueTypeIcon = (type) => {
  const map = {
    'Pothole': '🚧',
    'Waste Overflow': '🗑️',
    'Water Leakage': '💧',
    'Electricity Fault': '⚡',
    'Sewage Blockage': '🔧',
  };
  return map[type] || '📋';
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const truncate = (str, len = 80) =>
  str && str.length > len ? str.substring(0, len) + '...' : str;

export const AREAS = [
  'Kolhapur',
  'Ichalkaranji',
  'Kagal',
  'Hatkanangale',
  'Jaysingpur',
  'Gadhinglaj',
  'Radhanagari',
  'Karvir',
  'Shahuwadi',
  'Panhala',
  'Bavada',
  'Shiroli',
  'Kurundvad',
  'Gargoti',
  'Nandani',
];

export const ISSUE_TYPES = [
  'Pothole',
  'Waste Overflow',
  'Water Leakage',
  'Electricity Fault',
  'Sewage Blockage',
];
