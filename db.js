const mysql = require('mysql2')
const { db } = require('./config')

const connectDBMySQL = () => {
  const pool = mysql.createPool({
    connectionLimit: 20,
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.dbname,
    port: db.port
  })
  return pool
}

module.exports = { connectDBMySQL }