const express = require('express')
const router = express.Router()
const mysql = require('mysql2')
var path = require('path')

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
      if (peticion.files && peticion.files.foto){
        const archivoFoto = peticion.files.foto
        const id = filas.insertId
        const nombreArchivo = `${id}${path.extname(archivoFoto.name)}`
        archivoFoto.mv(`./public/publicaciones/${nombreArchivo}`, (error) => {
          const consultaFoto = `
            UPDATE publicaciones SET
            foto = ${connection.escape(nombreArchivo)}
            WHERE id = ${connection.escape(id)}
          `
          connection.query(consultaFoto, (error, filas, campos) => {
            peticion.flash('mensaje', 'Publicación agregada con foto')
            respuesta.redirect('/admin/index')
          })
        })
      }
      else{
        peticion.flash('mensaje', 'Publicación agregada')
        respuesta.redirect("/admin/index")
      }
    })
    connection.release()
  })
})
// -------      Fin Módulo Publicar y Crear -------------- //

// -------      Módulo Editar y Eliminar Publicacion  -------------- //
// Editar
router.get('/admin/editar/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT * FROM publicaciones
      WHERE
      id = ${connection.escape(peticion.params.id)}
      AND
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0){
        respuesta.render('admin/editar', {publicacion: filas[0], mensaje: peticion.flash('mensaje'), usuario: peticion.session.usuario})
      }
      else{
        peticion.flash('mensaje', 'Operación no permitida')
        respuesta.redirect("/admin/index")
      }
    })
    connection.release()
  })
})

router.post('/admin/procesar_editar', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      UPDATE publicaciones
      SET
      titulo = ${connection.escape(peticion.body.titulo)},
      resumen = ${connection.escape(peticion.body.resumen)},
      contenido = ${connection.escape(peticion.body.contenido)}
      WHERE
      id = ${connection.escape(peticion.body.id)}
      AND
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (peticion.files && peticion.files.foto){
        const archivoFoto = peticion.files.foto
        const id = peticion.body.id
        const nombreArchivo = `${id}${path.extname(archivoFoto.name)}`
        archivoFoto.mv(`./public/publicaciones/${nombreArchivo}`, (error) => {
          const consultaFoto = `
            UPDATE publicaciones SET
            foto = ${connection.escape(nombreArchivo)}
            WHERE id = ${connection.escape(id)}
          `
          connection.query(consultaFoto, (error, filas, campos) => {
          })
        })
      }
      if (filas && filas.changedRows > 0){
        if(peticion.files && peticion.files.foto){
          peticion.flash('mensaje', 'Publicación editada con foto')
        }
        else{
          peticion.flash('mensaje', 'Publicación editada')
        }
      }
      else{
        if(peticion.files && peticion.files.foto){
          peticion.flash('mensaje', 'Actualización foto satisfactoria')
        }
        else{
          peticion.flash('mensaje', 'Publicación no editada')
        }
      }
      respuesta.redirect("/admin/index")
    })
    connection.release()
  })
})
// Eliminar
router.get('/admin/procesar_eliminar/:id', (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      DELETE
      FROM
      publicaciones
      WHERE
      id = ${connection.escape(peticion.params.id)}
      AND
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas && filas.affectedRows > 0){
        peticion.flash('mensaje', 'Publicación eliminada')
      }
      else{
        peticion.flash('mensaje', 'Publicación no eliminada')
      }
      respuesta.redirect("/admin/index")
    })
    connection.release()
  })
})
// -------      Fin Módulo Editar y Eliminar Publicacion -------------- //


module.exports = router