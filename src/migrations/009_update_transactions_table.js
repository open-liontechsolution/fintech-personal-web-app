'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear el esquema fintech si no existe
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS fintech;');
    
    // Primero, verificamos si la tabla de transacciones existe
    // Usamos una consulta SQL directa para verificar la existencia en el esquema fintech
    const [tables] = await queryInterface.sequelize.query(
      "SELECT * FROM information_schema.tables WHERE table_schema = 'fintech' AND table_name = 'transactions'"
    );
    const tableExists = tables.length > 0;
    
    if (!tableExists) {
      // Si la tabla no existe, la creamos completa
      await queryInterface.createTable({ tableName: 'transactions', schema: 'fintech' }, {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: { tableName: 'users', schema: 'fintech' },
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
            model: { tableName: 'categories', schema: 'fintech' },
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
      const columns = await queryInterface.describeTable({ tableName: 'transactions', schema: 'fintech' });
      
      if (!columns.currency) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'currency', {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'EUR'
        });
      }

      if (!columns.account_id) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'account_id', {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'ID de la cuenta asociada a la transacción'
        });
      }

      if (!columns.description) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'description', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }

      if (!columns.notes) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'notes', {
          type: Sequelize.TEXT,
          allowNull: true
        });
      }

      if (!columns.subcategory_id) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'subcategory_id', {
          type: Sequelize.UUID,
          allowNull: true
        });
      }

      if (!columns.is_recurring) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'is_recurring', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
      
      if (!columns.category_id) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'category_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: { tableName: 'categories', schema: 'fintech' },
            key: 'id'
          },
          onDelete: 'SET NULL'
        });
      }
      
      if (!columns.tags) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        });
      }
      
      if (!columns.location) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'location', {
          type: Sequelize.JSONB,
          allowNull: true
        });
      }
      
      if (!columns.status) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'status', {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'completed'
        });
      }
      
      if (!columns.metadata) {
        await queryInterface.addColumn({ tableName: 'transactions', schema: 'fintech' }, 'metadata', {
          type: Sequelize.JSONB,
          allowNull: true
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Comprobar si la tabla existe en el esquema fintech
    const [tables] = await queryInterface.sequelize.query(
      "SELECT * FROM information_schema.tables WHERE table_schema = 'fintech' AND table_name = 'transactions'"
    );
    const tableExists = tables.length > 0;
    
    if (tableExists) {
      const columns = await queryInterface.describeTable({ tableName: 'transactions', schema: 'fintech' });
      
      // Remover los nuevos campos si existen
      if (columns.currency) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'currency');
      }
      
      if (columns.account_id) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'account_id');
      }
      
      if (columns.description) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'description');
      }
      
      if (columns.notes) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'notes');
      }
      
      if (columns.subcategory_id) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'subcategory_id');
      }
      
      if (columns.is_recurring) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'is_recurring');
      }
      
      if (columns.category_id) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'category_id');
      }
      
      if (columns.tags) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'tags');
      }
      
      if (columns.location) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'location');
      }
      
      if (columns.status) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'status');
      }
      
      if (columns.metadata) {
        await queryInterface.removeColumn({ tableName: 'transactions', schema: 'fintech' }, 'metadata');
      }
    }
  }
};
