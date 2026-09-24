const { ler } = require("./armazenamentoJson");

const ARQUIVO = "noticias.json";

// ---------------------------------------------------------------------
// DESENHO DE TABELA (para quando entrar um banco de verdade):
//
//   CREATE TABLE noticias (
//     id            VARCHAR PRIMARY KEY,
//     categoria     VARCHAR NOT NULL,
//     icone         VARCHAR NOT NULL,   -- chave semântica (ex.: "globo") — o front escolhe o SVG
//     cor_classe    VARCHAR NOT NULL,   -- classe CSS já usada no front (bg-clima, bg-energia, ...)
//     titulo        TEXT NOT NULL,
//     fonte         VARCHAR NULL,       -- nome do veículo/fonte da notícia
//     data          DATETIME NOT NULL,
//     link_externo  VARCHAR NULL        -- matéria original, aberta em nova aba
//   );
//
// Este arquivo é só o FALLBACK: a fonte principal de notícias é o RSS real
// buscado em backend/src/servicos/noticiasFonteServico.js — este JSON só é
// usado se aquela busca externa falhar, pra seção nunca ficar vazia.
// Somente leitura — não há tela de administração no front para criar/editar
// notícias.
// ---------------------------------------------------------------------

// SELECT * FROM noticias ORDER BY data DESC
function listar() {
  return ler(ARQUIVO)
    .slice()
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

// SELECT * FROM noticias WHERE id = ? LIMIT 1
function buscarPorId(id) {
  return listar().find((n) => n.id === id) || null;
}

module.exports = { listar, buscarPorId };
