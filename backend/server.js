const app = require("./src/app");
const env = require("./src/config/env");
const { testarConexao } = require("./src/config/bancoDados");

app.listen(env.porta, async () => {
  console.log(`API Carbono Consciente rodando em http://localhost:${env.porta}`);

  try {
    await testarConexao();
    console.log(`Banco de dados conectado em ${env.banco.descricao}`);
  } catch (erro) {
    console.error(`ATENÇÃO: não foi possível conectar ao banco em ${env.banco.descricao}`);
    console.error(`Motivo: ${erro.code || ""} ${erro.message}`);
    console.error("Confira se DATABASE_URL (string do Session pooler do Supabase) está certa, se a senha confere e se as tabelas existem (npm run db:setup).");
  }
});