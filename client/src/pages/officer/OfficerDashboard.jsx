import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle, Clock, Users, TrendingUp,
  BarChart2, ArrowUpRight, Zap, UserCheck, MapPin,
} from 'lucide-react';
import { getDashboardStats } from '../../services/officerService';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo, getIssueTypeIcon } from '../../utils/helpers';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const OfficerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: 'Total Issues', value: data.stats.totalIssues, icon: AlertCircle, color: 'text-blue-600 bg-blue-50', change: '+12%' },
    { label: 'Resolved', value: data.stats.resolvedIssues, icon: CheckCircle, color: 'text-green-600 bg-green-50', change: `${data.stats.resolutionRate}%` },
    { label: 'Pending', value: data.stats.pendingIssues, icon: Clock, color: 'text-amber-600 bg-amber-50', change: '-5%' },
    { label: 'Active Workers', value: `${data.stats.availableWorkers}/${data.stats.totalWorkers}`, icon: Users, color: 'text-purple-600 bg-purple-50', change: null },
  ] : [];

  const issueTypeChart = data ? {
    labels: data.typeStats.map((t) => t._id),
    datasets: [{
      data: data.typeStats.map((t) => t.count),
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
      borderWidth: 0,
    }],
  } : null;

  const areaChart = data ? {
    labels: data.areaStats.slice(0, 6).map((a) => a._id.split(',')[0]),
    datasets: [
      {
        label: 'Total',
        data: data.areaStats.slice(0, 6).map((a) => a.count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Resolved',
        data: data.areaStats.slice(0, 6).map((a) => a.resolved),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  } : null;

  const trendChart = data ? {
    labels: data.monthlyTrends.map((m) => monthNames[m._id.month - 1]),
    datasets: [
      {
        label: 'Reported',
        data: data.monthlyTrends.map((m) => m.reported),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: data.monthlyTrends.map((m) => m.resolved),
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Officer Dashboard</h1>
        <p className="page-subtitle">Municipal issue overview and management</p>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color, change }, i) => (
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
                {change && <p className="text-xs text-green-600 font-medium mt-0.5">{change}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolution rate */}
      {data && (
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-900">Overall Resolution Rate</span>
              <span className="text-sm font-bold text-primary-600">{data.stats.resolutionRate}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-700"
                style={{ width: `${data.stats.resolutionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Area chart */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="section-heading">Area-wise Issues</h3>
            {areaChart && (
              <Bar
                data={areaChart}
                options={{
                  ...chartOptions,
                  plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
                }}
                height={120}
              />
            )}
          </div>

          {/* Issue type doughnut */}
          <div className="card p-5">
            <h3 className="section-heading">Issue Types</h3>
            {issueTypeChart && (
              <div className="h-48 flex items-center justify-center">
                <Doughnut
                  data={issueTypeChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
                    cutout: '65%',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trend */}
      {data && trendChart && (
        <div className="card p-5 mb-6">
          <h3 className="section-heading">Monthly Trend (Last 6 Months)</h3>
          <Line
            data={trendChart}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f1f5f9' }, beginAtZero: true },
              },
            }}
            height={80}
          />
        </div>
      )}

      {/* Recent Assignments — shows worker names */}
      {data && data.recentAssignments && data.recentAssignments.length > 0 && (
        <div className="card p-5">
          <h3 className="section-heading mb-4">Recently Assigned Issues</h3>
          <div className="space-y-3">
            {data.recentAssignments.map((item) => (
              <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {item.assignedTo?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <UserCheck className="w-3 h-3 text-purple-500" />
                      {item.assignedTo?.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {item.area?.split(',')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-gray-400">{timeAgo(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
