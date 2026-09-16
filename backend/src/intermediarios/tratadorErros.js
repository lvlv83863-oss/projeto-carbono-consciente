const ErroApi = require("../utilitarios/erroApi");

// Middleware de erro central do Express (precisa dos 4 parâmetros para ser
// reconhecido como tal). Todo throw síncrono nas rotas/controladores cai
// aqui — assim cada rota não precisa de try/catch repetido.
function tratadorErros(erro, _req, res, _next) {
  if (erro instanceof ErroApi) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(erro); // erro inesperado — logar pra investigar
  res.status(500).json({ erro: "Erro interno no servidor." });
}

module.exports = tratadorErros;
