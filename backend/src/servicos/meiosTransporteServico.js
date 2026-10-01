const meiosTransporteRepositorio = require("../repositorios/meiosTransporteRepositorio");

async function listar() {
  return meiosTransporteRepositorio.listar();
}

module.exports = { listar };
