INSERT INTO users (id, email, password, name, type, active)
SELECT 1, 'joana@gmail.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOq6N/1S3G1pZ0XyZq1eQ5s8G9sV0K0eK', 'Joana', 'ADMIN', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO users (id, email, password, name, type, active)
SELECT 2, 'tiago@gmail.com', '$2a$10$K1mV6n1pQe7Qe9u0b1K0Yq1u8jKc9G3Ouq9j1yYlZ8b7Qe9u0b1K0', 'Tiago', 'CUSTOMER', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);
