const noticiasRepositorio = require("../repositorios/noticiasRepositorio");
const noticiasFonteServico = require("../servicos/noticiasFonteServico");
const ErroApi = require("../utilitarios/erroApi");

// Notícias reais (RSS) são a fonte principal; se a busca externa falhar
// (sem internet, Google fora do ar, etc.) cai para o conteúdo semeado em
// noticiasRepositorio, pra a seção nunca ficar vazia.
async function listar(idioma = "pt") {
  try {
    const reais = await noticiasFonteServico.buscarNoticiasReais(idioma);
    if (reais.length) return reais;
  } catch (erro) {
    console.error("Falha ao buscar notícias reais, usando fallback:", erro.message);
  }
  return noticiasRepositorio.listar();
}

async function buscarPorId(id, idioma = "pt") {
  const todas = await listar(idioma);
  const noticia = todas.find((n) => n.id === id);
  if (!noticia) throw new ErroApi(404, "Notícia não encontrada.");
  return noticia;
}

module.exports = { listar, buscarPorId };
