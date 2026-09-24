const noticiasServico = require("../servicos/noticiasServico");
const assincrono = require("../utilitarios/assincrono");

const listar = assincrono(async (_req, res) => {
  res.status(200).json(await noticiasServico.listar());
});

const buscarPorId = assincrono(async (req, res) => {
  res.status(200).json(await noticiasServico.buscarPorId(req.params.id));
});

module.exports = { listar, buscarPorId };
