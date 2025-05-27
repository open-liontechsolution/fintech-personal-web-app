'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Generate 5 invitation codes for initial users
    const invitationCodes = Array.from({ length: 5 }, () => ({
      id: uuidv4(),
      code: generateInvitationCode(),
      created_by: null, // No creator as these are initial codes
      used_by: null,
      is_used: false,
      expires_at: null, // Never expire
      created_at: new Date(),
      updated_at: new Date()
    }));

    return queryInterface.bulkInsert('invitation_codes', invitationCodes, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('invitation_codes', null, {});
  }
};

// Function to generate a random invitation code
function generateInvitationCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
