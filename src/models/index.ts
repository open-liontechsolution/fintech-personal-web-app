import User from './User';
import InvitationCode from './InvitationCode';
import Transaction from './Transaction';

// Define model associations here if needed
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(InvitationCode, { foreignKey: 'createdBy', as: 'createdInvitations' });
User.hasMany(InvitationCode, { foreignKey: 'usedBy', as: 'usedInvitations' });
InvitationCode.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
InvitationCode.belongsTo(User, { foreignKey: 'usedBy', as: 'user' });

export {
  User,
  InvitationCode,
  Transaction
};
