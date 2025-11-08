import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperiments } from '../contexts/ExperimentsContext';
import {
  BeakerIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Experiments: React.FC = () => {
  const {
    experiments,
    loading,
    error,
    pagination,
    loadExperiments,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    deleteExperiment,
  } = useExperiments();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadExperiments(1, 10, statusFilter);
  }, [loadExperiments, statusFilter]);

  const handleAction = async (action: string, experimentId: string) => {
    try {
      setActionLoading(experimentId);
      switch (action) {
        case 'start':
          await startExperiment(experimentId);
          break;
        case 'pause':
          await pauseExperiment(experimentId);
          break;
        case 'complete':
          await completeExperiment(experimentId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this experiment?')) {
            await deleteExperiment(experimentId);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} experiment:`, error);
    } finally {
      setActionLoading(null);
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
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-4 w-4 text-success-600" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-warning-600" />;
      case 'completed':
        return <StopIcon className="h-4 w-4 text-secondary-600" />;
      default:
        return <BeakerIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'draft':
        return ['start', 'delete'];
      case 'running':
        return ['pause', 'complete'];
      case 'paused':
        return ['start', 'complete'];
      case 'completed':
        return ['delete'];
      default:
        return [];
    }
  };

  const filteredExperiments = experiments.filter(experiment =>
    experiment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    experiment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Experiments</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor your behavioral experiments.
          </p>
        </div>
        <Link
          to="/experiments/new"
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Experiment
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search experiments..."
                className="pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              className="input-field w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experiments List */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredExperiments.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Experiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredExperiments.map((experiment) => (
                  <tr key={experiment.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(experiment.status)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {experiment.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {experiment.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(experiment.status)}>
                        {experiment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {experiment.type === 'ab_test' ? 'A/B Test' : 'Behavioral Intervention'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {experiment.variants?.length || 0} variants
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(experiment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/experiments/${experiment.id}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        
                        <Link
                          to={`/experiments/${experiment.id}/edit`}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        
                        {experiment.status === 'running' || experiment.status === 'completed' ? (
                          <Link
                            to={`/experiments/${experiment.id}/results`}
                            className="text-success-600 hover:text-success-900"
                            title="View results"
                          >
                            <ChartBarIcon className="h-4 w-4" />
                          </Link>
                        ) : null}

                        {getAvailableActions(experiment.status).map((action) => (
                          <button
                            key={action}
                            onClick={() => handleAction(action, experiment.id)}
                            disabled={actionLoading === experiment.id}
                            className={`${
                              action === 'delete'
                                ? 'text-error-600 hover:text-error-900'
                                : action === 'start'
                                ? 'text-success-600 hover:text-success-900'
                                : 'text-warning-600 hover:text-warning-900'
                            } disabled:opacity-50`}
                            title={action.charAt(0).toUpperCase() + action.slice(1)}
                          >
                            {actionLoading === experiment.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : action === 'delete' ? (
                              <TrashIcon className="h-4 w-4" />
                            ) : action === 'start' ? (
                              <PlayIcon className="h-4 w-4" />
                            ) : action === 'pause' ? (
                              <PauseIcon className="h-4 w-4" />
                            ) : (
                              <StopIcon className="h-4 w-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {pagination.totalCount > pagination.limit && (
              <div className="px-6 py-3 border-t border-secondary-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadExperiments(pagination.page - 1, pagination.limit, statusFilter)}
                      disabled={pagination.page <= 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadExperiments(pagination.page + 1, pagination.limit, statusFilter)}
                      disabled={pagination.page * pagination.limit >= pagination.totalCount}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter ? 'No experiments found' : 'No experiments'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first experiment.'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                <Link to="/experiments/new" className="btn-primary">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Experiment
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Experiments;