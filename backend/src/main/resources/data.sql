INSERT INTO users (id, email, password, name, type) VALUES
                                                        (1, 'joana@gmail.com', 'password', 'Joana', 'ADMIN'),
                                                        (2, 'tiago@gmail.com', 'password', 'Tiago', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id),0) FROM users));
