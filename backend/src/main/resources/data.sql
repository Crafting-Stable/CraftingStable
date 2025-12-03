INSERT INTO users (id, email, password, name, type) VALUES
                                                        (1, 'joana@gmail.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOq6N/1S3G1pZ0XyZq1eQ5s8G9sV0K0eK', 'Joana', 'ADMIN'),
                                                        (2, 'tiago@gmail.com', '$2a$10$K1mV6n1pQe7Qe9u0b1K0Yq1u8jKc9G3Ouq9j1yYlZ8b7Qe9u0b1K0', 'Tiago', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),1) FROM users));

SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),1) FROM users));

-- ============================================
-- SEED DATA - TOOLS (100 ferramentas)
-- ============================================

-- JARDINAGEM (15 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (1, 'Cortador de Relva Elétrico', 'Jardinagem', 18.00, 50.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (2, 'Cortador de Relva a Gasolina', 'Jardinagem', 25.00, 80.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (3, 'Aparador de Sebes', 'Jardinagem', 12.00, 30.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (4, 'Motosserra Elétrica', 'Jardinagem', 15.00, 40.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (5, 'Roçadora a Gasolina', 'Jardinagem', 20.00, 60.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (6, 'Soprador de Folhas', 'Jardinagem', 10.00, 25.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (7, 'Escarificador de Relva', 'Jardinagem', 22.00, 70.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (8, 'Pulverizador de Pressão', 'Jardinagem', 8.00, 15.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (9, 'Tesoura de Poda Elétrica', 'Jardinagem', 14.00, 35.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (10, 'Cultivador Elétrico', 'Jardinagem', 16.00, 45.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (11, 'Motocultor a Gasolina', 'Jardinagem', 35.00, 120.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (12, 'Atomizador Motorizado', 'Jardinagem', 18.00, 50.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (13, 'Triturador de Vegetais', 'Jardinagem', 20.00, 65.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (14, 'Lavadora de Alta Pressão', 'Jardinagem', 15.00, 40.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (15, 'Arejador de Relva', 'Jardinagem', 12.00, 30.00, NULL, '', true, NULL, 3, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- CARPINTARIA (20 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (16, 'Serra Circular', 'Carpintaria', 15.00, 40.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (17, 'Serra de Esquadria', 'Carpintaria', 22.00, 70.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (18, 'Plaina Elétrica', 'Carpintaria', 18.00, 50.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (19, 'Tupia/Router', 'Carpintaria', 16.00, 45.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (20, 'Lixadora Orbital', 'Carpintaria', 12.00, 30.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (21, 'Lixadora de Banda', 'Carpintaria', 14.00, 35.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (22, 'Serra Vertical', 'Carpintaria', 20.00, 60.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (23, 'Fresadora', 'Carpintaria', 25.00, 80.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (24, 'Esquadrejadora', 'Carpintaria', 30.00, 100.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (25, 'Desengrossadeira', 'Carpintaria', 28.00, 90.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (26, 'Berbequim de Coluna', 'Carpintaria', 18.00, 50.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (27, 'Formão Elétrico', 'Carpintaria', 10.00, 25.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (28, 'Serra de Fita', 'Carpintaria', 24.00, 75.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (29, 'Grampeador Pneumático', 'Carpintaria', 12.00, 30.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (30, 'Pregador Pneumático', 'Carpintaria', 12.00, 30.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (31, 'Lixadora Excêntrica', 'Carpintaria', 13.00, 32.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (32, 'Tupias Manual', 'Carpintaria', 11.00, 28.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (33, 'Serra Tico-Tico', 'Carpintaria', 10.00, 25.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (34, 'Compressor de Ar', 'Carpintaria', 20.00, 60.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (35, 'Aspirador Industrial', 'Carpintaria', 15.00, 40.00, NULL, '', true, NULL, 2, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- ELÉTRICAS (15 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (36, 'Berbequim Elétrico', 'Elétricas', 10.00, 25.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (37, 'Berbequim Bateria', 'Elétricas', 12.00, 30.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (38, 'Berbequim Percussão', 'Elétricas', 14.00, 35.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (39, 'Aparafusadora Impacto', 'Elétricas', 13.00, 32.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (40, 'Esmeriladora Angular 115mm', 'Elétricas', 11.00, 28.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (41, 'Esmeriladora Angular 230mm', 'Elétricas', 15.00, 40.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (42, 'Rebarbadora', 'Elétricas', 10.00, 25.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (43, 'Multitool Oscilante', 'Elétricas', 12.00, 30.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (44, 'Pistola de Ar Quente', 'Elétricas', 8.00, 20.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (45, 'Pistola de Cola Quente', 'Elétricas', 5.00, 10.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (46, 'Soldador Elétrico', 'Elétricas', 9.00, 22.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (47, 'Multímetro Digital', 'Elétricas', 6.00, 15.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (48, 'Alicate Amperímetro', 'Elétricas', 7.00, 18.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (49, 'Detector de Cabos', 'Elétricas', 8.00, 20.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (50, 'Gerador Elétrico 2kW', 'Elétricas', 40.00, 150.00, NULL, '', true, NULL, 1, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- OBRAS/CONSTRUÇÃO (20 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (51, 'Martelo Demolidor', 'Obras', 30.00, 100.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (52, 'Martelo Perfurador', 'Obras', 25.00, 80.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (53, 'Berbequim SDS-Plus', 'Obras', 18.00, 50.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (54, 'Misturador de Argamassa', 'Obras', 15.00, 40.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (55, 'Betoneira 180L', 'Obras', 25.00, 80.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (56, 'Cortadora de Azulejo', 'Obras', 12.00, 30.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (57, 'Cortadora de Pavimento', 'Obras', 35.00, 120.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (58, 'Vibrador de Betão', 'Obras', 20.00, 60.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (59, 'Placa Vibratória', 'Obras', 28.00, 90.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (60, 'Compactador de Solo', 'Obras', 22.00, 70.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (61, 'Andaime Móvel 4m', 'Obras', 18.00, 80.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (62, 'Escada Articulada', 'Obras', 10.00, 40.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (63, 'Nível Laser Rotatório', 'Obras', 15.00, 50.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (64, 'Nível Laser Cruz', 'Obras', 12.00, 35.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (65, 'Teodolito Digital', 'Obras', 25.00, 100.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (66, 'Pistola de Pintura Elétrica', 'Obras', 14.00, 40.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (67, 'Compressor Ar 50L', 'Obras', 20.00, 65.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (68, 'Martelete Pneumático', 'Obras', 18.00, 55.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (69, 'Serra Sabre', 'Obras', 13.00, 35.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (70, 'Talhadeira Elétrica', 'Obras', 16.00, 45.00, NULL, '', true, NULL, 1, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- PINTURA (10 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (71, 'Pistola Pintura HVLP', 'Pintura', 15.00, 40.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (72, 'Pistola Pintura Airless', 'Pintura', 25.00, 80.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (73, 'Compressor Portátil', 'Pintura', 18.00, 50.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (74, 'Lixadora Parede Elétrica', 'Pintura', 20.00, 60.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (75, 'Rolo Pintura Elétrico', 'Pintura', 12.00, 30.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (76, 'Misturador de Tinta', 'Pintura', 8.00, 20.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (77, 'Pistola Textura', 'Pintura', 14.00, 35.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (78, 'Extrator Papel Parede', 'Pintura', 10.00, 25.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (79, 'Kit Pintura Completo', 'Pintura', 16.00, 45.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (80, 'Escadas Telescópicas', 'Pintura', 11.00, 40.00, NULL, '', true, NULL, 4, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- CANALIZAÇÃO (10 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (81, 'Máquina Desbloquear Canos', 'Canalização', 28.00, 90.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (82, 'Corta-Tubos Cobre', 'Canalização', 6.00, 15.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (83, 'Corta-Tubos PVC', 'Canalização', 5.00, 12.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (84, 'Roscadora Manual', 'Canalização', 12.00, 35.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (85, 'Roscadora Elétrica', 'Canalização', 22.00, 70.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (86, 'Maçarico Propano', 'Canalização', 10.00, 25.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (87, 'Bomba Pressão Teste', 'Canalização', 15.00, 40.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (88, 'Alargador de Tubos', 'Canalização', 8.00, 20.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (89, 'Curvador de Tubos', 'Canalização', 14.00, 35.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (90, 'Detector de Fugas', 'Canalização', 18.00, 50.00, NULL, '', true, NULL, 2, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- LIMPEZA/MANUTENÇÃO (10 ferramentas)
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, image_url, owner_id, status) VALUES
                                                                                                                                   (91, 'Aspirador Água e Pó', 'Limpeza', 16.00, 45.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (92, 'Máquina Lavar Carpetes', 'Limpeza', 22.00, 70.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (93, 'Enceradeira Industrial', 'Limpeza', 18.00, 55.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (94, 'Lavadora Vapor', 'Limpeza', 20.00, 60.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (95, 'Desumidificador 20L', 'Limpeza', 15.00, 50.00, NULL, '', true, NULL, 4, 'AVAILABLE'),
                                                                                                                                   (96, 'Ventilador Industrial', 'Limpeza', 12.00, 35.00, NULL, '', true, NULL, 2, 'AVAILABLE'),
                                                                                                                                   (97, 'Gerador Ozono', 'Limpeza', 25.00, 80.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (98, 'Máquina Limpar Estofos', 'Limpeza', 19.00, 60.00, NULL, '', true, NULL, 3, 'AVAILABLE'),
                                                                                                                                   (99, 'Aspirador Industrial 80L', 'Limpeza', 24.00, 75.00, NULL, '', true, NULL, 1, 'AVAILABLE'),
                                                                                                                                   (100, 'Politriz Pavimentos', 'Limpeza', 28.00, 90.00, NULL, '', true, NULL, 2, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('tools','id'), (SELECT COALESCE(MAX(id),1) FROM tools));
