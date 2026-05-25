-- PostgreSQL initialization script for branches and employees

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS branches_name_key ON branches(name);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    branch_id INTEGER NOT NULL REFERENCES branches(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_key ON employees(email);

INSERT INTO branches (name, city)
VALUES
    ('Central Branch', 'Moscow'),
    ('North Branch', 'Saint Petersburg')
ON CONFLICT (name) DO NOTHING;

INSERT INTO employees (first_name, last_name, position, email, branch_id)
VALUES
    ('Ivan', 'Manager', 'manager', 'manager@example.com', (SELECT id FROM branches WHERE name = 'Central Branch')),
    ('Elena', 'Analyst', 'analyst', 'analyst@example.com', (SELECT id FROM branches WHERE name = 'North Branch'))
ON CONFLICT (email) DO NOTHING;
