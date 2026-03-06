const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
    verified: { label: 'Verified', cls: 'bg-blue-100 text-blue-700' },
    assigned: { label: 'Assigned', cls: 'bg-purple-100 text-purple-700' },
    'in-progress': { label: 'In Progress', cls: 'bg-orange-100 text-orange-700' },
    resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = config[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
