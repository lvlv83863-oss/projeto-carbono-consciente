const { ler } = require("./armazenamentoJson");

const ARQUIVO = "meiosTransporte.json";

// ---------------------------------------------------------------------
// Equivalente à tabela "meios_transporte" de backend/sql/schema.sql
// (ainda não aplicado em banco nenhum — ver README). Campos aqui usam
// nomes em camelCase (id, nome, fatorEmissao, icone) que mapeiam 1:1
// para id_meio/nome/fator_emissao/icone quando a migração acontecer.
//
// Somente leitura: não há tela para cadastrar novos meios de
// transporte, são fixos (mesmos 8 do INSERT do schema.sql).
// ---------------------------------------------------------------------

// SELECT * FROM meios_transporte ORDER BY id_meio
function listar() {
  return ler(ARQUIVO);
}

// SELECT * FROM meios_transporte WHERE id_meio = ? LIMIT 1
function buscarPorId(id) {
  return listar().find((m) => m.id === Number(id)) || null;
}

module.exports = { listar, buscarPorId };
