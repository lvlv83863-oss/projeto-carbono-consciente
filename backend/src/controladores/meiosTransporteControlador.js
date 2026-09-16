const meiosTransporteServico = require("../servicos/meiosTransporteServico");

function listar(_req, res) {
  res.status(200).json(meiosTransporteServico.listar());
}

module.exports = { listar };
