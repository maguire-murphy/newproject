import { Table, Column, Model, DataType, HasMany, Default, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

export enum PlanTier {
  FREE = 'free',
  GROWTH = 'growth',
  SCALE = 'scale',
  ENTERPRISE = 'enterprise'
}

@Table({
  tableName: 'organizations',
  timestamps: true,
})
export class Organization extends Model {
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
    unique: true,
    allowNull: false,
  })
  subdomain!: string;

  @Default(PlanTier.FREE)
  @Column({
    type: DataType.ENUM(...Object.values(PlanTier)),
  })
  planTier!: PlanTier;

  @Column({
    type: DataType.STRING,
  })
  stripeCustomerId?: string;

  @Column({
    type: DataType.STRING,
  })
  stripeSubscriptionId?: string;

  @Default(10000)
  @Column({
    type: DataType.INTEGER,
  })
  monthlyEventLimit!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  currentMonthEvents!: number;

  @Column({
    type: DataType.DATE,
  })
  trialEndsAt?: Date;

  @HasMany(() => require('./User').User)
  users!: any[];

  @HasMany(() => require('./Project').Project)
  projects!: any[];

  @BeforeCreate
  static addTrialPeriod(instance: Organization) {
    if (!instance.trialEndsAt) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial
      instance.trialEndsAt = trialEnd;
    }
  }
}