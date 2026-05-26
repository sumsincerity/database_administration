-- PostgreSQL: персонал и внутреннее устройство магазинов (филиалы, отделы, зоны)

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    address VARCHAR(512) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    opened_at DATE
);

CREATE UNIQUE INDEX IF NOT EXISTS branches_name_key ON branches(name);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    UNIQUE (branch_id, name)
);

CREATE TABLE IF NOT EXISTS store_zones (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    floor_number INTEGER NOT NULL DEFAULT 1,
    zone_type VARCHAR(64) NOT NULL CHECK (zone_type IN ('sales', 'warehouse', 'service', 'office')),
    area_sqm NUMERIC(10, 2),
    UNIQUE (branch_id, name)
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT '',
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_email_key ON employees(email);

-- Пользователь для потоковой репликации PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'replicator') THEN
        CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator';
    END IF;
END
$$;

INSERT INTO branches (name, city, address, phone, opened_at)
VALUES
    ('Central Branch', 'Moscow', 'Tverskaya 1', '+7-495-100-00-01', '2018-03-15'),
    ('North Branch', 'Saint Petersburg', 'Nevsky 10', '+7-812-200-00-02', '2020-09-01')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (branch_id, name, description)
VALUES
    ((SELECT id FROM branches WHERE name = 'Central Branch'), 'Sales', 'Отдел продаж'),
    ((SELECT id FROM branches WHERE name = 'Central Branch'), 'Warehouse', 'Склад и логистика'),
    ((SELECT id FROM branches WHERE name = 'North Branch'), 'Service', 'Сервисный центр')
ON CONFLICT (branch_id, name) DO NOTHING;

INSERT INTO store_zones (branch_id, name, floor_number, zone_type, area_sqm)
VALUES
    ((SELECT id FROM branches WHERE name = 'Central Branch'), 'Showroom', 1, 'sales', 320.5),
    ((SELECT id FROM branches WHERE name = 'Central Branch'), 'Stock A', 0, 'warehouse', 180.0),
    ((SELECT id FROM branches WHERE name = 'North Branch'), 'Repairs', 2, 'service', 95.0)
ON CONFLICT (branch_id, name) DO NOTHING;

INSERT INTO employees (first_name, last_name, position, email, phone, branch_id, department_id, hired_at)
VALUES
    (
        'Ivan', 'Manager', 'manager', 'manager@example.com', '+7-900-111-11-11',
        (SELECT id FROM branches WHERE name = 'Central Branch'),
        (SELECT id FROM departments WHERE name = 'Sales' AND branch_id = (SELECT id FROM branches WHERE name = 'Central Branch')),
        '2019-01-10'
    ),
    (
        'Elena', 'Analyst', 'analyst', 'analyst@example.com', '+7-900-222-22-22',
        (SELECT id FROM branches WHERE name = 'North Branch'),
        (SELECT id FROM departments WHERE name = 'Service' AND branch_id = (SELECT id FROM branches WHERE name = 'North Branch')),
        '2021-06-01'
    )
ON CONFLICT (email) DO NOTHING;
