const ErroApi = require("../utilitarios/erroApi");

// Códigos do mysql2 que indicam problema de conexão/configuração do banco
// (e não um erro de lógica da aplicação).
const CODIGOS_BANCO_INDISPONIVEL = [
  "ECONNREFUSED",
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_NO_SUCH_TABLE",
];

// Middleware de erro central do Express (precisa dos 4 parâmetros para ser
// reconhecido como tal). Todo erro lançado nas rotas/controladores cai
// aqui — assim cada rota não precisa de try/catch repetido.
function tratadorErros(erro, _req, res, _next) {
  if (erro instanceof ErroApi) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(erro); // erro inesperado — logar pra investigar

  if (CODIGOS_BANCO_INDISPONIVEL.includes(erro.code)) {
    return res.status(503).json({
      erro: "Não foi possível acessar o banco de dados. Veja o terminal do servidor para o motivo.",
    });
  }

  res.status(500).json({ erro: "Erro interno no servidor." });
}

module.exports = tratadorErros;
