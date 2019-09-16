export default {
  key: '0.8.6',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.addConstraint('App', ['path', 'OrganizationId', 'deleted'], {
      type: 'unique',
      name: 'DeletedUniquePathIndex',
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.removeConstraint('App', 'DeletedUniquePathIndex');
  },
};
