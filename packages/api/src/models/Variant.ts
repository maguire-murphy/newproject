import { Table, Column, Model, DataType, BelongsTo, ForeignKey, Default } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Experiment } from './Experiment';

@Table({
  tableName: 'variants',
  timestamps: true,
})
export class Variant extends Model {
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

  @ForeignKey(() => Experiment)
  @Column({
    type: DataType.UUID,
  })
  experimentId!: string;

  @BelongsTo(() => Experiment)
  experiment!: Experiment;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isControl!: boolean;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  weightPercentage!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  configuration!: any;
}