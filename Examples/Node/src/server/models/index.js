// Boiler-plate code for collecting all models in this folder

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const basename = path.basename(module.filename)

const db = {}

/**
* NOTE: The DATABASE_URL environment is set in the `docker-compose.yml` file
* This tells sequelize where to set up the connection for the PostgreSQL database
*/
const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres' })

fs
  .readdirSync(__dirname)
  .filter(file =>
    (file.indexOf('.') !== 0) &&
    (file !== basename) &&
    (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db