const { ler } = require("./armazenamentoJson");

const ARQUIVO = "estatisticas.json";
const ARQUIVO_PAISES = "emissoesPaises.json";

// ---------------------------------------------------------------------
// DESENHO DE TABELA (para quando entrar um banco de verdade):
//
//   CREATE TABLE estatisticas (
//     chave       VARCHAR PRIMARY KEY,   -- ex.: 'co2_evitado'
//     valor       VARCHAR NOT NULL,      -- fica como texto (já formatado: "2,4 t", "−12%")
//     descricao   VARCHAR NOT NULL,
//     atualizado_em TIMESTAMP NULL       -- útil quando os números passarem a ser calculados de verdade
//   );
//
// Hoje os valores são semeados manualmente (mesmos números que já estavam
// fixos no HTML). Quando existir uma fonte real desses KPIs (ex.: agregação
// vinda de outra tabela), este repositório passa a fazer esse cálculo em
// vez de só ler o arquivo — o resto do backend não muda.
// ---------------------------------------------------------------------

// SELECT * FROM estatisticas — usado só como último fallback, se o cálculo
// dinâmico (estatisticasServico) falhar por algum motivo.
function listar() {
  return ler(ARQUIVO);
}

// Mesmos dados de país/CO₂ usados pelo globo (front end/data/emissoes.json),
// copiados aqui para o backend poder calcular médias/ranking. Objeto
// chaveado por ISO_A3 — ex.: { "BRA": { nome, tonYear, kgWeek, ... }, ... }.
function listarPaises() {
  return ler(ARQUIVO_PAISES);
}

module.exports = { listar, listarPaises };
