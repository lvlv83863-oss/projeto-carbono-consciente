const ErroApi = require("../utilitarios/erroApi");

// Códigos que indicam problema de conexão/configuração do banco PostgreSQL
// (e não um erro de lógica da aplicação).
const CODIGOS_BANCO_INDISPONIVEL = [
  "ECONNREFUSED", // banco desligado ou porta errada
  "ECONNRESET", // conexão derrubada
  "ETIMEDOUT", // sem resposta (IP/porta bloqueados)
  "ENOTFOUND", // host da DATABASE_URL não existe
  "28P01", // senha inválida
  "28000", // autorização rejeitada
  "3D000", // banco não existe
  "42P01", // tabela não existe (rode npm run db:setup)
  "57P01", // banco foi desligado pelo administrador
  "53300", // limite de conexões do banco atingido
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