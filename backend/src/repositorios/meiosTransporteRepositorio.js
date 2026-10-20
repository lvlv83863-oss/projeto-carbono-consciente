const { pool } = require("../config/bancoDados");

// Tabela "meios_transporte" de backend/sql/schema.sql.
// Somente leitura: os 8 meios são fixos (INSERT do schema.sql).

function paraMeio(linha) {
  if (!linha) return null;
  return {
    id: linha.id_meio,
    nome: linha.nome,
    fatorEmissao: Number(linha.fator_emissao), // DECIMAL volta como texto
    icone: linha.icone,
  };
}

async function listar() {
  const [linhas] = await pool.query("SELECT * FROM meios_transporte ORDER BY id_meio");
  return linhas.map(paraMeio);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query("SELECT * FROM meios_transporte WHERE id_meio = ? LIMIT 1", [Number(id)]);
  return paraMeio(linhas[0]);
}

module.exports = { listar, buscarPorId };
