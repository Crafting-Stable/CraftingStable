-- Ambas as passwords são `password` (hashed com bcrypt)
INSERT INTO users (id, email, password, name, type) VALUES
                                                        (1, 'joana@gmail.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOq6N/1S3G1pZ0XyZq1eQ5s8G9sV0K0eK', 'Joana', 'ADMIN'),
                                                        (2, 'tiago@gmail.com', '$2a$10$K1mV6n1pQe7Qe9u0b1K0Yq1u8jKc9G3Ouq9j1yYlZ8b7Qe9u0b1K0', 'Tiago', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),1) FROM users));
