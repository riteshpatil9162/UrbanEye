const LoadingSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-4 bg-gray-200 rounded ${i % 3 === 0 ? 'w-3/4' : i % 2 === 0 ? 'w-1/2' : 'w-full'}`} />
    ))}
  </div>
);

export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-5 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="table-container animate-pulse">
    <table className="w-full">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3 bg-gray-50">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="px-4 py-3.5 border-b border-gray-50">
                <div className="h-3 bg-gray-100 rounded w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default LoadingSkeleton;
