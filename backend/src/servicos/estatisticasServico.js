const estatisticasRepositorio = require("../repositorios/estatisticasRepositorio");

function listar() {
  return estatisticasRepositorio.listar();
}

module.exports = { listar };
