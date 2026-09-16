const noticiasServico = require("../servicos/noticiasServico");

function listar(_req, res) {
  res.status(200).json(noticiasServico.listar());
}

function buscarPorId(req, res) {
  res.status(200).json(noticiasServico.buscarPorId(req.params.id));
}

module.exports = { listar, buscarPorId };
