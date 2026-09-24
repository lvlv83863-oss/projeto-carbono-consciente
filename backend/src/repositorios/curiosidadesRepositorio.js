const { ler } = require("./armazenamentoJson");

const ARQUIVO = "curiosidades.json";

// ---------------------------------------------------------------------
// DESENHO DE TABELA (para quando entrar um banco de verdade):
//
//   CREATE TABLE curiosidades (
//     id     INT PRIMARY KEY,
//     texto  TEXT NOT NULL
//   );
//
// Lista curada de fatos ambientais reais e verificáveis (não estatísticas
// inventadas com falsa precisão). Somente leitura — sem tela de admin.
// ---------------------------------------------------------------------

// SELECT * FROM curiosidades ORDER BY id
function listar() {
  return ler(ARQUIVO);
}

module.exports = { listar };
