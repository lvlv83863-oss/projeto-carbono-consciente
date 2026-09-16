const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");

const usuariosRepositorio = require("../repositorios/usuariosRepositorio");
const ErroApi = require("../utilitarios/erroApi");
const env = require("../config/env");

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usuarioPublico(usuario) {
  // Nunca devolve senhaHash pra fora do backend.
  const { id, nome, email, provedor, criadoEm } = usuario;
  return { id, nome, email, provedor, criadoEm };
}

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, env.jwtSegredo, { expiresIn: env.jwtExpiracao });
}

function registrar({ nome, email, senha, confirmarSenha }) {
  if (!nome || !email || !senha || !confirmarSenha) {
    throw new ErroApi(400, "Preencha nome, email, senha e confirmação de senha.");
  }
  if (!REGEX_EMAIL.test(email)) {
    throw new ErroApi(400, "Email inválido.");
  }
  if (senha.length < 6) {
    throw new ErroApi(400, "A senha precisa ter pelo menos 6 caracteres.");
  }
  if (senha !== confirmarSenha) {
    throw new ErroApi(400, "As senhas não conferem.");
  }
  if (usuariosRepositorio.buscarPorEmail(email)) {
    throw new ErroApi(409, "Já existe uma conta com esse email.");
  }

  const usuario = {
    id: uuid(),
    nome,
    email,
    senhaHash: bcrypt.hashSync(senha, 10),
    provedor: "local",
    googleId: null,
    criadoEm: new Date().toISOString(),
  };
  usuariosRepositorio.criar(usuario);

  return { usuario: usuarioPublico(usuario), token: gerarToken(usuario) };
}

function autenticar({ email, senha }) {
  if (!email || !senha) {
    throw new ErroApi(400, "Preencha email e senha.");
  }

  const usuario = usuariosRepositorio.buscarPorEmail(email);
  const senhaConfere = usuario && bcrypt.compareSync(senha, usuario.senhaHash);
  if (!senhaConfere) {
    // Mensagem genérica de propósito — não revela se o email existe ou não.
    throw new ErroApi(401, "Email ou senha inválidos.");
  }

  return { usuario: usuarioPublico(usuario), token: gerarToken(usuario) };
}

function buscarUsuarioAutenticado(id) {
  const usuario = usuariosRepositorio.buscarPorId(id);
  if (!usuario) throw new ErroApi(404, "Usuário não encontrado.");
  return usuarioPublico(usuario);
}

module.exports = { registrar, autenticar, buscarUsuarioAutenticado, gerarToken, usuarioPublico };
