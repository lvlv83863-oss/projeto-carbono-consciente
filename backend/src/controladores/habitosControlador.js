const habitosServico = require("../servicos/habitosServico");

function criar(req, res) {
  const registro = habitosServico.criar(req.usuarioId, req.body || {});
  res.status(201).json(registro);
}

function listar(req, res) {
  res.status(200).json(habitosServico.listarPorUsuario(req.usuarioId));
}

function remover(req, res) {
  habitosServico.remover(req.params.id, req.usuarioId);
  res.status(204).send();
}

function resumo(req, res) {
  res.status(200).json(habitosServico.resumo(req.usuarioId));
}

module.exports = { criar, listar, remover, resumo };
