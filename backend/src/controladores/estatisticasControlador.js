const estatisticasServico = require("../servicos/estatisticasServico");
const assincrono = require("../utilitarios/assincrono");

const listar = assincrono(async (req, res) => {
  res.status(200).json(await estatisticasServico.listar(req.usuarioId));
});

module.exports = { listar };
