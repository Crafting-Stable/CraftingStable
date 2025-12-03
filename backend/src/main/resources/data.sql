INSERT INTO users (id, email, password, name, type) VALUES
                                                        (1, 'joana@gmail.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOq6N/1S3G1pZ0XyZq1eQ5s8G9sV0K0eK', 'Joana', 'ADMIN'),
                                                        (2, 'tiago@gmail.com', '$2a$10$K1mV6n1pQe7Qe9u0b1K0Yq1u8jKc9G3Ouq9j1yYlZ8b7Qe9u0b1K0', 'Tiago', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),1) FROM users));

INSERT INTO tools (
    id, name, type, daily_price, deposit_amount, description, location,
    available, image_url, owner_id, status, wikidata_id, image_fetched_at, image_source
) VALUES (
             4,
             'Cortador de Relva',
             'Jardinagem',
             18.00,
             0.00,
             NULL,
             '',
             true,
             NULL,
             NULL,
             'AVAILABLE',
             NULL,
             NULL,
             NULL
         )
ON CONFLICT (id) DO NOTHING;

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location,
                   available, image_url, owner_id, status, wikidata_id, image_fetched_at, image_source)
VALUES
    (10, 'Serra Circular', 'Carpintaria', 15.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (11, 'Serra de Esquadria', 'Carpintaria', 22.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (12, 'Plaina Elétrica', 'Carpintaria', 18.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (13, 'Tupia/Router', 'Carpintaria', 16.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (14, 'Lixadora Orbital', 'Carpintaria', 12.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5 Elétricas / Construção
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location,
                   available, image_url, owner_id, status, wikidata_id, image_fetched_at, image_source)
VALUES
    (15, 'Berbequim Elétrico', 'Elétricas', 10.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (16, 'Martelo Demolidor', 'Obras', 30.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (17, 'Misturador de Argamassa', 'Obras', 18.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (18, 'Esmeriladora Angular', 'Elétricas', 11.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL),
    (19, 'Gerador Elétrico 2kW', 'Elétricas', 40.00, 0.00, NULL, '', true, NULL, NULL, 'AVAILABLE', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('tools','id'), (SELECT COALESCE(MAX(id),1) FROM tools));
