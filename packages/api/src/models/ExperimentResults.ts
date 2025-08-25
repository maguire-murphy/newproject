import { Table, Column, Model, DataType, Index, Default } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'experiment_results',
  timestamps: false,
  indexes: [
    { fields: ['experimentId', 'variantId', 'date'] },
  ]
})
export class ExperimentResults extends Model {
  @Default(uuidv4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  experimentId!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  variantId!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  uniqueUsers!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  conversions!: number;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  conversionRate!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  engagementMetrics!: {
    totalEvents?: number;
    averageEventsPerUser?: number;
    bounceRate?: number;
    averageSessionDuration?: number;
  };

  @Column({
    type: DataType.FLOAT,
  })
  statisticalSignificance?: number;

  @Column({
    type: DataType.JSONB,
  })
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}