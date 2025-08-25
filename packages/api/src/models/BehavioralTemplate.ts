import { Table, Column, Model, DataType, Default } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { BehavioralInterventionType } from './Experiment';

@Table({
  tableName: 'behavioral_templates',
  timestamps: true,
})
export class BehavioralTemplate extends Model {
  @Default(uuidv4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(BehavioralInterventionType)),
    allowNull: false,
  })
  interventionType!: BehavioralInterventionType;

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
    type: DataType.JSONB,
    defaultValue: {},
  })
  defaultConfiguration!: any;

  @Column({
    type: DataType.STRING,
  })
  category?: string;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  effectivenessScore!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  bestPractices!: {
    dos?: string[];
    donts?: string[];
    tips?: string[];
  };
}