const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE LOGS
// ============================================
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = path.join(LOG_DIR, `api-${new Date().toISOString().split('T')[0]}.log`);

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;

  console.log(entry);

  try {
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

// Middleware de logging de requests
app.use((req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.on('finish', () => {
    const duration = Date.now() - start;
    let bodyLog;
    if (req.method !== 'GET' && req.body) {
      try {
        bodyLog = JSON.stringify(req.body).substring(0, 500);
      } catch {
        bodyLog = '[Objeto no serializable]';
      }
    }
    
    log('api', `${req.method} ${req.originalUrl}`, {
      ip: clientIp,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'] || 'unknown',
      body: bodyLog
    });
  });

  next();
});

app.use(express.json());
app.use(express.static('public'));

// ============================================
// BASE DE DATOS POSTGRESQL
// ============================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'expressuser',
  password: process.env.DB_PASS || 'expresspass',
  database: process.env.DB_NAME || 'expressflavor',
});

// Helper para queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body?.userId || req.params?.userId;
  
  if (!userId || userId === 'anonymous' || userId === 'guest') {
    return res.status(401).json({ error: 'No autenticado. Inicia sesión para continuar.' });
  }
  
  req.userId = userId;
  next();
}

// ============================================
// MOSTRAR PUERTOS DISPONIBLES AL INICIAR
// ============================================
function showPortsInfo() {
  log('info', '=== INFORMACIÓN DE PUERTOS ===');
  log('info', `Servidor corriendo en: http://localhost:${PORT}`);
  log('info', `API Base URL: http://localhost:${PORT}/api`);

  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        log('info', `También disponible en: http://${details.address}:${PORT}`);
      }
    });
  });

  log('info', 'Puertos expuestos en Docker:');
  log('info', '  - Backend: 3000');
  log('info', '  - PostgreSQL: 5432');
  log('info', '==============================');
}


