export default {
  key: '0.8.4',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.removeIndex('App', 'path');
    queryInterface.addConstraint('App', ['path', 'OrganizationId'], {
      type: 'unique',
      name: 'UniquePathIndex',
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.removeConstraint('App', 'UniquePathIndex');
    queryInterface.addConstraint('App', ['path'], { type: 'unique', name: 'path' });
  },
};
