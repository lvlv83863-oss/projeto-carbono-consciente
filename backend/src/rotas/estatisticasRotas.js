const { Router } = require("express");
const controlador = require("../controladores/estatisticasControlador");

const rotas = Router();

rotas.get("/", controlador.listar);

module.exports = rotas;
