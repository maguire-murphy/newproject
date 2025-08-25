import { Table, Column, Model, DataType, BelongsTo, ForeignKey, HasMany, Default, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Project } from './Project';
import { Variant } from './Variant';

export enum ExperimentType {
  AB_TEST = 'ab_test',
  MULTIVARIATE = 'multivariate'
}

export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum BehavioralInterventionType {
  LOSS_AVERSION = 'loss_aversion',
  SOCIAL_PROOF = 'social_proof',
  COMMITMENT_DEVICES = 'commitment_devices',
  PROGRESS_INDICATORS = 'progress_indicators',
  SCARCITY_URGENCY = 'scarcity_urgency',
  ANCHORING = 'anchoring',
  RECIPROCITY = 'reciprocity'
}

@Table({
  tableName: 'experiments',
  timestamps: true,
})
export class Experiment extends Model {
  @Default(uuidv4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  hypothesis!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ExperimentType)),
    defaultValue: ExperimentType.AB_TEST,
  })
  type!: ExperimentType;

  @Column({
    type: DataType.ENUM(...Object.values(ExperimentStatus)),
    defaultValue: ExperimentStatus.DRAFT,
  })
  status!: ExperimentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(BehavioralInterventionType)),
    allowNull: false,
  })
  interventionType!: BehavioralInterventionType;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
  })
  projectId!: string;

  @BelongsTo(() => Project)
  project!: Project;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  successMetrics!: {
    primaryMetric: string;
    secondaryMetrics?: string[];
    minimumSampleSize?: number;
    confidenceLevel?: number;
  };

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
  })
  trafficAllocation!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  targetingRules!: {
    userSegments?: string[];
    urlPatterns?: string[];
    deviceTypes?: string[];
    customRules?: any[];
  };

  @Column({
    type: DataType.DATE,
  })
  startedAt?: Date;

  @Column({
    type: DataType.DATE,
  })
  completedAt?: Date;

  @Column({
    type: DataType.UUID,
  })
  createdBy!: string;

  @HasMany(() => Variant)
  variants!: Variant[];
}