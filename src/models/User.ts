import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Interface for User attributes
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationTokenExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpires: Date | null;
  invitationLimit: number;
}

// Interface for User creation attributes - these are the fields that
// we can omit or set as optional when creating a new record
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | 'emailVerified' | 'emailVerificationToken' | 'emailVerificationTokenExpires' | 'passwordResetToken' | 'passwordResetTokenExpires' | 'invitationLimit'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public lastLogin!: Date | null;
  public emailVerified!: boolean;
  public emailVerificationToken!: string | null;
  public emailVerificationTokenExpires!: Date | null;
  public passwordResetToken!: string | null;
  public passwordResetTokenExpires!: Date | null;
  public invitationLimit!: number;

  // Helper method to compare passwords
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Helper method to convert model to DTO without sensitive fields
  public toDTO(): Omit<UserAttributes, 'password'> {
    const { password, ...userDTO } = this.toJSON();
    return userDTO;
  }

  // Check if user can create more invitation codes
  public async canCreateInvitation(): Promise<boolean> {
    // Import dynamically to avoid circular dependency
    const { InvitationCode } = require('./index');
    
    // Count how many invitation codes the user has created
    const createdInvitationsCount = await InvitationCode.count({
      where: { createdBy: this.id }
    });
    
    // Check if the user has reached their limit
    return createdInvitationsCount < this.invitationLimit;
  }
  
  // Get how many invitations the user can still create
  public async getRemainingInvitations(): Promise<number> {
    // Import dynamically to avoid circular dependency
    const { InvitationCode } = require('./index');
    
    // Count how many invitation codes the user has created
    const createdInvitationsCount = await InvitationCode.count({
      where: { createdBy: this.id }
    });
    
    // Calculate remaining invitations
    return Math.max(0, this.invitationLimit - createdInvitationsCount);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_verification_token',
    },
    emailVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_token_expires',
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token',
    },
    passwordResetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_token_expires',
    },
    invitationLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 3, // Por defecto, cada usuario puede crear 3 invitaciones
      allowNull: false,
      field: 'invitation_limit',
    },
  },
  {
    sequelize,
    tableName: 'users',
    schema: process.env.DB_SCHEMA || 'fintech',
    modelName: 'User',
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user: User) => {
        // Only hash the password if it has been modified
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
