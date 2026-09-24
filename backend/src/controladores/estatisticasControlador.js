const estatisticasServico = require("../servicos/estatisticasServico");

function listar(req, res) {
  res.status(200).json(estatisticasServico.listar(req.usuarioId));
}

module.exports = { listar };
