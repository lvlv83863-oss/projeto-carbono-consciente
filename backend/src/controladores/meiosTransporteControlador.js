const meiosTransporteServico = require("../servicos/meiosTransporteServico");
const assincrono = require("../utilitarios/assincrono");

const listar = assincrono(async (_req, res) => {
  res.status(200).json(await meiosTransporteServico.listar());
});

module.exports = { listar };
