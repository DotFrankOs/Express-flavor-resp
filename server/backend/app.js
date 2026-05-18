const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

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

// MIDDLEWARE DE LOGGIN EN RESPUESTAS
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

// MIDDLEWARE DE AUTENTICACIÓN
function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body?.userId || req.params?.userId;

  if (!userId || userId === 'anonymous' || userId === 'guest') {
    return res.status(401).json({ error: 'No autenticado. Inicia sesión para continuar.' });
  }

  req.userId = userId;
  next();
}

// INICIO
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { user: username }
    });

    if (!user || user.pass !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      user: user.user,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      ordersCount: user.orders_count,
      favorites: JSON.parse(user.favorites || '[]')
    });
  } catch (err) {
    log('error', 'Login error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, pass, name, email } = req.body;

    const exists = await prisma.user.findUnique({
      where: { user }
    });

    if (exists) return res.status(400).json({ error: 'Usuario ya existe' });

    const newUser = await prisma.user.create({
      data: {
        user,
        pass,
        name,
        email: email || '',
        role: 'customer',
        favorites: '[]',
        orders_count: 0
      }
    });

    res.json({ user: newUser.user, name: newUser.name, email: newUser.email || '' });
  } catch (err) {
    log('error', 'Register error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const rows = await prisma.restaurant.findMany();
    res.json(rows.map(r => ({
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
    const r = await prisma.restaurant.findUnique({
      where: { id: req.params.id }
    });

    if (!r) return res.status(404).json({ error: 'Restaurante no encontrado' });

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

app.get('/api/restaurants/:id/menu', async (req, res) => {
  try {
    const itemsResult = await prisma.menuItem.findMany({
      where: { restaurant_id: req.params.id },
      include: {
        options: {
          include: { choices: true }
        },
        variants: {
          include: { items: true }
        }
      }
    });

    const items = itemsResult.map(item => {
      const menuItem = {
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image,
        description: item.description
      };

      if (item.options && item.options.length > 0) {
        menuItem.options = item.options.map(opt => ({
          id: opt.option_id,
          name: opt.name,
          required: opt.required,
          multiSelect: opt.multi_select,
          choices: opt.choices.map(c => ({
            id: c.choice_id,
            name: c.name,
            priceModifier: parseFloat(c.price_modifier)
          }))
        }));
      }

      if (item.variants && item.variants.length > 0) {
        const v = item.variants[0];
        menuItem.variants = {
          required: v.required,
          items: v.items.map(vi => ({
            id: vi.item_id,
            name: vi.name,
            price: parseFloat(vi.price)
          }))
        };
      }

      return menuItem;
    });

    res.json(items);
  } catch (err) {
    log('error', 'Get menu error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/tables', async (req, res) => {
  try {
    const rows = await prisma.table.findMany({
      where: { restaurant_id: req.params.id },
      orderBy: { id: 'asc' }
    });

    res.json(rows.map(t => ({
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
    const l = await prisma.tableLayout.findUnique({
      where: { restaurant_id: req.params.id }
    });

    if (!l) return res.json({ columns: 5, gap: '10px' });

    res.json({ columns: l.columns, gap: l.gap });
  } catch (err) {
    log('error', 'Get layout error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurants/:id/reservations', async (req, res) => {
  try {
    const rows = await prisma.reservation.findMany({
      where: { restaurant_id: req.params.id }
    });

    res.json(rows.map(r => ({
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

app.post('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const { number, startTime, endTime, duration, code, userId } = req.body;

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para crear esta reserva' });
    }

    const r = await prisma.reservation.create({
      data: {
        restaurant_id: req.params.id,
        table_number: number,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
        duration,
        code,
        user_id: userId
      }
    });

    res.json({
      number: r.table_number,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.duration,
      code: r.code,
      userId: r.user_id
    });
  } catch (err) {
    log('error', 'Add reservation error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const reservations = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({
        where: { restaurant_id: req.params.id }
      });

      for (const r of reservations) {
        await tx.reservation.create({
          data: {
            restaurant_id: req.params.id,
            table_number: r.number,
            start_time: new Date(r.startTime),
            end_time: new Date(r.endTime),
            duration: r.duration,
            code: r.code,
            user_id: r.userId
          }
        });
      }
    });

    res.json(reservations);
  } catch (err) {
    log('error', 'Save reservations error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/restaurants/:id/reservations', requireAuth, async (req, res) => {
  try {
    const { tableNumber, startTime } = req.body;

    const check = await prisma.reservation.findFirst({
      where: {
        restaurant_id: req.params.id,
        table_number: tableNumber,
        start_time: new Date(startTime)
      }
    });

    if (!check) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (check.user_id !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para cancelar esta reserva' });
    }

    await prisma.reservation.deleteMany({
      where: {
        restaurant_id: req.params.id,
        table_number: tableNumber,
        start_time: new Date(startTime)
      }
    });

    res.json({ success: true });
  } catch (err) {
    log('error', 'Delete reservation error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations/my', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.reservation.findMany({
      where: { user_id: req.userId },
      include: { restaurant: true },
      orderBy: { start_time: 'asc' }
    });

    res.json(rows.map(r => ({
      number: r.table_number,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.duration,
      code: r.code,
      userId: r.user_id,
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant?.name
    })));
  } catch (err) {
    log('error', 'Get my reservations error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exchange-rates', async (req, res) => {
  try {
    const rows = await prisma.exchangeRate.findMany();
    const rates = {};
    const symbols = {};

    rows.forEach(r => {
      rates[r.code] = parseFloat(r.rate);
      symbols[r.code] = r.symbol;
    });

    res.json({ base: 'USD', rates, symbols });
  } catch (err) {
    log('error', 'Get exchange rates error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const rows = await prisma.report.findMany({
      orderBy: { date: 'desc' }
    });

    res.json(rows.map(r => ({
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

app.post('/api/reports', requireAuth, async (req, res) => {
  try {
    const { description, image, userId } = req.body;

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para enviar este reporte' });
    }

    const id = BigInt(Date.now());
    const date = new Date();

    const report = await prisma.report.create({
      data: {
        id,
        description,
        image,
        date,
        user_id: userId
      }
    });

    res.json({
      id: report.id,
      description: report.description,
      image: report.image,
      date: report.date,
      userId: report.user_id
    });
  } catch (err) {
    log('error', 'Save report error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stats/purchase', requireAuth, async (req, res) => {
  try {
    const { restaurantId, itemId, quantity, variant } = req.body;
    const qty = quantity || 1;

    await prisma.itemStat.upsert({
      where: {
        restaurant_id_item_key: {
          restaurant_id: restaurantId,
          item_key: itemId
        }
      },
      update: { count: { increment: qty } },
      create: {
        restaurant_id: restaurantId,
        item_key: itemId,
        count: qty
      }
    });

    if (variant && variant.variantId) {
      await prisma.itemStat.upsert({
        where: {
          restaurant_id_item_key: {
            restaurant_id: restaurantId,
            item_key: `${itemId}|${variant.variantId}`
          }
        },
        update: { count: { increment: qty } },
        create: {
          restaurant_id: restaurantId,
          item_key: `${itemId}|${variant.variantId}`,
          count: qty
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    log('error', 'Record purchase error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id', async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({
      where: { restaurant_id: req.params.id }
    });

    const stats = {};
    rows.forEach(r => { stats[r.item_key] = r.count; });
    res.json(stats);
  } catch (err) {
    log('error', 'Get stats error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const rows = await prisma.itemStat.findMany({
      where: {
        restaurant_id: req.params.id,
        NOT: { item_key: { contains: '|' } }
      },
      orderBy: { count: 'desc' },
      take: limit
    });

    res.json(rows.map(r => ({ itemId: r.item_key, count: r.count })));
  } catch (err) {
    log('error', 'Get top items error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/items/:itemId', async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({
      where: {
        restaurant_id: req.params.id,
        OR: [
          { item_key: req.params.itemId },
          { item_key: { startsWith: `${req.params.itemId}|` } }
        ]
      }
    });

    const total = rows.reduce((sum, r) => sum + r.count, 0);
    res.json({ count: total });
  } catch (err) {
    log('error', 'Get item count error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/restaurants/:id/items/:itemId/variants', async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({
      where: {
        restaurant_id: req.params.id,
        item_key: { startsWith: `${req.params.itemId}|` }
      }
    });

    res.json(
      rows.map(r => ({
        variantId: r.item_key.split('|')[1],
        count: r.count
      })).sort((a, b) => b.count - a.count)
    );
  } catch (err) {
    log('error', 'Get variant stats error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, total, restaurantId, restaurantName, userId } = req.body;

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para crear esta orden' });
    }

    const orderId = `ord_${Date.now()}`;
    const createdAt = new Date();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          user_id: userId,
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          total,
          created_at: createdAt
        }
      });

      for (const item of items) {
        const orderItemId = `${orderId}_${item.id}`;

        await tx.orderItem.create({
          data: {
            id: orderItemId,
            order_id: orderId,
            item_id: item.id,
            name: item.name,
            base_name: item.baseName || item.name,
            price: item.price,
            base_price: item.basePrice || item.price,
            quantity: item.quantity,
            variant: item.variant ? JSON.stringify(item.variant) : null,
            image: item.image || null
          }
        });

        if (item.options && item.options.length > 0) {
          for (const opt of item.options) {
            await tx.orderItemOption.create({
              data: {
                order_item_id: orderItemId,
                choice_id: opt.choiceId,
                choice_name: opt.choiceName,
                price_modifier: opt.priceModifier || 0
              }
            });
          }
        }
      }

      await tx.user.update({
        where: { user: userId },
        data: { orders_count: { increment: 1 } }
      });

      return newOrder;
    });

    res.json({ id: orderId, userId, restaurantId, restaurantName, items, total, createdAt });
  } catch (err) {
    log('error', 'Create order error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/user/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para ver estas órdenes' });
    }

    const ordersResult = await prisma.order.findMany({
      where: { user_id: req.params.userId },
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: { options: true }
        }
      }
    });

    const orders = ordersResult.map(o => ({
      id: o.id,
      userId: o.user_id,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurant_name,
      items: o.items.map(item => ({
        itemId: item.item_id,
        name: item.name,
        baseName: item.base_name,
        price: parseFloat(item.price),
        basePrice: parseFloat(item.base_price),
        quantity: item.quantity,
        variant: item.variant,
        options: item.options.map(opt => ({
          choiceId: opt.choice_id,
          choiceName: opt.choice_name,
          priceModifier: parseFloat(opt.price_modifier)
        })),
        image: item.image
      })),
      total: parseFloat(o.total),
      createdAt: o.created_at
    }));

    res.json(orders);
  } catch (err) {
    log('error', 'Get user orders error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para ver este carrito' });
    }

    const rows = await prisma.cartItem.findMany({
      where: { user_id: req.params.userId }
    });

    const items = rows.map(r => ({
      id: r.id,
      name: r.name,
      baseName: r.base_name,
      price: parseFloat(r.price),
      basePrice: parseFloat(r.base_price),
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      quantity: r.quantity,
      variant: r.variant,
      options: r.options ? JSON.parse(r.options) : [],
      image: r.image
    }));

    res.json({ items, updatedAt: items.length > 0 ? new Date().toISOString() : null });
  } catch (err) {
    log('error', 'Get cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este carrito' });
    }

    const { items } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { user_id: req.params.userId }
      });

      for (const item of items) {
        await tx.cartItem.create({
          data: {
            id: item.id,
            user_id: req.params.userId,
            name: item.name,
            base_name: item.baseName || item.name,
            price: item.price,
            base_price: item.basePrice || item.price,
            restaurant_id: item.restaurantId,
            restaurant_name: item.restaurantName,
            quantity: item.quantity,
            variant: item.variant ? JSON.stringify(item.variant) : null,
            options: item.options ? JSON.stringify(item.options) : null,
            image: item.image || null
          }
        });
      }
    });

    res.json({ items, updatedAt: new Date().toISOString() });
  } catch (err) {
    log('error', 'Save cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cart/:userId', requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'No autorizado para limpiar este carrito' });
    }

    await prisma.cartItem.deleteMany({
      where: { user_id: req.params.userId }
    });

    res.json({ success: true });
  } catch (err) {
    log('error', 'Clear cart error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

app.listen(PORT, () => {
  showPortsInfo();
  log('info', 'Servidor Express Flavor con Prisma iniciado correctamente');
});