// ============================================
// AUTH (PÚBLICO)
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await query('SELECT * FROM users WHERE "user" = $1 AND pass = $2', [username, password]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = result.rows[0];
    res.json({ user: user.user, name: user.name, email: user.email, avatar: user.avatar, role: user.role, ordersCount: user.orders_count, favorites: user.favorites || [] });
  } catch (err) {
    log('error', 'Login error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, pass, name, email } = req.body;
    const exists = await query('SELECT * FROM users WHERE "user" = $1', [user]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Usuario ya existe' });
    await query('INSERT INTO users ("user", pass, name, email, role, favorites, orders_count) VALUES ($1,$2,$3,$4,$5,$6,$7)', 
      [user, pass, name, email || '', 'customer', '[]', 0]);
    res.json({ user, name, email: email || '' });
  } catch (err) {
    log('error', 'Register error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// RESTAURANTS (PÚBLICO)
// ============================================
app.get('/api/restaurants', async (req, res) => {
  try {
    const result = await query('SELECT * FROM restaurants');
    res.json(result.rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      logo: r.logo,
      description: r.description,
      url: r.url,
      minDuration: r.min_duration,
      maxDuration: r.max_duration
    })));
  } catch (err) {
    log('error', 'Get restaurants error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    const r = result.rows[0];
    res.json({
      id: r.id, name: r.name, type: r.type, logo: r.logo,
      description: r.description, url: r.url,
      minDuration: r.min_duration, maxDuration: r.max_duration
    });
  } catch (err) {
    log('error', 'Get restaurant error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// MENU (PÚBLICO)
// ============================================
app.get('/api/restaurants/:id/menu', async (req, res) => {
  try {
    const itemsResult = await query('SELECT * FROM menu_items WHERE restaurant_id = $1', [req.params.id]);
    const items = [];

    for (const item of itemsResult.rows) {
      const menuItem = {
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image,
        description: item.description
      };

      // Opciones
      const optsResult = await query('SELECT * FROM menu_item_options WHERE menu_item_id = $1', [item.id]);
      if (optsResult.rows.length > 0) {
        menuItem.options = [];
        for (const opt of optsResult.rows) {
          const choicesResult = await query('SELECT * FROM menu_item_option_choices WHERE option_id = $1', [opt.id]);
          menuItem.options.push({
            id: opt.option_id,
            name: opt.name,
            required: opt.required,
            multiSelect: opt.multi_select,
            choices: choicesResult.rows.map(c => ({
              id: c.choice_id,
              name: c.name,
              priceModifier: parseFloat(c.price_modifier)
            }))
          });
        }
      }

      // Variantes
      const varsResult = await query('SELECT * FROM menu_item_variants WHERE menu_item_id = $1', [item.id]);
      if (varsResult.rows.length > 0) {
        const v = varsResult.rows[0];
        const varItemsResult = await query('SELECT * FROM menu_item_variant_items WHERE variant_id = $1', [v.id]);
        menuItem.variants = {
          required: v.required,
          items: varItemsResult.rows.map(vi => ({
            id: vi.item_id,
            name: vi.name,
            price: parseFloat(vi.price)
          }))
        };
      }

      items.push(menuItem);
    }

    res.json(items);
  } catch (err) {
    log('error', 'Get menu error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});


// ============================================
// TABLES & LAYOUT (PÚBLICO)
// ============================================
app.get('/api/restaurants/:id/tables', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tables WHERE restaurant_id = $1 ORDER BY id', [req.params.id]);
    res.json(result.rows.map(t => ({
      id: t.id,
      name: t.name,
      label: t.label,
      style: t.style
    })));
  } catch (err) {
    log('error', 'Get tables error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/tables/layout', async (req, res) => {
  try {
    const result = await query('SELECT * FROM table_layouts WHERE restaurant_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.json({ columns: 5, gap: '10px' });
    const l = result.rows[0];
    res.json({ columns: l.columns, gap: l.gap });
  } catch (err) {
    log('error', 'Get layout error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// RESERVATIONS
// ============================================
// GET - Público (para ver disponibilidad)
app.get('/api/restaurants/:id/reservations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reservations WHERE restaurant_id = $1', [req.params.id]);
    res.json(result.rows.map(r => ({
      number: r.table_number,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.duration,
      code: r.code,
      userId: r.user_id
    })));
  } catch (err) {
    log('error', 'Get reservations error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST - Protegido
app.post('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const { number, startTime, endTime, duration, code, userId } = req.body;
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para crear esta reserva' });
    }
    
    await query(
      'INSERT INTO reservations (restaurant_id, table_number, start_time, end_time, duration, code, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.params.id, number, startTime, endTime, duration, code, userId]
    );
    res.json({ number, startTime, endTime, duration, code, userId });
  } catch (err) {
    log('error', 'Add reservation error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// PUT - Protegido
app.put('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const reservations = req.body;
    await query('DELETE FROM reservations WHERE restaurant_id = $1', [req.params.id]);
    for (const r of reservations) {
      await query(
        'INSERT INTO reservations (restaurant_id, table_number, start_time, end_time, duration, code, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [req.params.id, r.number, r.startTime, r.endTime, r.duration, r.code, r.userId]
      );
    }
    res.json(reservations);
  } catch (err) {
    log('error', 'Save reservations error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Protegido (solo puede cancelar sus propias reservas)
app.delete('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const { tableNumber, startTime } = req.body;
    
    const checkResult = await query(
      'SELECT * FROM reservations WHERE restaurant_id = $1 AND table_number = $2 AND start_time = $3',
      [req.params.id, tableNumber, startTime]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    if (checkResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para cancelar esta reserva' });
    }
    
    await query('DELETE FROM reservations WHERE restaurant_id = $1 AND table_number = $2 AND start_time = $3', 
      [req.params.id, tableNumber, startTime]);
    res.json({ success: true });
  } catch (err) {
    log('error', 'Delete reservation error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET mis reservas - Protegido
app.get('/api/reservations/my', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, rest.name as restaurant_name, rest.id as restaurant_id 
      FROM reservations r 
      JOIN restaurants rest ON r.restaurant_id = rest.id 
      WHERE r.user_id = $1 
      ORDER BY r.start_time
    `, [req.userId]);
    
    res.json(result.rows.map(r => ({
      number: r.table_number,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.duration,
      code: r.code,
      userId: r.user_id,
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name
    })));
  } catch (err) {
    log('error', 'Get my reservations error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXCHANGE RATES (PÚBLICO)
// ============================================
app.get('/api/exchange-rates', async (req, res) => {
  try {
    const result = await query('SELECT * FROM exchange_rates');
    const rates = {};
    const symbols = {};
    result.rows.forEach(r => {
      rates[r.code] = parseFloat(r.rate);
      symbols[r.code] = r.symbol;
    });
    res.json({ base: 'USD', rates, symbols });
  } catch (err) {
    log('error', 'Get exchange rates error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// REPORTS
// ============================================
// GET - Público
app.get('/api/reports', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reports ORDER BY date DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      description: r.description,
      image: r.image,
      date: r.date,
      userId: r.user_id
    })));
  } catch (err) {
    log('error', 'Get reports error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST - Protegido
app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const { description, image, userId } = req.body;
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para enviar este reporte' });
    }
    
    const id = Date.now();
    const date = new Date().toISOString();
    await query('INSERT INTO reports (id, description, image, date, user_id) VALUES ($1,$2,$3,$4,$5)',
      [id, description, image, date, userId]);
    res.json({ id, description, image, date, userId });
  } catch (err) {
    log('error', 'Save report error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});


// ============================================
// STATS
// ============================================
// POST - Protegido
app.post('/api/stats/purchase', requireAuth, async (req, res) => {
  try {
    const { restaurantId, itemId, quantity, variant } = req.body;
    const qty = quantity || 1;

    await query(`
      INSERT INTO item_stats (restaurant_id, item_key, count) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (restaurant_id, item_key) 
      DO UPDATE SET count = item_stats.count + $3
    `, [restaurantId, itemId, qty]);

    if (variant && variant.variantId) {
      await query(`
        INSERT INTO item_stats (restaurant_id, item_key, count) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (restaurant_id, item_key) 
        DO UPDATE SET count = item_stats.count + $3
      `, [restaurantId, `${itemId}|${variant.variantId}`, qty]);
    }

    res.json({ success: true });
  } catch (err) {
    log('error', 'Record purchase error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET - Público
app.get('/api/stats/restaurants/:id', async (req, res) => {
  try {
    const result = await query('SELECT item_key, count FROM item_stats WHERE restaurant_id = $1', [req.params.id]);
    const stats = {};
    result.rows.forEach(r => { stats[r.item_key] = r.count; });
    res.json(stats);
  } catch (err) {
    log('error', 'Get stats error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const result = await query(`
      SELECT item_key, count FROM item_stats 
      WHERE restaurant_id = $1 AND item_key NOT LIKE '%|%'
      ORDER BY count DESC 
      LIMIT $2
    `, [req.params.id, limit]);
    res.json(result.rows.map(r => ({ itemId: r.item_key, count: r.count })));
  } catch (err) {
    log('error', 'Get top items error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/items/:itemId', async (req, res) => {
  try {
    const result = await query(`
      SELECT SUM(count) as total FROM item_stats 
      WHERE restaurant_id = $1 AND (item_key = $2 OR item_key LIKE $3)
    `, [req.params.id, req.params.itemId, `${req.params.itemId}|%`]);
    res.json({ count: parseInt(result.rows[0].total) || 0 });
  } catch (err) {
    log('error', 'Get item count error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/items/:itemId/variants', async (req, res) => {
  try {
    const result = await query(`
      SELECT item_key, count FROM item_stats 
      WHERE restaurant_id = $1 AND item_key LIKE $2
    `, [req.params.id, `${req.params.itemId}|%`]);
    res.json(result.rows.map(r => ({
      variantId: r.item_key.split('|')[1],
      count: r.count
    })).sort((a, b) => b.count - a.count));
  } catch (err) {
    log('error', 'Get variant stats error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ORDERS
// ============================================
// POST - Protegido
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, total, restaurantId, restaurantName, userId } = req.body;
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para crear esta orden' });
    }
    
    const orderId = `ord_${Date.now()}`;
    const createdAt = new Date().toISOString();

    await query(
      'INSERT INTO orders (id, user_id, restaurant_id, restaurant_name, total, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [orderId, userId, restaurantId, restaurantName, total, createdAt]
    );

    for (const item of items) {
      const orderItemId = `${orderId}_${item.id}`;
      await query(
        'INSERT INTO order_items (id, order_id, item_id, name, base_name, price, base_price, quantity, variant, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [orderItemId, orderId, item.id, item.name, item.baseName || item.name, item.price, item.basePrice || item.price, item.quantity, JSON.stringify(item.variant || null), item.image || null]
      );

      if (item.options && item.options.length > 0) {
        for (const opt of item.options) {
          await query(
            'INSERT INTO order_item_options (order_item_id, choice_id, choice_name, price_modifier) VALUES ($1,$2,$3,$4)',
            [orderItemId, opt.choiceId, opt.choiceName, opt.priceModifier || 0]
          );
        }
      }
    }

    await query('UPDATE users SET orders_count = orders_count + 1 WHERE "user" = $1', [userId]);

    res.json({ id: orderId, userId, restaurantId, restaurantName, items, total, createdAt });
  } catch (err) {
    log('error', 'Create order error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET - Protegido (solo propias órdenes)
app.get('/api/orders/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para ver estas órdenes' });
    }
    
    const ordersResult = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    const orders = [];

    for (const o of ordersResult.rows) {
      const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      const items = [];

      for (const item of itemsResult.rows) {
        const optsResult = await query('SELECT * FROM order_item_options WHERE order_item_id = $1', [item.id]);
        items.push({
          itemId: item.item_id,
          name: item.name,
          baseName: item.base_name,
          price: parseFloat(item.price),
          basePrice: parseFloat(item.base_price),
          quantity: item.quantity,
          variant: item.variant,
          options: optsResult.rows.map(opt => ({
            choiceId: opt.choice_id,
            choiceName: opt.choice_name,
            priceModifier: parseFloat(opt.price_modifier)
          })),
          image: item.image
        });
      }

      orders.push({
        id: o.id,
        userId: o.user_id,
        restaurantId: o.restaurant_id,
        restaurantName: o.restaurant_name,
        items,
        total: parseFloat(o.total),
        createdAt: o.created_at
      });
    }

    res.json(orders);
  } catch (err) {
    log('error', 'Get user orders error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CART
// ============================================
// GET - Protegido (solo propio carrito)
app.get('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para ver este carrito' });
    }
    
    const result = await query('SELECT * FROM cart_items WHERE user_id = $1', [req.params.userId]);
    const items = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      baseName: r.base_name,
      price: parseFloat(r.price),
      basePrice: parseFloat(r.base_price),
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      quantity: r.quantity,
      variant: r.variant,
      options: r.options || [],
      image: r.image
    }));
    res.json({ items, updatedAt: items.length > 0 ? new Date().toISOString() : null });
  } catch (err) {
    log('error', 'Get cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// PUT - Protegido (solo propio carrito)
app.put('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este carrito' });
    }
    
    const { items } = req.body;
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.params.userId]);

    for (const item of items) {
      await query(
        'INSERT INTO cart_items (id, user_id, name, base_name, price, base_price, restaurant_id, restaurant_name, quantity, variant, options, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [item.id, req.params.userId, item.name, item.baseName || item.name, item.price, item.basePrice || item.price, item.restaurantId, item.restaurantName, item.quantity, JSON.stringify(item.variant || null), JSON.stringify(item.options || []), item.image || null]
      );
    }

    res.json({ items, updatedAt: new Date().toISOString() });
  } catch (err) {
    log('error', 'Save cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Protegido (solo propio carrito)
app.delete('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para limpiar este carrito' });
    }
    
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    log('error', 'Clear cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HEALTH CHECK (PÚBLICO)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ERROR HANDLER GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  showPortsInfo();
  log('info', 'Servidor Express Flavor iniciado correctamente');
});