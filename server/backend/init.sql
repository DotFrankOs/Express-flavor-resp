-- Base de datos para express flavor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  "user" VARCHAR(50) PRIMARY KEY,
  pass VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(50),
  avatar TEXT,
  role VARCHAR(20) DEFAULT 'customer',
  favorites JSONB DEFAULT '[]',
  orders_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS restaurants (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  logo VARCHAR(200),
  description TEXT,
  url VARCHAR(200),
  min_duration INTEGER DEFAULT 1,
  max_duration INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(50) PRIMARY KEY,
  restaurant_id VARCHAR(50) REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(200),
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_item_options (
  id SERIAL PRIMARY KEY,
  menu_item_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  option_id VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  required BOOLEAN DEFAULT false,
  multi_select BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS menu_item_option_choices (
  id SERIAL PRIMARY KEY,
  option_id INTEGER REFERENCES menu_item_options(id) ON DELETE CASCADE,
  choice_id VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  price_modifier DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_item_variants (
  id SERIAL PRIMARY KEY,
  menu_item_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS menu_item_variant_items (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES menu_item_variants(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  price DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER NOT NULL,
  restaurant_id VARCHAR(50) REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(20),
  label VARCHAR(50),
  style VARCHAR(20) DEFAULT 'standard',
  PRIMARY KEY (id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS table_layouts (
  restaurant_id VARCHAR(50) PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  columns INTEGER DEFAULT 5,
  gap VARCHAR(20) DEFAULT '10px'
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    restaurant_id VARCHAR(50) NOT NULL,
    table_number INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INTEGER,
    code VARCHAR(20),
    user_id VARCHAR(50),
    price DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users("user") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  restaurant_id VARCHAR(50),
  restaurant_name VARCHAR(100),
  total DECIMAL(10,2),
  payment_method VARCHAR(20) DEFAULT 'card',
  delivery_code VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  status_note TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users("user") ON DELETE SET NULL,
  CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  item_id VARCHAR(50),
  name VARCHAR(100),
  base_name VARCHAR(100),
  price DECIMAL(10,2),
  base_price DECIMAL(10,2),
  quantity INTEGER,
  variant JSONB,
  image VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS order_item_options (
  id SERIAL PRIMARY KEY,
  order_item_id VARCHAR(100) REFERENCES order_items(id) ON DELETE CASCADE,
  choice_id VARCHAR(50),
  choice_name VARCHAR(100),
  price_modifier DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  image VARCHAR(200),
  date TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  code VARCHAR(10) PRIMARY KEY,
  symbol VARCHAR(10),
  rate DECIMAL(15,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS item_stats (
  restaurant_id VARCHAR(50),
  item_key VARCHAR(100),
  count INTEGER DEFAULT 0,
  PRIMARY KEY (restaurant_id, item_key)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  base_name VARCHAR(100),
  price DECIMAL(10,2),
  base_price DECIMAL(10,2),
  restaurant_id VARCHAR(50),
  restaurant_name VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  variant JSONB,
  options JSONB,
  image VARCHAR(200),
  PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS user_restaurants (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users("user") ON DELETE CASCADE,
  restaurant_id VARCHAR(50) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- DATOS DE PRUEBA

-- Usuarios
INSERT INTO users ("user", pass, name, email, phone, avatar, role, favorites, orders_count) VALUES
('admin', '1234', 'Administrador', 'admin@expressflavor.com', '+505 8888-9999', 'https://ui-avatars.com/api/?name=Administrador&background=1d05b7&color=fff&size=128', 'admin', '["burgers", "italian"]', 47),
('test', 'test', 'Usuario Prueba', 'test@email.com', '+505 7777-8888', 'https://ui-avatars.com/api/?name=Usuario+Prueba&background=ff4081&color=fff&size=128', 'customer', '["mexican", "cafe"]', 12)
ON CONFLICT ("user") DO NOTHING;

-- Restaurantes
INSERT INTO restaurants (id, name, type, logo, description, url, min_duration, max_duration) VALUES
('burgers', 'Food Fast Burgers', 'burgers', 'foot fast burgers.png', 'Especializados en hamburguesas artesanales y papas crujientes.', 'menu.html?restaurant=burgers', 1, 3),
('italian', 'Italian Taste', 'italian', 'Italian Taste.png', 'Auténtica cocina italiana con pastas y pizzas artesanales.', 'menu.html?restaurant=italian', 1, 2),
('mexican', 'Viva México', 'mexican', 'Viva mexico.png', 'Tacos y burritos llenos de sabor y color.', 'menu.html?restaurant=mexican', 1, 2),
('cafe', 'Café Aroma', 'cafe', 'cafe aroma.png', 'Postres, café y un ambiente cálido para disfrutar.', 'menu.html?restaurant=cafe', 1, 2)
ON CONFLICT (id) DO NOTHING;

-- MENÚES
INSERT INTO menu_items (id, restaurant_id, name, price, image, description) VALUES
('b1', 'burgers', 'Burger Clásica', 6.99, 'fotos food fast burgers/hambuwesa.png', 'Jugosa carne de res 150g, lechuga fresca, tomate maduro, cebolla morada y salsa especial de la casa en pan brioche tostado.'),
('b2', 'burgers', 'Doble Queso & Bacon', 8.49, 'fotos food fast burgers/hamburguesa-doble-queso-bacon-1024x683.png', 'Doble carne smash, doble capa de queso cheddar derretido, crujiente bacon ahumado, pepinillos y salsa BBQ.'),
('b3', 'burgers', 'Papas Fritas Artesanales', 1.99, 'fotos food fast burgers/photodune-1669472-french-fries-xs.jpg', 'Papas frescas cortadas a mano, doble fritura para extra crocancia, sazonadas con sal de mar y hierbas finas.'),
('b4', 'burgers', 'Bebida Refrescante', 1.49, 'fotos food fast burgers/unnamed.jpg', 'Bebidas frías preparadas al momento con ingredientes naturales. Perfectas para acompañar tu combo.'),
('b5', 'burgers', 'Combo Burger Supremo', 14.99, 'fotos food fast burgers/amburgesa clasica.webp', 'Nuestra Burger Clásica + Papas Grandes + Bebida a elección. La combinación perfecta para saciar el hambre.')
ON CONFLICT (id) DO NOTHING;

-- Opciones b3 (Papas)
INSERT INTO menu_item_options (menu_item_id, option_id, name, required, multi_select) VALUES
('b3', 'size', 'Tamaño', true, false)
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_option_choices (option_id, choice_id, name, price_modifier)
SELECT id, 'small', 'Pequeña', 0 FROM menu_item_options WHERE menu_item_id = 'b3' AND option_id = 'size'
UNION ALL
SELECT id, 'large', 'Grande', 1.50 FROM menu_item_options WHERE menu_item_id = 'b3' AND option_id = 'size'
ON CONFLICT DO NOTHING;

-- Variantes b4 (Bebida)
INSERT INTO menu_item_variants (menu_item_id, required) VALUES ('b4', true)
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_variant_items (variant_id, item_id, name, price)
SELECT id, 'b4-lim', 'Limonada Natural', 2.49 FROM menu_item_variants WHERE menu_item_id = 'b4'
UNION ALL
SELECT id, 'b4-gas', 'Gaseosa 500ml', 2.99 FROM menu_item_variants WHERE menu_item_id = 'b4'
UNION ALL
SELECT id, 'b4-jug', 'Jugo Natural del Día', 3.49 FROM menu_item_variants WHERE menu_item_id = 'b4'
UNION ALL
SELECT id, 'b4-agua', 'Agua Embotellada', 1.99 FROM menu_item_variants WHERE menu_item_id = 'b4'
ON CONFLICT DO NOTHING;

-- Opciones b5 (Combo)
INSERT INTO menu_item_options (menu_item_id, option_id, name, required, multi_select) VALUES
('b5', 'bebida', 'Bebida del Combo', true, false),
('b5', 'extras', 'Extras Premium', false, true)
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_option_choices (option_id, choice_id, name, price_modifier)
SELECT id, 'limonada', 'Limonada Natural', 0 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'bebida'
UNION ALL
SELECT id, 'gaseosa', 'Gaseosa 500ml', 0.50 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'bebida'
UNION ALL
SELECT id, 'jugo', 'Jugo Natural', 1.00 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'bebida'
UNION ALL
SELECT id, 'bacon', 'Extra Bacon Crujiente', 1.99 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'extras'
UNION ALL
SELECT id, 'queso', 'Extra Queso Cheddar', 1.29 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'extras'
UNION ALL
SELECT id, 'huevo', 'Huevo Frito Estrellado', 1.49 FROM menu_item_options WHERE menu_item_id = 'b5' AND option_id = 'extras'
ON CONFLICT DO NOTHING;

-- MENÚ ITALIAN
INSERT INTO menu_items (id, restaurant_id, name, price, image, description) VALUES
('i1', 'italian', 'Pasta Carbonara Tradicional', 13.99, 'fotos italian taste/carbonara.jpg', 'Auténtica receta romana con yema de huevo, queso pecorino, pancetta italiana y pimienta negra recién molida.'),
('i2', 'italian', 'Pizza Margarita Napolitana', 12.99, 'fotos italian taste/pizza.jpg', 'Masa madre de 48h, salsa de tomate San Marzano, mozzarella fior di latte y albahaca fresca. Horneada a leña.')
ON CONFLICT (id) DO NOTHING;

-- Opciones i1
INSERT INTO menu_item_options (menu_item_id, option_id, name, required, multi_select) VALUES
('i1', 'pasta-type', 'Tipo de Pasta', true, false)
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_option_choices (option_id, choice_id, name, price_modifier)
SELECT id, 'spaghetti', 'Spaghetti al Dente', 0 FROM menu_item_options WHERE menu_item_id = 'i1' AND option_id = 'pasta-type'
UNION ALL
SELECT id, 'penne', 'Penne Rigate', 0 FROM menu_item_options WHERE menu_item_id = 'i1' AND option_id = 'pasta-type'
UNION ALL
SELECT id, 'fettuccine', 'Fettuccine Fresco', 1.00 FROM menu_item_options WHERE menu_item_id = 'i1' AND option_id = 'pasta-type'
ON CONFLICT DO NOTHING;

-- Opciones i2
INSERT INTO menu_item_options (menu_item_id, option_id, name, required, multi_select) VALUES
('i2', 'size', 'Tamaño', true, false),
('i2', 'extras', 'Ingredientes Extra', false, true)
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_option_choices (option_id, choice_id, name, price_modifier)
SELECT id, 'personal', 'Personal (4 porciones)', -3.00 FROM menu_item_options WHERE menu_item_id = 'i2' AND option_id = 'size'
UNION ALL
SELECT id, 'mediana', 'Mediana (6 porciones)', 0 FROM menu_item_options WHERE menu_item_id = 'i2' AND option_id = 'size'
UNION ALL
SELECT id, 'familiar', 'Familiar (8 porciones)', 7.00 FROM menu_item_options WHERE menu_item_id = 'i2' AND option_id = 'size'
UNION ALL
SELECT id, 'pepperoni', 'Pepperoni Italiano', 2.50 FROM menu_item_options WHERE menu_item_id = 'i2' AND option_id = 'extras'
UNION ALL
SELECT id, 'champinones', 'Champiñones Portobello', 1.99 FROM menu_item_options WHERE menu_item_id = 'i2' AND option_id = 'extras'
ON CONFLICT DO NOTHING;

-- MENÚ MEXICAN
INSERT INTO menu_items (id, restaurant_id, name, price, image, description) VALUES
('m1', 'mexican', 'Tacos al Pastor', 9.99, 'fotos viva mexico/tacos.jpg', 'Tres tacos de cerdo marinado adobado, piña asada, cebolla, cilantro y salsa verde en tortillas de maíz hechas a mano.'),
('m2', 'mexican', 'Burrito Supreme', 10.99, 'fotos viva mexico/burritos.jpg', 'Tortilla de harina grande rellena de carne asada, arroz, frijoles, guacamole, crema agria, queso y pico de gallo.'),
('m3', 'mexican', 'Nachos Supremos', 7.99, 'fotos viva mexico/nachos.jpg', 'Totopos de maíz cubiertos con queso fundido, jalapeños, frijoles refritos, pico de gallo, guacamole y crema agria.')
ON CONFLICT (id) DO NOTHING;

-- MENÚ CAFE
INSERT INTO menu_items (id, restaurant_id, name, price, image, description) VALUES
('c1', 'cafe', 'Café Latte Artesanal', 4.49, 'cafe aroma/latte.jpg', 'Espresso doble con leche vaporizada y microespuma, decorado con latte art. Granos 100% arábica de origen único.'),
('c2', 'cafe', 'Cheesecake de Fresa', 6.99, 'cafe aroma/cheesecake.webp', 'Cremoso cheesecake estilo Nueva York sobre base de galleta Graham, cubierto con coulis de fresas naturales.'),
('c3', 'cafe', 'Brownie de Chocolate Negro', 5.99, 'cafe aroma/brownie.jpg', 'Intenso brownie de chocolate belga 70% cacao, con trozos de nuez pecana y servido tibio con un toque de vainilla.')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABLES
-- ============================================
INSERT INTO tables (id, restaurant_id, name, label, style) VALUES
(1, 'burgers', 'M1', 'Mesa 1', 'standard'),
(2, 'burgers', 'M2', 'Mesa 2', 'standard'),
(3, 'burgers', 'B1', 'Barra 1', 'bar'),
(4, 'burgers', 'V1', 'VIP 1', 'vip'),
(5, 'burgers', 'T1', 'Terraza 1', 'terraza'),
(6, 'burgers', 'T2', 'Terraza 2', 'terraza'),
(7, 'burgers', 'M3', 'Mesa 3', 'standard'),
(8, 'burgers', 'M4', 'Mesa 4', 'standard'),
(9, 'burgers', 'B2', 'Barra 2', 'bar'),
(10, 'burgers', 'V2', 'VIP 2', 'vip'),
(11, 'burgers', 'M5', 'Mesa 5', 'standard'),
(12, 'burgers', 'M6', 'Mesa 6', 'standard')
ON CONFLICT DO NOTHING;

INSERT INTO tables (id, restaurant_id, name, label, style) VALUES
(1, 'italian', 'M1', 'Mesa 1', 'standard'),
(2, 'italian', 'M2', 'Mesa 2', 'standard'),
(3, 'italian', 'V1', 'VIP 1', 'vip'),
(4, 'italian', 'V2', 'VIP 2', 'vip'),
(5, 'italian', 'T1', 'Terraza 1', 'terraza'),
(6, 'italian', 'B1', 'Barra 1', 'bar')
ON CONFLICT DO NOTHING;

INSERT INTO tables (id, restaurant_id, name, label, style) VALUES
(1, 'mexican', 'M1', 'Mesa 1', 'standard'),
(2, 'mexican', 'M2', 'Mesa 2', 'standard'),
(3, 'mexican', 'M3', 'Mesa 3', 'standard'),
(4, 'mexican', 'B1', 'Barra 1', 'bar'),
(5, 'mexican', 'T1', 'Terraza 1', 'terraza')
ON CONFLICT DO NOTHING;

INSERT INTO tables (id, restaurant_id, name, label, style) VALUES
(1, 'cafe', 'M1', 'Mesa 1', 'standard'),
(2, 'cafe', 'M2', 'Mesa 2', 'standard'),
(3, 'cafe', 'V1', 'VIP 1', 'vip'),
(4, 'cafe', 'B1', 'Barra 1', 'bar')
ON CONFLICT DO NOTHING;

-- TABLE LAYOUTS
INSERT INTO table_layouts (restaurant_id, columns, gap) VALUES
('burgers', 4, '14px'),
('italian', 3, '16px'),
('mexican', 3, '14px'),
('cafe', 2, '20px')
ON CONFLICT (restaurant_id) DO NOTHING;

-- EXCHANGE RATES
INSERT INTO exchange_rates (code, symbol, rate) VALUES
('USD', '$', 1),
('ARS', 'ARS$', 1015),
('EUR', '€', 0.92),
('MXN', 'MX$', 17.5),
('NIO', 'C$', 36.4)
ON CONFLICT (code) DO NOTHING;

-- ESTADISTICAS ITEMS (datos iniciales)
INSERT INTO item_stats (restaurant_id, item_key, count) VALUES
('burgers', 'b1', 14),
('burgers', 'b5', 23),
('burgers', 'b3', 9),
('burgers', 'b4', 6),
('burgers', 'b2', 11),
('italian', 'i2', 18),
('italian', 'i1', 12),
('mexican', 'm1', 21),
('mexican', 'm2', 8),
('mexican', 'm3', 15),
('cafe', 'c1', 30),
('cafe', 'c2', 22),
('cafe', 'c3', 10)
ON CONFLICT (restaurant_id, item_key) DO NOTHING;

INSERT INTO user_restaurants (user_id, restaurant_id, role) VALUES
('admin', 'burgers', 'owner'),
('test', 'italian', 'manager')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_restaurants_user ON user_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restaurants_restaurant ON user_restaurants(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_overlap ON reservations(restaurant_id, table_number, status, start_time, end_time);







-- Manager de Italian Taste
INSERT INTO users ("user", pass, name, email, phone, avatar, role, favorites, orders_count) VALUES
('italian_manager', 'italian123', 'Gerente Italian', 'italian@expressflavor.com', '+505 7777-1111', 'https://ui-avatars.com/api/?name=Gerente+Italian&background=e74c3c&color=fff&size=128', 'manager', '["italian"]', 5)
ON CONFLICT ("user") DO NOTHING;

-- Owner de Viva México
INSERT INTO users ("user", pass, name, email, phone, avatar, role, favorites, orders_count) VALUES
('mexican_owner', 'mexican123', 'Dueño Viva México', 'mexican@expressflavor.com', '+505 7777-2222', 'https://ui-avatars.com/api/?name=Dueño+Viva+Mexico&background=27ae60&color=fff&size=128', 'owner', '["mexican"]', 8)
ON CONFLICT ("user") DO NOTHING;

-- Staff de Café Aroma
INSERT INTO users ("user", pass, name, email, phone, avatar, role, favorites, orders_count) VALUES
('cafe_staff', 'cafe123', 'Personal Café', 'cafe@expressflavor.com', '+505 7777-3333', 'https://ui-avatars.com/api/?name=Personal+Cafe&background=f39c12&color=fff&size=128', 'staff', '["cafe"]', 3)
ON CONFLICT ("user") DO NOTHING;

INSERT INTO user_restaurants (user_id, restaurant_id, role) VALUES
('italian_manager', 'italian', 'manager')
ON CONFLICT DO NOTHING;

INSERT INTO user_restaurants (user_id, restaurant_id, role) VALUES
('mexican_owner', 'mexican', 'owner')
ON CONFLICT DO NOTHING;

INSERT INTO user_restaurants (user_id, restaurant_id, role) VALUES
('cafe_staff', 'cafe', 'staff')
ON CONFLICT DO NOTHING;