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
    let consulta
    let modificadorConsulta = ""
    let modificadorPagina = ""
    let pagina = 0
    const busqueda = (peticion.query.busqueda) ? peticion.query.busqueda : ""
    if (busqueda != ""){
      modificadorConsulta = `
      WHERE
      titulo LIKE '%${busqueda}%' OR
      resumen LIKE '%${busqueda}%' OR
      contenido LIKE '%${busqueda}%'
      `
      modificadorPagina = ""
    }
    else{
      pagina = (peticion.query.pagina) ? parseInt(peticion.query.pagina) : 0
      if (pagina < 0) {
        pagina= 0
      }
      modificadorPagina = `LIMIT 5 OFFSET ${pagina*5}`

    }
    consulta = `
      SELECT
      publicaciones.id id, titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ${modificadorConsulta}
      ORDER BY fecha_hora DESC
      ${modificadorPagina}
    `
    connection.query(consulta, function (error, filas, campos) {
      respuesta.render('index', { publicaciones: filas, busqueda: busqueda, pagina: pagina })
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

// -------      Ruta detalle publicación -------------- //
router.get('/publicacion/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM publicaciones
      WHERE id = ${connection.escape(peticion.params.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        respuesta.render('publicacion', { publicacion: filas[0] })
      }
      else {
        respuesta.redirect('/')
      }
    })
    connection.release()
  })
})
// -------      Fin Ruta detalle publicación -------------- //

module.exports = router