import User from './User';
import InvitationCode from './InvitationCode';
import Transaction from './Transaction';
import Category from './Category';
import ExchangeRate from './ExchangeRate';

// Definir relaciones entre modelos

// Relaciones de User
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(InvitationCode, { foreignKey: 'createdBy', as: 'createdInvitations' });
User.hasMany(InvitationCode, { foreignKey: 'usedBy', as: 'usedInvitations' });

// Relaciones de Transaction
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Transaction.belongsTo(Category, { foreignKey: 'subcategoryId', as: 'subcategory' });

// Relaciones de InvitationCode
InvitationCode.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
InvitationCode.belongsTo(User, { foreignKey: 'usedBy', as: 'user' });

// Relaciones de Category (relaciones jerárquicas se definen en el propio modelo)
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Category.hasMany(Transaction, { foreignKey: 'subcategoryId', as: 'subcategoryTransactions' });

// Exportar todos los modelos
export {
  User,
  InvitationCode,
  Transaction,
  Category,
  ExchangeRate
};
