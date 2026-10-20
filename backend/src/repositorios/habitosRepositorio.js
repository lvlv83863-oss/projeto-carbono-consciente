const { pool } = require("../config/bancoDados");

// Tabela "habitos" de backend/sql/schema.sql.

function paraHabito(linha) {
  if (!linha) return null;
  return {
    id: linha.id_habito,
    idUsuario: linha.id_usuario,
    idMeio: linha.id_meio,
    data: linha.data_registro, // "AAAA-MM-DD" (dateStrings)
    distanciaKm: Number(linha.distancia_km),
    co2: Number(linha.co2_emitido_kg),
    observacao: linha.observacao,
    criadoEm: linha.criado_em,
  };
}

async function listarPorUsuario(idUsuario) {
  const [linhas] = await pool.query(
    "SELECT * FROM habitos WHERE id_usuario = ? ORDER BY data_registro DESC, id_habito DESC",
    [idUsuario]
  );
  return linhas.map(paraHabito);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query("SELECT * FROM habitos WHERE id_habito = ? LIMIT 1", [Number(id)]);
  return paraHabito(linhas[0]);
}

async function criar({ idUsuario, idMeio, data, distanciaKm, co2, observacao }) {
  const [resultado] = await pool.query(
    `INSERT INTO habitos (id_usuario, id_meio, data_registro, distancia_km, co2_emitido_kg, observacao)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idUsuario, idMeio, data, distanciaKm, co2, observacao]
  );
  return buscarPorId(resultado.insertId);
}

// Só remove se o registro for do próprio usuário. Devolve true/false.
async function remover(id, idUsuario) {
  const [resultado] = await pool.query(
    "DELETE FROM habitos WHERE id_habito = ? AND id_usuario = ?",
    [Number(id), idUsuario]
  );
  return resultado.affectedRows > 0;
}

module.exports = { listarPorUsuario, buscarPorId, criar, remover };
