-- =====================================================================
-- Banco de Dados: Carbono Consciente
-- Descrição: Estrutura para cadastro de usuários e registro de hábitos
--            de deslocamento com cálculo de pegada de carbono (CO2)
--
-- ATENÇÃO: este arquivo ainda NÃO foi aplicado em nenhum banco — está
-- pronto para o momento do deploy. Até lá, o backend roda com os
-- equivalentes destas tabelas em arquivos JSON (veja backend/src/dados/
-- e backend/README.md, seção "Hábitos e meios de transporte" /
-- "Migração futura para banco de dados").
--
-- Adaptado a partir do arquivo original "base_banco.txt" — a tabela
-- "usuarios" foi simplificada: os campos cpf, telefone e idade foram
-- removidos (não são usados pelo site) e "endereco" virou "pais"
-- (só o país do usuário, não um endereço completo), já que o cadastro
-- hoje só pede nome/email/senha e esse dado fica opcional, preenchível
-- depois numa tela de perfil.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS carbono_consciente
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carbono_consciente;

-- ---------------------------------------------------------------------
-- Tabela: usuarios
-- Armazena os dados cadastrais da pessoa
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    senha_hash      VARCHAR(255) NOT NULL,
    pais            VARCHAR(80)  DEFAULT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: meios_transporte
-- Lista de meios de transporte e o fator de emissão de CO2 (kg/km)
-- Facilita manter os fatores de emissão organizados e editáveis
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meios_transporte (
    id_meio         INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(80) NOT NULL UNIQUE,
    fator_emissao   DECIMAL(6,4) NOT NULL COMMENT 'kg de CO2 por km percorrido',
    icone           VARCHAR(10) DEFAULT NULL
) ENGINE=InnoDB;

-- Dados iniciais (exemplos de fatores de emissão médios)
INSERT INTO meios_transporte (nome, fator_emissao, icone) VALUES
    ('Carro (gasolina)', 0.1920, '🚗'),
    ('Carro (etanol)',   0.1500, '🚗'),
    ('Carro (elétrico)', 0.0500, '🚗'),
    ('Motocicleta',      0.1030, '🏍️'),
    ('Ônibus',           0.0890, '🚌'),
    ('Metrô/Trem',       0.0410, '🚆'),
    ('Bicicleta',        0.0000, '🚲'),
    ('A pé',             0.0000, '🚶');

-- ---------------------------------------------------------------------
-- Tabela: habitos
-- Cada linha é um registro de deslocamento feito pelo usuário
-- (o que ele adiciona na tela "Painel" / "Adicionar deslocamento")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habitos (
    id_habito       INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    id_meio         INT NOT NULL,
    data_registro   DATE NOT NULL,
    distancia_km    DECIMAL(8,2) NOT NULL,
    co2_emitido_kg  DECIMAL(10,3) NOT NULL COMMENT 'distancia_km * fator_emissao',
    observacao      VARCHAR(255) DEFAULT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_habitos_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_habitos_meio
        FOREIGN KEY (id_meio) REFERENCES meios_transporte(id_meio)
        ON DELETE RESTRICT,

    CONSTRAINT chk_distancia_positiva CHECK (distancia_km >= 0)
) ENGINE=InnoDB;

-- Índices para acelerar as consultas usadas nos cards
-- (hoje vs ontem, semana vs anterior, mês vs anterior)
CREATE INDEX idx_habitos_usuario_data ON habitos (id_usuario, data_registro);

-- ---------------------------------------------------------------------
-- Trigger: calcula automaticamente o CO2 emitido ao inserir um hábito
-- (caso o valor não seja enviado pela aplicação)
--
-- Hoje (sem banco rodando) essa mesma regra é feita em
-- backend/src/servicos/habitosServico.js — quando este trigger entrar
-- em produção, esse cálculo no serviço pode continuar como está (o
-- resultado é o mesmo) ou ser simplificado para confiar só no banco.
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_habitos_calcula_co2
BEFORE INSERT ON habitos
FOR EACH ROW
BEGIN
    IF NEW.co2_emitido_kg IS NULL OR NEW.co2_emitido_kg = 0 THEN
        SET NEW.co2_emitido_kg = NEW.distancia_km *
            (SELECT fator_emissao FROM meios_transporte WHERE id_meio = NEW.id_meio);
    END IF;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- View: resumo diário de emissões por usuário
-- Útil para alimentar os cards "Diário / Semanal / Mensal" do painel
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_emissoes_diarias AS
SELECT
    h.id_usuario,
    h.data_registro,
    SUM(h.co2_emitido_kg) AS total_co2_dia
FROM habitos h
GROUP BY h.id_usuario, h.data_registro;

-- ---------------------------------------------------------------------
-- Exemplo de inserção de um usuário e um registro de hábito
-- ---------------------------------------------------------------------
-- INSERT INTO usuarios (nome, email, senha_hash, pais)
-- VALUES ('Adriele', 'adriele@exemplo.com', '<hash_da_senha>', 'Brasil');
--
-- INSERT INTO habitos (id_usuario, id_meio, data_registro, distancia_km, co2_emitido_kg)
-- VALUES (1, 1, '2026-09-16', 12.5, NULL); -- co2 calculado pelo trigger
