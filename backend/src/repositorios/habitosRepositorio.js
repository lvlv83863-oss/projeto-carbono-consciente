const { pool } = require("../config/bancoDados");

// Tabela "habitos" de backend/sql/schema.sql (PostgreSQL).

function paraHabito(linha) {
  if (!linha) return null;
  return {
    id: linha.id_habito,
    idUsuario: linha.id_usuario,
    idMeio: linha.id_meio,
    data: linha.data_registro, // "AAAA-MM-DD" (o parser de DATE em config/bancoDados.js devolve texto)
    distanciaKm: Number(linha.distancia_km),
    co2: Number(linha.co2_emitido_kg),
    observacao: linha.observacao,
    criadoEm: linha.criado_em,
  };
}

async function listarPorUsuario(idUsuario) {
  const { rows } = await pool.query(
    "SELECT * FROM habitos WHERE id_usuario = $1 ORDER BY data_registro DESC, id_habito DESC",
    [idUsuario]
  );
  return rows.map(paraHabito);
}

async function buscarPorId(id) {
  const { rows } = await pool.query("SELECT * FROM habitos WHERE id_habito = $1 LIMIT 1", [Number(id)]);
  return paraHabito(rows[0]);
}

// RETURNING * devolve a linha criada na própria inserção (não precisa de insertId).
async function criar({ idUsuario, idMeio, data, distanciaKm, co2, observacao }) {
  const { rows } = await pool.query(
    `INSERT INTO habitos (id_usuario, id_meio, data_registro, distancia_km, co2_emitido_kg, observacao)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [idUsuario, idMeio, data, distanciaKm, co2, observacao]
  );
  return paraHabito(rows[0]);
}

// Só remove se o registro for do próprio usuário. Devolve true/false.
async function remover(id, idUsuario) {
  const resultado = await pool.query(
    "DELETE FROM habitos WHERE id_habito = $1 AND id_usuario = $2",
    [Number(id), idUsuario]
  );
  return resultado.rowCount > 0;
}

module.exports = { listarPorUsuario, buscarPorId, criar, remover };