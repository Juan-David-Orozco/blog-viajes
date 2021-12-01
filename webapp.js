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

/* Middleware para validar la existencia del objeto
usuario obtenido mediante el objeto session existente
al iniciar sesion ( Validacion de Inicio de Sesión) */
aplicacion.use('/admin/', (peticion, respuesta, siguiente) => {
  if (!peticion.session.usuario) {
    peticion.flash('mensaje', 'Debe iniciar sesión')
    respuesta.redirect("/inicio")
  }
  else {
    siguiente()
  }
})

// -------      Módulo Inicio -------------- //
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
// -------      Fin Módulo Inicio -------------- //

// -------      Módulo Registro -------------- // 
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
// -------     Fin Módulo Registro -------------- //

// -------      Módulo Inicio de Sesión -------------- // 
aplicacion.get('/inicio', function (peticion, respuesta) {
  respuesta.render('inicio', { mensaje: peticion.flash('mensaje') })
})

aplicacion.post('/procesar_inicio', function (peticion, respuesta) {
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

aplicacion.get('/admin/index', function (peticion, respuesta) {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM publicaciones
      WHERE
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      respuesta.render('admin/index', { publicaciones: filas, usuario: peticion.session.usuario, mensaje: peticion.flash('mensaje')})
    })
    connection.release()
  })
})

aplicacion.get('/procesar_cerrar_sesion', function (peticion, respuesta) {
  peticion.session.destroy();
  respuesta.redirect("/")
});
// -------     Fin Módulo Inicio de Sesión -------------- // 

// -------      Módulo Publicar y Crear -------------- //
aplicacion.get('/admin/agregar', (peticion, respuesta) => {
  respuesta.render('admin/agregar', { mensaje: peticion.flash('mensaje'), usuario: peticion.session.usuario })
})

aplicacion.post('/admin/procesar_agregar', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const date = new Date()
    const fecha = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const consulta = `
      INSERT INTO
      publicaciones
      (titulo, resumen, contenido, autor_id, fecha_hora)
      VALUES
      (
        ${connection.escape(peticion.body.titulo)},
        ${connection.escape(peticion.body.resumen)},
        ${connection.escape(peticion.body.contenido)},
        ${connection.escape(peticion.session.usuario.id)},
        ${connection.escape(fecha)}
      )
    `
    connection.query(consulta, (error, filas, campos) => {
      peticion.flash('mensaje', 'Publicación agregada')
      respuesta.redirect("/admin/index")
    })
    connection.release()
  })
})
// -------      Fin Módulo Publicar y Crear -------------- // 

/* CONEXIÓN SERVER - PUERTO 8080 */
aplicacion.listen(8080, function(){
  console.log("Servidor iniciado")
})
