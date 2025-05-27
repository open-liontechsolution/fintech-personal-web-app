'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Categorías principales (ingresos)
    const incomeCategory = {
      id: uuidv4(),
      name: 'Ingresos',
      description: 'Entradas de dinero',
      color: '#4CAF50',
      icon: 'trending_up',
      is_system: true,
      metadata: JSON.stringify({
        type: 'income',
        sort_order: 1
      }),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Categorías principales (gastos)
    const expenseCategories = [
      {
        id: uuidv4(),
        name: 'Vivienda',
        description: 'Gastos relacionados con el hogar',
        color: '#2196F3',
        icon: 'home',
        is_system: true,
        metadata: JSON.stringify({
          type: 'expense',
          sort_order: 2
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Alimentación',
        description: 'Gastos en comida y alimentación',
        color: '#FF9800',
        icon: 'restaurant',
        is_system: true,
        metadata: JSON.stringify({
          type: 'expense',
          sort_order: 3
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Transporte',
        description: 'Gastos de transporte y desplazamiento',
        color: '#3F51B5',
        icon: 'directions_car',
        is_system: true,
        metadata: JSON.stringify({
          type: 'expense',
          sort_order: 4
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Servicios',
        description: 'Gastos en servicios públicos y suscripciones',
        color: '#9C27B0',
        icon: 'power',
        is_system: true,
        metadata: JSON.stringify({
          type: 'expense',
          sort_order: 5
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Ocio',
        description: 'Gastos en entretenimiento y tiempo libre',
        color: '#E91E63',
        icon: 'movie',
        is_system: true,
        metadata: JSON.stringify({
          type: 'expense',
          sort_order: 6
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Tasas de cambio iniciales
    const exchangeRates = [
      {
        id: uuidv4(),
        source_currency: 'EUR',
        target_currency: 'USD',
        rate: 1.07,
        date: new Date(),
        source: 'seed',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        source_currency: 'EUR',
        target_currency: 'GBP',
        rate: 0.85,
        date: new Date(),
        source: 'seed',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        source_currency: 'USD',
        target_currency: 'EUR',
        rate: 0.93,
        date: new Date(),
        source: 'seed',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insertar categorías
    await queryInterface.bulkInsert('categories', [incomeCategory, ...expenseCategories], {});
    
    // Insertar tasas de cambio
    await queryInterface.bulkInsert('exchange_rates', exchangeRates, {});
  },

  async down(queryInterface, Sequelize) {
    // Eliminar categorías y tasas de cambio en orden inverso
    await queryInterface.bulkDelete('exchange_rates', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  }
};
