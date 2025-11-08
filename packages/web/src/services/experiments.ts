import { apiService } from './api';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  type: 'ab_test' | 'behavioral_intervention';
  hypothesis: string;
  successMetrics: string[];
  targetAudience: any;
  startDate?: string;
  endDate?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
  results?: ExperimentResults;
}

export interface Variant {
  id: string;
  experimentId: string;
  name: string;
  description: string;
  isControl: boolean;
  weight: number;
  configuration: any;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentResults {
  id: string;
  experimentId: string;
  totalParticipants: number;
  conversionRate: number;
  statisticalSignificance: number;
  confidenceInterval: number;
  pValue: number;
  winningVariant?: string;
  results: any;
  generatedAt: string;
}

export interface CreateExperimentRequest {
  name: string;
  description: string;
  type: 'ab_test' | 'behavioral_intervention';
  hypothesis: string;
  successMetrics: string[];
  targetAudience: any;
  variants: Omit<Variant, 'id' | 'experimentId' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  hypothesis?: string;
  successMetrics?: string[];
  targetAudience?: any;
}

export interface ExperimentListResponse {
  experiments: Experiment[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface ExperimentStatsOverview {
  totalExperiments: number;
  activeExperiments: number;
  completedExperiments: number;
  totalParticipants: number;
  averageConversionRate: number;
  significantResults: number;
}

class ExperimentsService {
  async getExperiments(page = 1, limit = 10, status?: string): Promise<ExperimentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }

    return apiService.get<ExperimentListResponse>(`/experiments?${params}`);
  }

  async getExperiment(id: string): Promise<Experiment> {
    return apiService.get<Experiment>(`/experiments/${id}`);
  }

  async createExperiment(experiment: CreateExperimentRequest): Promise<Experiment> {
    return apiService.post<Experiment>('/experiments', experiment);
  }

  async updateExperiment(id: string, updates: UpdateExperimentRequest): Promise<Experiment> {
    return apiService.patch<Experiment>(`/experiments/${id}`, updates);
  }

  async deleteExperiment(id: string): Promise<void> {
    return apiService.delete(`/experiments/${id}`);
  }

  async startExperiment(id: string): Promise<Experiment> {
    return apiService.post<Experiment>(`/experiments/${id}/start`);
  }

  async pauseExperiment(id: string): Promise<Experiment> {
    return apiService.post<Experiment>(`/experiments/${id}/pause`);
  }

  async completeExperiment(id: string): Promise<Experiment> {
    return apiService.post<Experiment>(`/experiments/${id}/complete`);
  }

  async getExperimentResults(id: string): Promise<ExperimentResults> {
    return apiService.get<ExperimentResults>(`/experiments/${id}/results`);
  }

  async getStatsOverview(): Promise<ExperimentStatsOverview> {
    return apiService.get<ExperimentStatsOverview>('/experiments/stats/overview');
  }

  async createVariant(experimentId: string, variant: Omit<Variant, 'id' | 'experimentId' | 'createdAt' | 'updatedAt'>): Promise<Variant> {
    return apiService.post<Variant>(`/experiments/${experimentId}/variants`, variant);
  }

  async updateVariant(experimentId: string, variantId: string, updates: Partial<Variant>): Promise<Variant> {
    return apiService.patch<Variant>(`/experiments/${experimentId}/variants/${variantId}`, updates);
  }

  async deleteVariant(experimentId: string, variantId: string): Promise<void> {
    return apiService.delete(`/experiments/${experimentId}/variants/${variantId}`);
  }

  async getAnalytics(experimentId: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    return apiService.get(`/analytics/experiments/${experimentId}?timeRange=${timeRange}`);
  }

  async getEventHistory(experimentId: string, page = 1, limit = 50): Promise<any> {
    return apiService.get(`/analytics/experiments/${experimentId}/events?page=${page}&limit=${limit}`);
  }
}

export const experimentsService = new ExperimentsService();
export default experimentsService;