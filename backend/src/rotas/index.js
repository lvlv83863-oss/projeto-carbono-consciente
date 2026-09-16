const { Router } = require("express");

const rotas = Router();

rotas.use("/auth", require("./autenticacaoRotas"));
rotas.use("/noticias", require("./noticiasRotas"));
rotas.use("/estatisticas", require("./estatisticasRotas"));
rotas.use("/meios-transporte", require("./meiosTransporteRotas"));
rotas.use("/habitos", require("./habitosRotas"));

module.exports = rotas;
