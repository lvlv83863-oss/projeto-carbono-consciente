const { pool } = require("../config/bancoDados");

// Tabela "meios_transporte" de backend/sql/schema.sql (PostgreSQL).
// Somente leitura: os 8 meios são fixos (INSERT do schema.sql).

function paraMeio(linha) {
  if (!linha) return null;
  return {
    id: linha.id_meio,
    nome: linha.nome,
    fatorEmissao: Number(linha.fator_emissao), // garante número mesmo se o driver devolver texto
    icone: linha.icone,
  };
}

async function listar() {
  const { rows } = await pool.query("SELECT * FROM meios_transporte ORDER BY id_meio");
  return rows.map(paraMeio);
}

async function buscarPorId(id) {
  const { rows } = await pool.query("SELECT * FROM meios_transporte WHERE id_meio = $1 LIMIT 1", [Number(id)]);
  return paraMeio(rows[0]);
}

module.exports = { listar, buscarPorId };