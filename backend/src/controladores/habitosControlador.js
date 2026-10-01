const habitosServico = require("../servicos/habitosServico");
const assincrono = require("../utilitarios/assincrono");

const criar = assincrono(async (req, res) => {
  const registro = await habitosServico.criar(req.usuarioId, req.body || {});
  res.status(201).json(registro);
});

const listar = assincrono(async (req, res) => {
  res.status(200).json(await habitosServico.listarPorUsuario(req.usuarioId));
});

const remover = assincrono(async (req, res) => {
  await habitosServico.remover(req.params.id, req.usuarioId);
  res.status(204).send();
});

const resumo = assincrono(async (req, res) => {
  res.status(200).json(await habitosServico.resumo(req.usuarioId));
});

const serie = assincrono(async (req, res) => {
  res.status(200).json(await habitosServico.serieDiaria(req.usuarioId, 14));
});

module.exports = { criar, listar, remover, resumo, serie };
