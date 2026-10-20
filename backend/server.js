const app = require("./src/app");
const env = require("./src/config/env");
const { testarConexao } = require("./src/config/bancoDados");

app.listen(env.porta, async () => {
  console.log(`API Carbono Consciente rodando em http://localhost:${env.porta}`);

  try {
    await testarConexao();
    console.log(`Banco de dados conectado em ${env.banco.host}:${env.banco.porta}/${env.banco.nome}`);
  } catch (erro) {
    console.error(`ATENÇÃO: não foi possível conectar ao banco em ${env.banco.host}:${env.banco.porta}/${env.banco.nome}`);
    console.error(`Motivo: ${erro.code || ""} ${erro.message}`);
    console.error("Confira se o container do MySQL está Running, se o .env tem a senha certa e se o banco existe.");
  }
});
