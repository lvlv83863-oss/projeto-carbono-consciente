const { Router } = require("express");
const controlador = require("../controladores/autenticacaoControlador");
const autenticar = require("../intermediarios/autenticar");

const rotas = Router();

rotas.post("/registrar", controlador.registrar);
rotas.post("/login", controlador.login);
rotas.get("/me", autenticar, controlador.me);
rotas.post("/google", controlador.google);

module.exports = rotas;
