-- ==============================================================================
-- SCHEMA SUPABASE: PAINEL ENSINO FUNDAMENTAL SESI
-- ==============================================================================
-- Como aplicar:
-- 1. Acesse o Dashboard do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral, clique em "SQL Editor"
-- 3. Clique em "New Query", cole este script completo e clique em "Run" (Executar)
-- ==============================================================================

-- 1. TABELA DE CARDÁPIO SEMANAL
CREATE TABLE IF NOT EXISTS public.cardapio (
    id BIGSERIAL PRIMARY KEY,
    dia_semana VARCHAR(20) UNIQUE NOT NULL, -- 'segunda', 'terca', 'quarta', 'quinta', 'sexta'
    cafe_manha_prato TEXT,
    cafe_manha_suco TEXT,
    cafe_manha_fruta TEXT,
    almoco_prato TEXT,
    almoco_salada TEXT,
    almoco_sobremesa TEXT,
    cafe_tarde_prato TEXT,
    cafe_tarde_bebida TEXT,
    cafe_tarde_fruta TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABELA DE AVISOS E RECADOS DO PAINEL
CREATE TABLE IF NOT EXISTS public.avisos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Pedagógico',
    cor VARCHAR(20) DEFAULT '#20B2AA',
    duracao INTEGER DEFAULT 8,
    icone VARCHAR(50) DEFAULT 'sparkles',
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 3. SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Permite leitura e atualização anônima controlada pelo painel e telas de Smart TV
-- ==============================================================================
ALTER TABLE public.cardapio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Políticas para Cardápio (Leitura e Escrita pelo Painel Kiosk)
DROP POLICY IF EXISTS "Permitir leitura pública do cardapio" ON public.cardapio;
CREATE POLICY "Permitir leitura pública do cardapio"
ON public.cardapio FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir modificação do cardapio" ON public.cardapio;
CREATE POLICY "Permitir modificação do cardapio"
ON public.cardapio FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Políticas para Avisos (Leitura e Escrita pelo Painel Kiosk)
DROP POLICY IF EXISTS "Permitir leitura pública de avisos" ON public.avisos;
CREATE POLICY "Permitir leitura pública de avisos"
ON public.avisos FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir modificação de avisos" ON public.avisos;
CREATE POLICY "Permitir modificação de avisos"
ON public.avisos FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 4. ATIVAR REALTIME DO SUPABASE
-- Permite que atualizações no Supabase reflitam instantaneamente nas telas
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cardapio'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cardapio;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'avisos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.avisos;
    END IF;
END $$;

-- ==============================================================================
-- 5. CARGA INICIAL (SEED) COM O PADRÃO OFFLINE SESI
-- ==============================================================================
INSERT INTO public.cardapio (dia_semana, cafe_manha_prato, cafe_manha_suco, cafe_manha_fruta, almoco_prato, almoco_salada, almoco_sobremesa, cafe_tarde_prato, cafe_tarde_bebida, cafe_tarde_fruta)
VALUES
('segunda', 'Leite com Cacaueira & Pão Integral com Requeijão', 'Suco de Laranja Natural', 'Banana Prata', 'Arroz Soltinho, Feijão Carioca, Iscas de Frango Grelhado & Purê de Batata', 'Salada de Alface Crocante com Cenoura Ralada', 'Maçã Fuji', 'Bolo Caseiro de Cenoura com Cobertura & Leite', 'Leite com Chocolate', 'Melancia em Cubos'),
('terca', 'Vitamina de Morango & Torrada com Geleia', 'Suco de Uva Integral', 'Mamão', 'Arroz Integral, Feijão Preto, Carne Moída com Vagem & Farofa de Milho', 'Tomate fatiado com Pepino', 'Gelatina de Morango', 'Pão de Queijo Assado & Suco Natural', 'Suco Natural', 'Uva sem semente'),
('quarta', 'Achocolatado Quente & Broinha de Milho', 'Suco de Goiaba', 'Pera', 'Macarrão Penne ao Molho Bolonhesa ou Molho Branco & Iscas de Carne', 'Beterraba Cozida com Cheiro Verde', 'Salada de Frutas', 'Sanduíche Natural de Frango com Requeijão', 'Suco de Frutas', 'Banana'),
('quinta', 'Leite com Cereais & Pão Francês com Manteiga', 'Suco de Maracujá', 'Melão', 'Arroz com Cheiro Verde, Feijão Carioca, Strogonoff de Frango & Batata Palha Assada', 'Salada de Repolho Roxo e Brócolis', 'Banana Assada com Canela', 'Bisnaguinha Integral com Queijo & Suco', 'Suco de Caju', 'Maçã Verde'),
('sexta', 'Iogurte Natural com Granola & Pão de Batata', 'Suco de Abacaxi com Hortelã', 'Tangerina', 'Feijoada Leve SESI (com Lombo e Paio), Arroz Branco, Couve Refogada & Laranja', 'Vinaigrette Suave', 'Docinho de Leite em Pó', 'Pipoca Salgada Assada & Suco de Manga', 'Suco de Manga', 'Melancia')
ON CONFLICT (dia_semana) DO NOTHING;

INSERT INTO public.avisos (id, titulo, mensagem, categoria, cor, duracao, icone, ativo, ordem)
VALUES
('av-1', 'Bem-vindos ao SESI Fundamental!', 'Um dia repleto de aprendizado, descobertas e alegria para todos os nossos alunos!', 'Informativo', '#20B2AA', 8, 'sparkles', true, 1),
('av-2', 'Hora da Higiene e Lavagem das Mãos', 'Lembre-se de lavar bem as mãos com água e sabão antes do lanche e do almoço!', 'Higiene & Saúde', '#4CAF50', 7, 'heart-pulse', true, 2),
('av-3', 'Recado da Inspetoria', 'No pátio, brinque com segurança e ajude os colegas de turmas menores.', 'Convivência', '#FF9800', 8, 'shield-check', true, 3),
('av-4', 'Devolução de Livros na Biblioteca', 'Atenção 3º, 4º e 5º ano: Quinta-feira é dia de renovação de livros literários.', 'Pedagógico', '#8A2BE2', 8, 'book-open', true, 4)
ON CONFLICT (id) DO NOTHING;
