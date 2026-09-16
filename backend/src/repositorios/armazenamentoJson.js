const fs = require("fs");
const path = require("path");

// Camada mais baixa de persistência: lê e escreve os arquivos em src/dados/.
// É a ÚNICA parte do backend que sabe que os dados vivem em arquivos JSON —
// quando um banco de verdade entrar, é este arquivo (ou o repositório que o
// usa) que muda; servicos/controladores/rotas não precisam saber de nada.
//
// A escrita é "atômica" (grava num arquivo temporário e troca o nome) para
// não deixar o JSON corrompido caso o processo morra no meio da escrita —
// mesma preocupação que um banco real resolveria com uma transação.

function caminhoDados(nomeArquivo) {
  return path.join(__dirname, "..", "dados", nomeArquivo);
}

function ler(nomeArquivo) {
  const caminho = caminhoDados(nomeArquivo);
  if (!fs.existsSync(caminho)) return [];
  const conteudo = fs.readFileSync(caminho, "utf-8").trim();
  return conteudo ? JSON.parse(conteudo) : [];
}

function salvar(nomeArquivo, dados) {
  const caminho = caminhoDados(nomeArquivo);
  const caminhoTemporario = `${caminho}.tmp`;
  fs.writeFileSync(caminhoTemporario, JSON.stringify(dados, null, 2), "utf-8");
  fs.renameSync(caminhoTemporario, caminho);
}

module.exports = { ler, salvar };
