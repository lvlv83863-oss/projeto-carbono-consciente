const { Router } = require("express");
const controlador = require("../controladores/habitosControlador");
const autenticar = require("../intermediarios/autenticar");

const rotas = Router();

rotas.use(autenticar); // todas as rotas de hábitos exigem usuário logado

rotas.get("/", controlador.listar);
rotas.get("/resumo", controlador.resumo);
rotas.get("/serie", controlador.serie);
rotas.post("/", controlador.criar);
rotas.delete("/:id", controlador.remover);

module.exports = rotas;
