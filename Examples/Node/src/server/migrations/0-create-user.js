module.exports = {
  up: (queryInterface, DataTypes) => {
    queryInterface.createTable('Users', {
      // user.id
      id: {
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // user.name
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      // user.email
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      // user.password
      password: {
        type: DataTypes.BLOB,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },

      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
    })
  },

  down: queryInterface => queryInterface.dropTable('Users'),
}