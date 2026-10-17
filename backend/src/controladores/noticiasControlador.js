const noticiasServico = require("../servicos/noticiasServico");
const assincrono = require("../utilitarios/assincrono");

const listar = assincrono(async (req, res) => {
  res.status(200).json(await noticiasServico.listar(req.query.idioma));
});

const buscarPorId = assincrono(async (req, res) => {
  res.status(200).json(await noticiasServico.buscarPorId(req.params.id, req.query.idioma));
});

module.exports = { listar, buscarPorId };
