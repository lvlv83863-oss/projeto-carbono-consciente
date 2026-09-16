const { ler } = require("./armazenamentoJson");

const ARQUIVO = "noticias.json";

// ---------------------------------------------------------------------
// DESENHO DE TABELA (para quando entrar um banco de verdade):
//
//   CREATE TABLE noticias (
//     id            VARCHAR PRIMARY KEY,
//     categoria     VARCHAR NOT NULL,
//     emoji         VARCHAR NOT NULL,
//     cor_classe    VARCHAR NOT NULL,   -- classe CSS já usada no front (bg-clima, bg-energia, ...)
//     texto         TEXT NOT NULL,
//     data          DATE NOT NULL,
//     link_externo  VARCHAR NULL        -- para quando existir página de artigo completo
//   );
//
// Somente leitura por enquanto — não há tela de administração no front
// para criar/editar notícias, então o repositório só expõe consultas.
// Quando essa tela existir, acrescentar aqui "criar"/"atualizar"/"remover"
// seguindo o mesmo padrão do usuariosRepositorio.
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
