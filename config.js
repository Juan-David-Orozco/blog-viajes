require('dotenv').config()

const db = {
  dbname: process.env.DB_NAME,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
}

const PORT = process.env.PORT || 3000

module.exports = { db, PORT }