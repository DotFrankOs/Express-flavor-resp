const jwt = require('jsonwebtoken');
const config = require('../config');
const { userRepository } = require('../repositories');
const { UserDTO } = require('../dto');
const { AppError } = require('../utils/prisma-error-handler.utils');

const { secret, expiresIn } = config.jwt;

class AuthService {
  constructor(repo) {
    this.repo = repo;
  }

  async login(username, password) {
    const user = await this.repo.findByUsername(username);

    if (!user || user.pass !== password) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
      { user: user.user, name: user.name, role: user.role },
      secret,
      { expiresIn }
    );

    return UserDTO.forAuthResponse(user, token);
  }

  async register(userData) {
    const { user, pass, name, email } = userData;

    const exists = await this.repo.findUnique({ user });
    if (exists) {
      throw new AppError('Usuario ya existe', 409);
    }

    const newUser = await this.repo.create({
      user,
      pass,
      name,
      email: email || '',
      role: 'customer',
      favorites: '[]',
      orders_count: 0
    });

    const token = jwt.sign(
      { user: newUser.user, name: newUser.name, role: newUser.role },
      secret,
      { expiresIn }
    );

    return UserDTO.forAuthResponse(newUser, token);
  }
}

module.exports = new AuthService(userRepository);