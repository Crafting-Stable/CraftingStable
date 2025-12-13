-- Password for both users is: password
-- BCrypt hash with strength 10 for "password"
INSERT INTO users (id, email, password, name, type, active, paypal_email)
SELECT 1, 'joana@gmail.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Joana', 'ADMIN', TRUE, 'joana@paypal.com'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO users (id, email, password, name, type, active, paypal_email)
SELECT 2, 'tiago@gmail.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Tiago', 'CUSTOMER', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);

-- Sample tools for E2E testing
INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 1, 'Martelo Profissional', 'Obras', 5.00, 25.00, 'Martelo de alta qualidade para trabalhos pesados', 'Aveiro', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 1);

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 2, 'Berbequim Elétrico', 'Obras', 15.00, 50.00, 'Berbequim potente com várias brocas', 'Porto', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 2);

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 3, 'Serra Circular', 'Carpintaria', 25.00, 100.00, 'Serra circular para cortes precisos em madeira', 'Lisboa', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 3);

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 4, 'Cortador de Relva', 'Jardinagem', 20.00, 75.00, 'Cortador de relva elétrico para jardins médios', 'Aveiro', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 4);

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 5, 'Aparafusadora', 'Elétricas', 8.00, 30.00, 'Aparafusadora sem fios com bateria incluída', 'Coimbra', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 5);

INSERT INTO tools (id, name, type, daily_price, deposit_amount, description, location, available, status, owner_id)
SELECT 6, 'Escada Telescópica', 'Obras', 12.00, 60.00, 'Escada telescópica de alumínio até 4 metros', 'Porto', TRUE, 'AVAILABLE', 1
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE id = 6);
