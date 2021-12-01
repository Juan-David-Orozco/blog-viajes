const express = require('express')
const router = express.Router()

/* Middleware para validar la existencia del objeto
usuario obtenido mediante el objeto session existente
al iniciar sesion ( Validacion de Inicio de Sesión) */
router.use('/admin/', (peticion, respuesta, siguiente) => {
  if (!peticion.session.usuario) {
    peticion.flash('mensaje', 'Debe iniciar sesión')
    respuesta.redirect("/inicio")
  }
  else {
    siguiente()
  }
})

module.exports = router