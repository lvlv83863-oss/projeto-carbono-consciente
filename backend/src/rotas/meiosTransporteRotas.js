const { Router } = require("express");
const controlador = require("../controladores/meiosTransporteControlador");

const rotas = Router();

rotas.get("/", controlador.listar);

module.exports = rotas;
