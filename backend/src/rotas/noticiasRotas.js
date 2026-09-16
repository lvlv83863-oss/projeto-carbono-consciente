const { Router } = require("express");
const controlador = require("../controladores/noticiasControlador");

const rotas = Router();

rotas.get("/", controlador.listar);
rotas.get("/:id", controlador.buscarPorId);

module.exports = rotas;
