import { Table, Column, Model, DataType, BelongsTo, ForeignKey, HasMany, Default } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { randomBytes } from 'crypto';

@Table({
  tableName: 'projects',
  timestamps: true,
})
export class Project extends Model {
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
    type: DataType.STRING,
    allowNull: false,
  })
  domain!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  trackingId!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
  })
  organizationId!: string;

  @BelongsTo(() => Organization)
  organization!: Organization;

  @Column({
    type: DataType.STRING,
  })
  amplitudeApiKey?: string;

  @Column({
    type: DataType.STRING,
  })
  amplitudeSecretKey?: string;

  @Column({
    type: DataType.STRING,
  })
  posthogApiKey?: string;

  @Column({
    type: DataType.STRING,
  })
  posthogProjectId?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  // @HasMany(() => Experiment)
  // experiments!: Experiment[];

  static generateTrackingId(): string {
    return 'bo_' + randomBytes(12).toString('hex');
  }
}