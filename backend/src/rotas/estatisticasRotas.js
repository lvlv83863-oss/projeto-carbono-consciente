const { Router } = require("express");
const controlador = require("../controladores/estatisticasControlador");
const autenticarOpcional = require("../intermediarios/autenticarOpcional");

const rotas = Router();

rotas.get("/", autenticarOpcional, controlador.listar);

module.exports = rotas;
