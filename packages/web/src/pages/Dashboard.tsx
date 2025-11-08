import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useExperiments } from '../contexts/ExperimentsContext';
import {
  BeakerIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { stats, experiments, loading, loadStats, loadExperiments } = useExperiments();

  useEffect(() => {
    loadStats();
    loadExperiments(1, 5);
  }, [loadStats, loadExperiments]);

  const mockChartData = [
    { name: 'Mon', conversions: 45, participants: 120 },
    { name: 'Tue', conversions: 52, participants: 140 },
    { name: 'Wed', conversions: 38, participants: 110 },
    { name: 'Thu', conversions: 61, participants: 160 },
    { name: 'Fri', conversions: 55, participants: 145 },
    { name: 'Sat', conversions: 42, participants: 100 },
    { name: 'Sun', conversions: 48, participants: 130 },
  ];

  const statusColors = {
    running: '#22c55e',
    paused: '#f59e0b',
    completed: '#6b7280',
    draft: '#94a3b8',
  };

  const statusData = [
    { name: 'Running', value: stats?.activeExperiments || 0, color: statusColors.running },
    { name: 'Completed', value: stats?.completedExperiments || 0, color: statusColors.completed },
    { name: 'Draft', value: (stats?.totalExperiments || 0) - (stats?.activeExperiments || 0) - (stats?.completedExperiments || 0), color: statusColors.draft },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-5 w-5 text-success-600" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-warning-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-secondary-600" />;
      default:
        return <BeakerIcon className="h-5 w-5 text-secondary-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'running':
        return `${baseClasses} bg-success-100 text-success-800`;
      case 'paused':
        return `${baseClasses} bg-warning-100 text-warning-800`;
      case 'completed':
        return `${baseClasses} bg-secondary-100 text-secondary-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your experiments.
          </p>
        </div>
        <Link
          to="/experiments/new"
          className="btn-primary"
        >
          <BeakerIcon className="h-5 w-5 mr-2" />
          New Experiment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BeakerIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Experiments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalExperiments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <PlayIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Experiments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.activeExperiments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalParticipants?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Conversion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.averageConversionRate ? `${(stats.averageConversionRate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversion Trends</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Experiment Status Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Experiment Status</h3>
            <BeakerIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Experiments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Experiments</h3>
          <Link
            to="/experiments"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-4">
          {experiments && experiments.length > 0 ? (
            experiments.slice(0, 5).map((experiment) => (
              <div key={experiment.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(experiment.status)}
                  </div>
                  <div>
                    <Link
                      to={`/experiments/${experiment.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {experiment.name}
                    </Link>
                    <p className="text-sm text-gray-500">{experiment.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={getStatusBadge(experiment.status)}>
                    {experiment.status}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {experiment.variants?.length || 0} variants
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(experiment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            (!loading && (
              <div className="text-center py-8">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No experiments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first experiment.
                </p>
                <div className="mt-6">
                  <Link to="/experiments/new" className="btn-primary">
                    <BeakerIcon className="h-5 w-5 mr-2" />
                    New Experiment
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;