const meiosTransporteRepositorio = require("../repositorios/meiosTransporteRepositorio");

function listar() {
  return meiosTransporteRepositorio.listar();
}

module.exports = { listar };
