const estatisticasServico = require("../servicos/estatisticasServico");

function listar(_req, res) {
  res.status(200).json(estatisticasServico.listar());
}

module.exports = { listar };
