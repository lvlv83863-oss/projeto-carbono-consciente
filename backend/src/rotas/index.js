const { Router } = require("express");

const rotas = Router();

rotas.use("/auth", require("./autenticacaoRotas"));
rotas.use("/noticias", require("./noticiasRotas"));
rotas.use("/estatisticas", require("./estatisticasRotas"));

module.exports = rotas;
