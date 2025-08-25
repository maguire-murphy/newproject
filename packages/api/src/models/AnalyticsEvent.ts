import { Table, Column, Model, DataType, Index, Default } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'analytics_events',
  timestamps: false,
  indexes: [
    { fields: ['organizationId', 'projectId'] },
    { fields: ['experimentId', 'variantId'] },
    { fields: ['timestamp'] },
    { fields: ['userId'] },
    { fields: ['eventType'] }
  ]
})
export class AnalyticsEvent extends Model {
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
  organizationId!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  projectId!: string;

  @Column({
    type: DataType.UUID,
  })
  experimentId?: string;

  @Column({
    type: DataType.UUID,
  })
  variantId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userId!: string; // Can be anonymous ID

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  eventType!: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  properties!: any; // Flexible JSON storage like MongoDB

  @Column({
    type: DataType.STRING,
  })
  sessionId?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  timestamp!: Date;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  context!: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    url?: string;
    device?: string;
    browser?: string;
  };
}