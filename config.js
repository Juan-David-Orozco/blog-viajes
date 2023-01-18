require('dotenv').config()

const db = {
  dbname: process.env.DB_NAME,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
}

const PORT = process.env.PORT || 3000

module.exports = { db, PORT }