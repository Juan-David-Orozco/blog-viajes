const express = require('express')
const aplicacion = express()
const mysql = require('mysql2')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: 'juan',
  database: 'blog_viajes'
})

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.set("view engine", "ejs")
aplicacion.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
aplicacion.use(flash())
aplicacion.use(express.static('public'))

aplicacion.get('/', function (peticion, respuesta) {
  pool.getConnection(function(err, connection) {
    const consulta = `
      SELECT
      titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ORDER BY fecha_hora DESC
      LIMIT 5
    `
    connection.query(consulta, function (error, filas, campos) {
      respuesta.render('index', { publicaciones: filas })
    })
    connection.release()
  })
})

aplicacion.get('/registro', function (peticion, respuesta) {
  respuesta.render('registro', { mensaje: peticion.flash('mensaje') })
})

aplicacion.post('/procesar_registro', function (peticion, respuesta) {
  pool.getConnection(function(err, connection) {
    
    const email = peticion.body.email.toLowerCase().trim()
    const pseudonimo = peticion.body.pseudonimo.trim()
    const contrasena = peticion.body.contrasena

    const consultaEmail = 
    `SELECT * FROM autores WHERE email = ${connection.escape(email)}`
    connection.query(consultaEmail, function (error, filas, campos) {

      if (filas.length > 0) {
        peticion.flash('mensaje', 'Email duplicado')
        respuesta.redirect('/registro')
      }
      else {
        const consultaPseudonimo =
        `SELECT * FROM autores WHERE pseudonimo = ${connection.escape(pseudonimo)}`
        connection.query(consultaPseudonimo, function (error, filas, campos) {
          if (filas.length > 0) {
            peticion.flash('mensaje', 'Pseudonimo duplicado')
            respuesta.redirect('/registro')
          }
          else {
            const consulta = 
            `INSERT INTO autores (email, contrasena, pseudonimo) VALUES
            (
              ${connection.escape(email)},
              ${connection.escape(contrasena)},
              ${connection.escape(pseudonimo)}
            )
            `
            connection.query(consulta, function (error, filas, campos) {
              peticion.flash('mensaje', 'Usuario Registrado')
              respuesta.redirect('/registro')
            })
          }
        })
      }

    })
    connection.release()

  })
})

aplicacion.listen(8080, function(){
  console.log("Servidor iniciado")
})
