import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import User from './User';

// Interface for InvitationCode attributes
interface InvitationCodeAttributes {
  id: string;
  code: string;
  createdBy: string | null;
  usedBy: string | null;
  isUsed: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for InvitationCode creation attributes
interface InvitationCodeCreationAttributes extends Optional<InvitationCodeAttributes, 'id' | 'createdAt' | 'updatedAt' | 'usedBy' | 'isUsed'> {}

class InvitationCode extends Model<InvitationCodeAttributes, InvitationCodeCreationAttributes> implements InvitationCodeAttributes {
  public id!: string;
  public code!: string;
  public createdBy!: string | null;
  public usedBy!: string | null;
  public isUsed!: boolean;
  public expiresAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Check if the invitation code is valid (not used and not expired)
  public isValid(): boolean {
    const now = new Date();
    return !this.isUsed && (this.expiresAt === null || this.expiresAt > now);
  }

  // Mark the invitation code as used by a specific user
  public async markAsUsed(userId: string): Promise<void> {
    this.isUsed = true;
    this.usedBy = userId;
    await this.save();
  }

  // Generate a random invitation code
  public static generateCode(): string {
    // Generate a random alphanumeric code (6 characters)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}

InvitationCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    usedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'used_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_used',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'invitation_codes',
    modelName: 'InvitationCode',
    underscored: true,
  }
);

// Define associations
InvitationCode.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
InvitationCode.belongsTo(User, { as: 'user', foreignKey: 'usedBy' });

export default InvitationCode;
