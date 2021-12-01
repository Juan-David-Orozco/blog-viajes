const express = require('express')
const router = express.Router()
const mysql = require('mysql2')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: 'juan',
  database: 'blog_viajes'
})

// -------      Módulo Inicio -------------- //
router.get('/', function (peticion, respuesta) {
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
// -------      Fin Módulo Inicio -------------- //

// -------      Módulo Registro -------------- // 
router.get('/registro', function (peticion, respuesta) {
  respuesta.render('registro', { mensaje: peticion.flash('mensaje') })
})

router.post('/procesar_registro', function (peticion, respuesta) {
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
// -------     Fin Módulo Registro -------------- //

// -------      Módulo Inicio de Sesión -------------- // 
router.get('/inicio', function (peticion, respuesta) {
  respuesta.render('inicio', { mensaje: peticion.flash('mensaje') })
})

router.post('/procesar_inicio', function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    const consulta = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(peticion.body.email)} AND
      contrasena = ${connection.escape(peticion.body.contrasena)}
    `
    connection.query(consulta, function (error, filas, campos) {
      if (filas.length > 0) {
        peticion.session.usuario = filas[0]
        respuesta.redirect('/admin/index')
      }
      else {
        peticion.flash('mensaje', 'Datos inválidos')
        respuesta.redirect('/inicio')
      }

    })
    connection.release()
  })
})
// -------      Fin Módulo Inicio de Sesión -------------- // 

module.exports = router