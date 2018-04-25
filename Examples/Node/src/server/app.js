const compression = require('compression')
const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const User = require('./models')

const app = express()

// Add middle-ware
app.use(compression())
// Use logger on requests
app.use(logger('dev'))
// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

/** This should be refactored into a routes file, and a controllers file
 * for the User model, however, to make things simple it's being kept like this.
 * 
 * This creates a User sequelize model, which when created, will cause the
 * `beforeCreate` function of the User model to be called. That function 
 * will hash the req.body.password into a secure password and over-write the given
 * plain-text password
 */
app.post('/users/create', (req, res) => {
    return User
      .create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      })
      .then(user => res.status(201).send(user))
      // Only happens when creating a user that already has given email
      .catch(Sequelize.UniqueConstraintError, uniqError =>
        res.status(409).json({
          'message:': uniqError.errors[0].message,
          'value:': uniqError.errors[0].value,
        }))
      // Error caused by invalid email, name length, etc
      .catch(Sequelize.ValidationError, valError =>
        res.status(409).json({
          'errors:': valError.errors.map(val => ({ message: val.message, value: val.value })),
        }))
      .catch(error => res.status(400).json({ message: error.toString() }))
})

module.exports = app
