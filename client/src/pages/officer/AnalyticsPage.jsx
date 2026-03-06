import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getAnalytics } from '../../services/analyticsService';
import { TrendingUp, Clock, MapPin, Users, BarChart2, PieChart } from 'lucide-react';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await getAnalytics();
        setData(res.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (!data) return null;

  const statusDist = data.statusDistribution || [];
  const topAreas = data.topAreas || [];
  const issueTypes = data.issueTypes || [];
  const workers = data.workerPerformance || [];
  const resolution = data.resolutionTimes || [];
  const monthly = data.monthlyTrend || [];

  const statusChart = {
    labels: statusDist.map(s => s._id || 'Unknown'),
    datasets: [{
      data: statusDist.map(s => s.count),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  const areaChart = {
    labels: topAreas.map(a => a._id || 'Unknown'),
    datasets: [{
      label: 'Issues',
      data: topAreas.map(a => a.total),
      backgroundColor: '#3b82f6',
      borderRadius: 6,
    }],
  };

  const typeChart = {
    labels: issueTypes.map(t => t._id || 'Unknown'),
    datasets: [{
      data: issueTypes.map(t => t.count),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  const monthlyChart = {
    labels: monthly.map(m => `${m._id?.month}/${m._id?.year}`),
    datasets: [{
      label: 'Issues Reported',
      data: monthly.map(m => m.reported),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const workerChart = {
    labels: workers.map(w => w.name || 'Worker'),
    datasets: [
      {
        label: 'Assigned',
        data: workers.map(w => w.total),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Resolved',
        data: workers.map(w => w.resolved),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    maintainAspectRatio: true,
  };

  const barOptions = {
    ...chartOptions,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const totalIssues = statusDist.reduce((s, x) => s + x.count, 0);

  const avgResolutionDays = resolution.length > 0
    ? Math.round(resolution.reduce((s, r) => s + r.avgDays, 0) / resolution.length)
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <BarChart2 className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Comprehensive issue & performance metrics</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Issues', value: totalIssues, icon: <BarChart2 className="w-5 h-5 text-primary-500" />, bg: 'bg-primary-50' },
          { label: 'Avg Resolution', value: avgResolutionDays ? `${avgResolutionDays}d` : 'N/A', icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Top Area', value: topAreas[0]?._id || 'N/A', icon: <MapPin className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
          { label: 'Active Workers', value: workers.length, icon: <Users className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-slate-700">Monthly Trend</h2>
          </div>
          {monthly.length > 0
            ? <Line data={monthlyChart} options={chartOptions} />
            : <p className="text-slate-400 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-slate-700">Status Distribution</h2>
          </div>
          {statusDist.length > 0
            ? <Doughnut data={statusChart} options={chartOptions} />
            : <p className="text-slate-400 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-slate-700">Issues by Area</h2>
          </div>
          {topAreas.length > 0
            ? <Bar data={areaChart} options={barOptions} />
            : <p className="text-slate-400 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-slate-700">Issue Types</h2>
          </div>
          {issueTypes.length > 0
            ? <Doughnut data={typeChart} options={chartOptions} />
            : <p className="text-slate-400 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-slate-700">Worker Performance</h2>
          </div>
          {workers.length > 0
            ? <Bar data={workerChart} options={barOptions} />
            : <p className="text-slate-400 text-sm text-center py-8">No worker data yet</p>}
        </div>
      </div>
    </div>
  );
}
