const autenticacaoServico = require("../servicos/autenticacaoServico");
const ErroApi = require("../utilitarios/erroApi");

function registrar(req, res) {
  const { nome, email, senha, confirmar } = req.body || {};
  const resultado = autenticacaoServico.registrar({ nome, email, senha, confirmarSenha: confirmar });
  res.status(201).json(resultado);
}

function login(req, res) {
  const { email, senha } = req.body || {};
  const resultado = autenticacaoServico.autenticar({ email, senha });
  res.status(200).json(resultado);
}

function me(req, res) {
  const usuario = autenticacaoServico.buscarUsuarioAutenticado(req.usuarioId);
  res.status(200).json(usuario);
}

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
