-- Seed Oracle Messages for E2E Tests
INSERT INTO public.oracle_messages (text, category, element, moods, phases, depth, weight, rarity)
VALUES 
('Confie no fluxo das águas. A calma precede a clareza.', 'cura_emocional', 'Agua', ARRAY['ansioso', 'triste'], ARRAY['germinacao', 'crisalida'], 1, 1.0, 'common'),
('O fogo da transformação queima o que não serve mais.', 'consciencia', 'Fogo', ARRAY['motivado', 'cansado'], ARRAY['metamorfose'], 2, 1.2, 'rare'),
('Aterrisse seus pés na terra. A estabilidade é sua força.', 'acao_foco', 'Terra', ARRAY['disperso', 'ansioso'], ARRAY['consolidacao'], 1, 1.0, 'common'),
('O ar traz novas perspectivas. Respire e observe.', 'consciencia', 'Ar', ARRAY['focado', 'confuso'], ARRAY['voo_livre'], 1, 1.0, 'common'),
('A semente sabe o tempo de brotar. Paciência.', 'cura_emocional', 'Terra', ARRAY['impaciente', 'triste'], ARRAY['germinacao'], 1, 1.0, 'common');