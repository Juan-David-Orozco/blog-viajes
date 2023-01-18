const express = require('express')
const aplicacion = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')
const fileUpload = require('express-fileupload')
const { PORT } = require('./config')
// Se definen las enrutadores a utilizar para cada ruta especifica
const rutasMiddleware = require('./routes/middleware') 
const rutasPublicas = require('./routes/publics')
const rutasPrivadas = require('./routes/privates')

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.set("view engine", "ejs")
aplicacion.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
aplicacion.use(flash())
aplicacion.use(express.static('public'))
aplicacion.use(fileUpload())

// Se usan los enrutadores que se definieron en cada uno de los archivos externos
aplicacion.use(rutasMiddleware)
aplicacion.use(rutasPublicas)
aplicacion.use(rutasPrivadas)

/* CONEXIÓN SERVER - PUERTO 8080 */
aplicacion.listen(PORT, function(){
  console.log("Servidor iniciado en puerto", PORT)
})
