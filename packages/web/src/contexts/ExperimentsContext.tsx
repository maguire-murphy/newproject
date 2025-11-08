import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  experimentsService, 
  Experiment, 
  ExperimentListResponse,
  ExperimentStatsOverview,
  CreateExperimentRequest,
  UpdateExperimentRequest
} from '../services/experiments';
import { useAuth } from './AuthContext';

interface ExperimentsContextType {
  experiments: Experiment[];
  stats: ExperimentStatsOverview | null;
  loading: boolean;
  error: string | null;
  selectedExperiment: Experiment | null;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
  };
  loadExperiments: (page?: number, limit?: number, status?: string) => Promise<void>;
  loadExperiment: (id: string) => Promise<void>;
  createExperiment: (experiment: CreateExperimentRequest) => Promise<Experiment>;
  updateExperiment: (id: string, updates: UpdateExperimentRequest) => Promise<Experiment>;
  deleteExperiment: (id: string) => Promise<void>;
  startExperiment: (id: string) => Promise<void>;
  pauseExperiment: (id: string) => Promise<void>;
  completeExperiment: (id: string) => Promise<void>;
  loadStats: () => Promise<void>;
  clearSelectedExperiment: () => void;
  refreshExperiments: () => Promise<void>;
}

const ExperimentsContext = createContext<ExperimentsContextType | undefined>(undefined);

interface ExperimentsProviderProps {
  children: ReactNode;
}

export const ExperimentsProvider: React.FC<ExperimentsProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<ExperimentStatsOverview | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadExperiments();
      loadStats();
    }
  }, [isAuthenticated]);

  const loadExperiments = async (page = 1, limit = 10, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: ExperimentListResponse = await experimentsService.getExperiments(page, limit, status);
      setExperiments(response.experiments);
      setPagination({
        page: response.page,
        limit: response.limit,
        totalCount: response.totalCount,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiments';
      setError(errorMessage);
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExperiment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const experiment = await experimentsService.getExperiment(id);
      setSelectedExperiment(experiment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment';
      setError(errorMessage);
      console.error('Failed to load experiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async (experimentData: CreateExperimentRequest): Promise<Experiment> => {
    try {
      setLoading(true);
      setError(null);
      const newExperiment = await experimentsService.createExperiment(experimentData);
      setExperiments(prev => [newExperiment, ...prev]);
      await loadStats();
      return newExperiment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create experiment';
      setError(errorMessage);
      console.error('Failed to create experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExperiment = async (id: string, updates: UpdateExperimentRequest): Promise<Experiment> => {
    try {
      setLoading(true);
      setError(null);
      const updatedExperiment = await experimentsService.updateExperiment(id, updates);
      
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? updatedExperiment : exp)
      );
      
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(updatedExperiment);
      }
      
      return updatedExperiment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update experiment';
      setError(errorMessage);
      console.error('Failed to update experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExperiment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await experimentsService.deleteExperiment(id);
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(null);
      }
      
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete experiment';
      setError(errorMessage);
      console.error('Failed to delete experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startExperiment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedExperiment = await experimentsService.startExperiment(id);
      
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? updatedExperiment : exp)
      );
      
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(updatedExperiment);
      }
      
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start experiment';
      setError(errorMessage);
      console.error('Failed to start experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const pauseExperiment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedExperiment = await experimentsService.pauseExperiment(id);
      
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? updatedExperiment : exp)
      );
      
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(updatedExperiment);
      }
      
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause experiment';
      setError(errorMessage);
      console.error('Failed to pause experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeExperiment = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedExperiment = await experimentsService.completeExperiment(id);
      
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? updatedExperiment : exp)
      );
      
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(updatedExperiment);
      }
      
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete experiment';
      setError(errorMessage);
      console.error('Failed to complete experiment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await experimentsService.getStatsOverview();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const clearSelectedExperiment = () => {
    setSelectedExperiment(null);
  };

  const refreshExperiments = async () => {
    await loadExperiments(pagination.page, pagination.limit);
    await loadStats();
  };

  const value: ExperimentsContextType = {
    experiments,
    stats,
    loading,
    error,
    selectedExperiment,
    pagination,
    loadExperiments,
    loadExperiment,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    loadStats,
    clearSelectedExperiment,
    refreshExperiments,
  };

  return <ExperimentsContext.Provider value={value}>{children}</ExperimentsContext.Provider>;
};

export const useExperiments = (): ExperimentsContextType => {
  const context = useContext(ExperimentsContext);
  if (context === undefined) {
    throw new Error('useExperiments must be used within an ExperimentsProvider');
  }
  return context;
};

export default ExperimentsContext;