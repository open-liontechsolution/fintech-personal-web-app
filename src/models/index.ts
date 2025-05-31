import User from './User';
import InvitationCode from './InvitationCode';
import Transaction from './Transaction';
import Category from './Category';
import ExchangeRate from './ExchangeRate';
import Account from './Account';

// Definir relaciones entre modelos

// Relaciones de User
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(InvitationCode, { foreignKey: 'createdBy', as: 'createdInvitations' });
User.hasMany(InvitationCode, { foreignKey: 'usedBy', as: 'usedInvitations' });
User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });

// Relaciones de Transaction
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Se mantiene 'user' como el alias estándar
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Transaction.belongsTo(Category, { foreignKey: 'subcategoryId', as: 'subcategory' });
Transaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Relaciones de InvitationCode
InvitationCode.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
InvitationCode.belongsTo(User, { foreignKey: 'usedBy', as: 'usedByUser' });

// Relaciones de Category (relaciones jerárquicas se definen en el propio modelo)
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Category.hasMany(Transaction, { foreignKey: 'subcategoryId', as: 'subcategoryTransactions' });

// Relaciones de Account
Account.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Account.hasMany(Transaction, { foreignKey: 'accountId', as: 'transactions' });

// Exportar todos los modelos
export {
  User,
  InvitationCode,
  Transaction,
  Category,
  ExchangeRate,
  Account
};
