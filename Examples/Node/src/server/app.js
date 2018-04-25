const compression = require('compression')
const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const { Sequelize, User } = require('./models')

const app = express()

// Add middle-ware
app.use(compression())
// Use logger on requests
app.use(logger('dev'))
// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//////////////////////////////////// ROUTES //////////////////////////////////////////////////

// Root /, visit at http://localhost:8000/
app.get('/', (req, res) => {
  return res.status(200).send('Hey there!')
})

/** 
 * This should be refactored into a routes file, and a controllers file
 * for the User model, however, to make things simple it's being kept like this.
 * 
 * This creates a User sequelize model, which when created, will cause the
 * `beforeCreate` function of the User model to be called. That function 
 * will hash the req.body.password into a secure password and over-write the given
 * plain-text password
 * 
 * Example usage:
 * 
 * curl -X POST \
 * http://localhost:8000/users/create \
 * -H 'Cache-Control: no-cache' \
 * -H 'Content-Type: application/x-www-form-urlencoded' \
 * -H 'Postman-Token: ed38da3b-a7d7-403f-be92-0113544c784c' \
 * -d 'name=test%20user&email=test%40gmail.com&password=password123'
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
      .catch((error) => {
        res.status(500).send('Error')
        throw error
      })
})

/**
 * Again, refactor this to its own controller/routes
 * 
 * Before testing this, make sure to create a user
 * This tests "logging" in a user, verifies that the given password matches the give users password
 * 
 * Takes id, password
 * Returns a session/whatever you do when you log someone in, in your app.
 * 
 * Example usage:
 * 
 * curl -X POST \
 * http://localhost:8000/users/login \
 * -H 'Cache-Control: no-cache' \
 * -H 'Content-Type: application/x-www-form-urlencoded' \
 * -H 'Postman-Token: cbb7fda0-52dc-42e7-922e-d997d377a3a6' \
 * -d 'id=932a8419-258f-4fdd-acf8-693589735ca2&password=password123'
 */
app.post('/users/login', async (req, res) => {
  if (!req.body.id || !req.body.password) {
    return res.status(400).json({ message: 'Invalid message format' })
  }

  try {
    const user = await User.findById(req.body.id)

    if (!user) {
      return res.status(404).json({ message: `No user found with id: ${req.body.id}` })
    }

    const verified = await user.verifyPassword(req.body.password)

    if (!verified) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    // TODO: Do stuff with session/jwt/etc
    return res.status(200).json({ message: 'Logged in' })

  } catch (error) {
    return res.status(500).json({ message: `Error: ${error.toString()}` })
  }
})

module.exports = app
