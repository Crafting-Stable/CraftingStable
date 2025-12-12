-- Password for both users is: password
-- BCrypt hash with strength 10 for "password"
INSERT INTO users (id, email, password, name, type, active, paypal_email)
SELECT 1, 'joana@gmail.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Joana', 'ADMIN', TRUE, 'joana@paypal.com'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO users (id, email, password, name, type, active, paypal_email)
SELECT 2, 'tiago@gmail.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Tiago', 'CUSTOMER', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);
