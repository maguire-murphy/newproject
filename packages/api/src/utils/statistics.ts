import { Experiment } from '../models/Experiment';
import { ExperimentResults } from '../models/ExperimentResults';

export interface StatisticalResult {
  variantId: string;
  variantName: string;
  sampleSize: number;
  conversions: number;
  conversionRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue?: number;
  isSignificant?: boolean;
  uplift?: number;
}

export async function calculateStatistics(
  experiment: Experiment,
  results: ExperimentResults[]
): Promise<StatisticalResult[]> {
  const variantStats: Map<string, StatisticalResult> = new Map();

  // Aggregate results by variant
  experiment.variants.forEach(variant => {
    const variantResults = results.filter(r => r.variantId === variant.id);
    
    const totalUsers = variantResults.reduce((sum, r) => sum + r.uniqueUsers, 0);
    const totalConversions = variantResults.reduce((sum, r) => sum + r.conversions, 0);
    const conversionRate = totalUsers > 0 ? totalConversions / totalUsers : 0;

    // Calculate confidence interval (Wilson score interval)
    const ci = calculateConfidenceInterval(totalConversions, totalUsers);

    variantStats.set(variant.id, {
      variantId: variant.id,
      variantName: variant.name,
      sampleSize: totalUsers,
      conversions: totalConversions,
      conversionRate,
      confidenceInterval: ci,
    });
  });

  // Find control variant
  const control = experiment.variants.find(v => v.isControl);
  if (control) {
    const controlStats = variantStats.get(control.id);
    
    // Calculate p-values and uplift for each variant vs control
    variantStats.forEach((stats, variantId) => {
      if (variantId !== control.id && controlStats) {
        const pValue = calculatePValue(
          stats.conversions,
          stats.sampleSize,
          controlStats.conversions,
          controlStats.sampleSize
        );

        stats.pValue = pValue;
        stats.isSignificant = pValue < 0.05;
        stats.uplift = controlStats.conversionRate > 0
          ? ((stats.conversionRate - controlStats.conversionRate) / controlStats.conversionRate) * 100
          : 0;
      }
    });
  }

  return Array.from(variantStats.values());
}

function calculateConfidenceInterval(
  successes: number,
  trials: number,
  confidence: number = 0.95
): { lower: number; upper: number } {
  if (trials === 0) {
    return { lower: 0, upper: 0 };
  }

  // Wilson score interval
  const z = 1.96; // 95% confidence
  const phat = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const centre = (phat + (z * z) / (2 * trials)) / denominator;
  const halfWidth = (z * Math.sqrt((phat * (1 - phat) / trials) + (z * z) / (4 * trials * trials))) / denominator;

  return {
    lower: Math.max(0, centre - halfWidth),
    upper: Math.min(1, centre + halfWidth),
  };
}

function calculatePValue(
  successesA: number,
  trialsA: number,
  successesB: number,
  trialsB: number
): number {
  // Z-test for proportions
  const pA = successesA / trialsA;
  const pB = successesB / trialsB;
  const pPooled = (successesA + successesB) / (trialsA + trialsB);
  
  const standardError = Math.sqrt(
    pPooled * (1 - pPooled) * (1 / trialsA + 1 / trialsB)
  );
  
  if (standardError === 0) return 1;
  
  const z = Math.abs(pA - pB) / standardError;
  
  // Approximate p-value using normal distribution
  return 2 * (1 - normalCDF(z));
}

function normalCDF(z: number): number {
  // Approximation of the cumulative distribution function for standard normal
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * z);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * Math.exp(-z * z));

  return 0.5 * (1.0 + sign * y);
}

export function calculateSampleSize(
  baselineConversion: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  significance: number = 0.05
): number {
  // Sample size calculation for two-proportion z-test
  const zAlpha = 1.96; // 95% confidence
  const zBeta = 0.84; // 80% power
  
  const p1 = baselineConversion;
  const p2 = baselineConversion * (1 + minimumDetectableEffect);
  const pBar = (p1 + p2) / 2;
  
  const numerator = 2 * pBar * (1 - pBar) * Math.pow(zAlpha + zBeta, 2);
  const denominator = Math.pow(p1 - p2, 2);
  
  return Math.ceil(numerator / denominator);
}