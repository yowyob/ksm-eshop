-- Script de création de la base de données PostgreSQL pour KSM eShop
-- Compatible avec un backend Spring Boot

-- 1. Table des Enseignes (Tenants)
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    theme_color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des Catégories
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des Produits
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Commandes
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Détails des Commandes (Order Items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL
);

-- Index pour optimiser les recherches par tenant (multi-tenancy)
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);

-- Insertion des données initiales (Données de test)
INSERT INTO tenants (id, name, slug, description, theme_color) VALUES
('t1', 'Boulangerie Délices', 'boulangerie-delices', 'Le meilleur pain artisanal de Douala.', '#f59e0b'),
('t2', 'Tech Horizon', 'tech-horizon', 'Matériel informatique de pointe.', '#3b82f6'),
('t3', 'Pharmacie du Soleil', 'pharmacie-du-soleil', 'Santé et bien-être.', '#10b981');

INSERT INTO categories (id, name, slug) VALUES
('c1', 'Pains & Baguettes', 'pains'),
('c2', 'Viennoiseries', 'viennoiseries'),
('c3', 'Pâtisseries', 'patisseries'),
('c4', 'Ordinateurs', 'ordinateurs'),
('c5', 'Accessoires', 'accessoires');

INSERT INTO products (id, tenant_id, category_id, name, price, stock, is_featured, image_url) VALUES
('p1', 't1', 'c1', 'Baguette Tradition', 150, 150, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'),
('p2', 't1', 'c2', 'Croissant au Beurre', 500, 45, true, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80'),
('p4', 't2', 'c4', 'Laptop Pro 15', 850000, 5, true, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80');
