const autenticacaoServico = require("../servicos/autenticacaoServico");
const ErroApi = require("../utilitarios/erroApi");
const assincrono = require("../utilitarios/assincrono");

const registrar = assincrono(async (req, res) => {
  const { nome, email, senha, confirmar } = req.body || {};
  const resultado = await autenticacaoServico.registrar({ nome, email, senha, confirmarSenha: confirmar });
  res.status(201).json(resultado);
});

const login = assincrono(async (req, res) => {
  const { email, senha } = req.body || {};
  const resultado = await autenticacaoServico.autenticar({ email, senha });
  res.status(200).json(resultado);
});

const me = assincrono(async (req, res) => {
  const usuario = await autenticacaoServico.buscarUsuarioAutenticado(req.usuarioId);
  res.status(200).json(usuario);
});

// Estruturado propositalmente, mas não implementado: login com Google exige
// credenciais OAuth (Client ID/Secret) criadas pelo dono do projeto no
// Google Cloud Console — isso é um passo manual que não pode ser feito por
// aqui. Quando essas credenciais existirem, trocar este handler por um fluxo
// real (ex.: verificar o id_token do Google e chamar autenticacaoServico
// com provedor "google").
function google(_req, res) {
  throw new ErroApi(501, "Login com Google ainda não configurado.");
}

module.exports = { registrar, login, me, google };
