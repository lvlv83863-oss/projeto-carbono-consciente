const curiosidadesRepositorio = require("../repositorios/curiosidadesRepositorio");

function listar() {
  return curiosidadesRepositorio.listar();
}

module.exports = { listar };
