'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, verificamos si la tabla de transacciones existe
    const tableExists = await queryInterface.tableExists('transactions');
    
    if (!tableExists) {
      // Si la tabla no existe, la creamos completa
      await queryInterface.createTable('transactions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        account_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'ID de la cuenta asociada a la transacción'
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false
        },
        currency: {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'EUR'
        },
        concept: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        category_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'categories',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        subcategory_id: {
          type: Sequelize.UUID,
          allowNull: true
        },
        is_recurring: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        tags: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        },
        location: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'completed'
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    } else {
      // Si la tabla ya existe, añadimos los nuevos campos si no existen
      const columns = await queryInterface.describeTable('transactions');
      
      if (!columns.currency) {
        await queryInterface.addColumn('transactions', 'currency', {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'EUR'
        });
      }

      if (!columns.account_id) {
        await queryInterface.addColumn('transactions', 'account_id', {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'ID de la cuenta asociada a la transacción'
        });
      }

      if (!columns.description) {
        await queryInterface.addColumn('transactions', 'description', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }

      if (!columns.notes) {
        await queryInterface.addColumn('transactions', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true
        });
      }

      if (!columns.subcategory_id) {
        await queryInterface.addColumn('transactions', 'subcategory_id', {
          type: Sequelize.UUID,
          allowNull: true
        });
      }

      if (!columns.is_recurring) {
        await queryInterface.addColumn('transactions', 'is_recurring', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
      
      if (!columns.category_id) {
        await queryInterface.addColumn('transactions', 'category_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'categories',
            key: 'id'
          },
          onDelete: 'SET NULL'
        });
      }
      
      if (!columns.tags) {
        await queryInterface.addColumn('transactions', 'tags', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        });
      }
      
      if (!columns.location) {
        await queryInterface.addColumn('transactions', 'location', {
          type: Sequelize.JSONB,
          allowNull: true
        });
      }
      
      if (!columns.status) {
        await queryInterface.addColumn('transactions', 'status', {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'completed'
        });
      }
      
      if (!columns.metadata) {
        await queryInterface.addColumn('transactions', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: true
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Comprobar si la tabla existe
    const tableExists = await queryInterface.tableExists('transactions');
    
    if (tableExists) {
      const columns = await queryInterface.describeTable('transactions');
      
      // Remover los nuevos campos si existen
      if (columns.currency) {
        await queryInterface.removeColumn('transactions', 'currency');
      }
      
      if (columns.account_id) {
        await queryInterface.removeColumn('transactions', 'account_id');
      }
      
      if (columns.description) {
        await queryInterface.removeColumn('transactions', 'description');
      }
      
      if (columns.notes) {
        await queryInterface.removeColumn('transactions', 'notes');
      }
      
      if (columns.subcategory_id) {
        await queryInterface.removeColumn('transactions', 'subcategory_id');
      }
      
      if (columns.is_recurring) {
        await queryInterface.removeColumn('transactions', 'is_recurring');
      }
      
      if (columns.category_id) {
        await queryInterface.removeColumn('transactions', 'category_id');
      }
      
      if (columns.tags) {
        await queryInterface.removeColumn('transactions', 'tags');
      }
      
      if (columns.location) {
        await queryInterface.removeColumn('transactions', 'location');
      }
      
      if (columns.status) {
        await queryInterface.removeColumn('transactions', 'status');
      }
    }
  }
};
