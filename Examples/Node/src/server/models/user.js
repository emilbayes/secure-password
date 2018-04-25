const { hash, verify } = require('../utils/passwordHelper')

const UserModel = (sequelize, DataTypes) => {
  // User model
  const User = sequelize.define('User', {
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
      validate: {
        len: {
          args: [1, 100],
          msg: 'Invalid length for name field',
        },
      },
    },

    // user.email
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Not a valid email',
        },
      },
    },

    // user.password
    password: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  })

  // Hash password before creating user
  User.beforeCreate(user => hash(user.password).then((hashedPass) => {
    user.password = hashedPass
  }))

  // Disable returning user password when converting to JSON
  User.prototype.toJSON = function toJSON() {
    const JSON = Object.assign({}, this.get())
    delete JSON.password
    return JSON
  }


  /**
   * ASYNC
   * Verifies if the user's password is equal to given password
   * @param {string} password
   */
  User.prototype.verifyPassword = function verifyPassword(password) {
    return verify(password, this.password)
      .then((result, newHash) => {
        if (newHash) this.password = newHash
        return result
      })
  }

  return User
}

module.exports = UserModel
