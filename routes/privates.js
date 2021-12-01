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

// Ruta para redireccionar a la vista index privada
router.get('/admin/index', function (peticion, respuesta) {
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
// Ruta para cerrar sesion 
router.get('/procesar_cerrar_sesion', function (peticion, respuesta) {
  peticion.session.destroy();
  respuesta.redirect("/")
});

// -------      Módulo Publicar y Crear -------------- //
router.get('/admin/agregar', (peticion, respuesta) => {
  respuesta.render('admin/agregar', { mensaje: peticion.flash('mensaje'), usuario: peticion.session.usuario })
})

router.post('/admin/procesar_agregar', (peticion, respuesta) => {
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

module.exports = router