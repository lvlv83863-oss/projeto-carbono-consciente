const curiosidadesServico = require("../servicos/curiosidadesServico");

function listar(_req, res) {
  res.status(200).json(curiosidadesServico.listar());
}

module.exports = { listar };
