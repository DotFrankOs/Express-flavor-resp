const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { user: username } });
    if (!user || user.pass !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { user: user.user, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: user.user,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      ordersCount: user.orders_count,
      favorites: JSON.parse(user.favorites || '[]')
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { user, pass, name, email } = req.body;
    const exists = await prisma.user.findUnique({ where: { user } });
    if (exists) return res.status(400).json({ error: 'Usuario ya existe' });

    const newUser = await prisma.user.create({
      data: {
        user, pass, name,
        email: email || '',
        role: 'customer',
        favorites: '[]',
        orders_count: 0
      }
    });

    const token = jwt.sign(
      { user: newUser.user, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: newUser.user,
      name: newUser.name,
      email: newUser.email || ''
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
};
