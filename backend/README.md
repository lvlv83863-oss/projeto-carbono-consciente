# Backend — Carbono Consciente

API para as funcionalidades do site que hoje dependiam de backend: login/cadastro, notícias e estatísticas.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env   # opcional — sem isso, os valores padrão de dev já funcionam
npm start
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORTA` no `.env`). O front-end estático (`front end/`) aponta para essa URL através de `front end/js/config.js`.

## Persistência atual: arquivos JSON (não é um banco de dados)

Por decisão explícita deste momento do projeto, **não há banco de dados** — os "dados" moram em arquivos JSON dentro de `src/dados/` (`usuarios.json`, `noticias.json`, `estatisticas.json`, `meiosTransporte.json`, `habitos.json`), lidos e escritos por `src/repositorios/armazenamentoJson.js`.

Já existe um **schema MySQL pronto** em `backend/sql/schema.sql`, cobrindo `usuarios`, `meios_transporte` e `habitos` — mas ele **não foi aplicado em nenhum banco ainda**, por decisão do usuário (isso fica para o momento do deploy). Até lá, essas três entidades continuam rodando nos arquivos JSON descritos acima, seguindo exatamente o mesmo desenho de tabela do `schema.sql`.

Isso foi estruturado de propósito para que plugar um banco de verdade no futuro seja uma troca localizada, e não uma reescrita do backend:

```
rotas/  →  controladores/  →  servicos/  →  repositorios/  →  (hoje: JSON | futuro: banco real)
```

- `rotas/`, `controladores/` e `servicos/` **não sabem** que os dados estão em JSON — só chamam funções como `usuariosRepositorio.buscarPorEmail(email)` ou `noticiasRepositorio.listar()`.
- Cada arquivo em `src/repositorios/` (`usuariosRepositorio.js`, `noticiasRepositorio.js`, `estatisticasRepositorio.js`) é comentado com o **desenho de tabela equivalente** (`CREATE TABLE ...`) e, função por função, o **SQL equivalente** (`-- SELECT * FROM usuarios WHERE email = ?`). Isso existe justamente para uma pessoa (ou uma IA) que for integrar um banco de verdade não precisar re-inferir o modelo de dados — é só seguir o comentário.

### Passo a passo para migrar para um banco real

Para `usuarios`, `meios_transporte` e `habitos`, o schema já existe pronto em `backend/sql/schema.sql` (MySQL) — é só aplicar:

1. Rodar `backend/sql/schema.sql` num servidor MySQL (`mysql < backend/sql/schema.sql`), com um usuário dedicado (não root) com permissão só no banco `carbono_consciente`.
2. Instalar um driver (`npm install mysql2`) e criar um pool de conexão (ex.: `src/config/bancoDados.js`), lendo host/usuário/senha/banco de variáveis de ambiente novas (`DB_HOST`, `DB_USUARIO`, `DB_SENHA`, `DB_NOME`).
3. Reescrever **só o corpo** das funções exportadas por `usuariosRepositorio.js`, `meiosTransporteRepositorio.js` e `habitosRepositorio.js` para usar SQL em vez de `armazenamentoJson`. As assinaturas (nome da função, parâmetros, o que retornam) devem continuar iguais — é isso que mantém `servicos/`, `controladores/` e `rotas/` intocados. O comentário no topo de cada repositório já mostra o SQL equivalente de cada função.
4. Ajustar `autenticacaoServico.js`: o `id` do usuário passa a ser o `id_usuario` inteiro (`AUTO_INCREMENT`) do banco em vez do `uuid()` gerado hoje — o token JWT e o resto do backend não precisam de mais nenhuma mudança além dessa.
5. Migrar o conteúdo atual de `src/dados/usuarios.json`, `meiosTransporte.json` e `habitos.json` para as tabelas novas (os arquivos já estão praticamente no formato esperado — só o `id` de usuário muda de uuid para inteiro).
6. `noticias` e `estatisticas` não têm schema SQL neste momento — se um dia precisarem de banco, seguem o mesmo processo, criando a tabela e reescrevendo só o repositório correspondente.
7. Depois que tudo estiver validado, `src/repositorios/armazenamentoJson.js` e os arquivos JSON migrados podem ser removidos.

## Modelo de dados

### `usuarios`
| campo | tipo | observação |
|---|---|---|
| id | uuid | chave primária |
| nome | string | |
| email | string | único |
| senhaHash | string | bcrypt, nunca devolvido pela API |
| provedor | `"local"` \| `"google"` | hoje só "local" é usado de verdade |
| googleId | string \| null | reservado para o login com Google |
| criadoEm | timestamp ISO | |

### `noticias`
| campo | tipo | observação |
|---|---|---|
| id | string | |
| categoria | string | |
| emoji | string | |
| corClasse | string | classe CSS já existente no front (`bg-clima`, `bg-energia`, `bg-reciclagem-n`, `bg-sustentabilidade`) |
| texto | string | |
| data | data ISO | |
| linkExterno | string \| null | reservado para uma futura página de artigo completo |

Somente leitura por enquanto — não existe tela de administração no front para criar/editar notícias.

### `estatisticas`
| campo | tipo | observação |
|---|---|---|
| chave | string | identificador do indicador |
| valor | string | já formatado para exibição (ex.: `"2,4 t"`, `"−12%"`) |
| descricao | string | |

Somente leitura, semeado hoje com os mesmos 4 números que já estavam fixos no HTML.

### `meios_transporte`
| campo | tipo | observação |
|---|---|---|
| id | número | equivalente a `id_meio` no `schema.sql` |
| nome | string | ex.: "Carro (gasolina)" |
| fatorEmissao | número | kg de CO₂ por km percorrido |
| icone | string | emoji usado no formulário/lista do painel |

Somente leitura, semeado com os mesmos 8 meios do `INSERT` em `backend/sql/schema.sql`.

### `habitos`
| campo | tipo | observação |
|---|---|---|
| id | número | equivalente a `id_habito` |
| idUsuario | string (uuid) | dono do registro — vira `id_usuario` inteiro quando migrar pro MySQL |
| idMeio | número | referência a `meios_transporte.id` |
| data | data ISO (`AAAA-MM-DD`) | data do deslocamento |
| distanciaKm | número | |
| co2 | número | calculado no serviço como `distanciaKm * fatorEmissao` — mesma regra do trigger `trg_habitos_calcula_co2` do `schema.sql` |
| observacao | string \| null | |
| criadoEm | timestamp ISO | |

Criado e removido pelo próprio usuário logado, pela tela `front end/html/painel.html`.

## Rotas

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/api/auth/registrar` | não | cria conta (nome, email, senha, confirmar) |
| POST | `/api/auth/login` | não | autentica (email, senha), devolve `{ usuario, token }` |
| GET | `/api/auth/me` | sim (`Authorization: Bearer <token>`) | dados do usuário logado |
| POST | `/api/auth/google` | não | **não implementado** — responde 501. Exige credenciais OAuth (Client ID/Secret) que só o dono do projeto pode criar no Google Cloud Console. Ver comentário em `src/controladores/autenticacaoControlador.js`. |
| GET | `/api/noticias` | não | lista de notícias |
| GET | `/api/noticias/:id` | não | uma notícia — reservado para uma futura página de artigo completo |
| GET | `/api/estatisticas` | não | lista de estatísticas |
| GET | `/api/meios-transporte` | não | lista os meios de transporte e seus fatores de emissão |
| GET | `/api/habitos` | sim | lista os registros de deslocamento do usuário logado |
| POST | `/api/habitos` | sim | cria um registro (`idMeio`, `data`, `distanciaKm`, `observacao` opcional) |
| DELETE | `/api/habitos/:id` | sim | remove um registro — só se for do próprio usuário |
| GET | `/api/habitos/resumo` | sim | totais de CO₂: hoje, ontem, semana atual/anterior, mês atual/anterior |

Erros sempre voltam como `{ "erro": "mensagem" }` com o status HTTP correspondente (400 dado inválido, 401 não autenticado, 404 não encontrado, 409 conflito, 501 não implementado, 500 erro inesperado).

## CORS

Liberado para qualquer origem (`cors()` sem restrição) — adequado para desenvolvimento local. Antes de qualquer publicação real, restrinja para o domínio do front-end em `src/app.js`.
