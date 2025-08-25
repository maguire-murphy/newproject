import { Table, Column, Model, DataType, BelongsTo, ForeignKey, Default, BeforeCreate } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Default(uuidv4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  passwordHash!: string;

  @Column({
    type: DataType.STRING,
  })
  firstName?: string;

  @Column({
    type: DataType.STRING,
  })
  lastName?: string;

  @Default(UserRole.MEMBER)
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
  })
  role!: UserRole;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
  })
  organizationId!: string;

  @BelongsTo(() => Organization)
  organization!: Organization;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  emailVerified!: boolean;

  @Column({
    type: DataType.STRING,
  })
  emailVerificationToken?: string;

  @Column({
    type: DataType.STRING,
  })
  resetPasswordToken?: string;

  @Column({
    type: DataType.DATE,
  })
  resetPasswordExpires?: Date;

  @Column({
    type: DataType.DATE,
  })
  lastLoginAt?: Date;

  @BeforeCreate
  static async hashPassword(user: User) {
    if (user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}