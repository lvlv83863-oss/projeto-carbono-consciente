// Erro com status HTTP embutido, para os serviços sinalizarem falhas de
// negócio (ex.: email duplicado, credenciais inválidas) sem conhecer o
// Express — quem traduz isso pra resposta HTTP é o tratadorErros.
class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = ErroApi;
