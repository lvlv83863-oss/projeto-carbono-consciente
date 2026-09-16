const noticiasRepositorio = require("../repositorios/noticiasRepositorio");
const ErroApi = require("../utilitarios/erroApi");

function listar() {
  return noticiasRepositorio.listar();
}

function buscarPorId(id) {
  const noticia = noticiasRepositorio.buscarPorId(id);
  if (!noticia) throw new ErroApi(404, "Notícia não encontrada.");
  return noticia;
}

module.exports = { listar, buscarPorId };
