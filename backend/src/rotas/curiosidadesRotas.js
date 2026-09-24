const { Router } = require("express");
const controlador = require("../controladores/curiosidadesControlador");

const rotas = Router();

rotas.get("/", controlador.listar);

module.exports = rotas;
