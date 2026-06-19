const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { userRepository } = require('../repositories');
const { UserDTO } = require('../dto');
const ApplicationError = require('../domain/errors/application-error');

const { secret, expiresIn } = config.jwt;
const SALT_ROUNDS = config.bcrypt.saltRounds;

const PERMISSIONS = {
  customer: {
    canAccess: ['own_cart', 'own_orders', 'own_reservations', 'read_menu', 'read_restaurants'],
    canModifyOwn: true, canModifyAny: false, canManageStaff: false,
    canManageMenu: false, canManageOrders: false, canViewDashboard: false
  },
  staff: {
    canAccess: ['own_cart', 'own_orders', 'own_reservations', 'read_menu', 'read_restaurants', 'staff_dashboard'],
    canModifyOwn: true, canModifyAny: false, canManageStaff: false,
    canManageMenu: false, canManageOrders: true, canViewDashboard: true
  },
  manager: {
    canAccess: ['own_cart', 'own_orders', 'own_reservations', 'read_menu', 'read_restaurants', 'staff_dashboard', 'manage_menu'],
    canModifyOwn: true, canModifyAny: false, canManageStaff: false,
    canManageMenu: true, canManageOrders: true, canViewDashboard: true
  },
  owner: {
    canAccess: ['own_cart', 'own_orders', 'own_reservations', 'read_menu', 'read_restaurants', 'staff_dashboard', 'manage_menu', 'manage_staff'],
    canModifyOwn: true, canModifyAny: false, canManageStaff: true,
    canManageMenu: true, canManageOrders: true, canViewDashboard: true
  },
  admin: {
    canAccess: ['*'],
    canModifyOwn: true, canModifyAny: true, canManageStaff: true,
    canManageMenu: true, canManageOrders: true, canViewDashboard: true
  }
};

function hasPermission(role, permission) {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  if (rolePerms.canAccess.includes('*')) return true;
  return rolePerms.canAccess.includes(permission);
}

function canModifyOrder(role, orderUserId, currentUserId) {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  if (rolePerms.canModifyAny) return true;
  if (rolePerms.canModifyOwn && orderUserId === currentUserId) return true;
  if (rolePerms.canManageOrders && role !== 'customer') return true;
  return false;
}

function canAccessDashboard(role) {
  const rolePerms = PERMISSIONS[role];
  return rolePerms ? rolePerms.canViewDashboard : false;
}

class AuthService {
  constructor(repo) {
    this.repo = repo;
  }

  async _hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  async _comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async login(username, password) {
    const user = await this.repo.findByUsername(username);
    if (!user) {
      throw new ApplicationError('Credenciales inválidas', 401);
    }

    const isValid = await this._comparePassword(password, user.pass);
    const isLegacyValid = user.pass === password;

    if (!isValid && !isLegacyValid) {
      throw new ApplicationError('Credenciales inválidas', 401);
    }

    if (isLegacyValid && !user.pass.startsWith('$2')) {
      const hashed = await this._hashPassword(password);
      await this.repo.update({ user: username }, { pass: hashed });
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
      throw new ApplicationError('Usuario ya existe', 409);
    }

    const hashedPass = await this._hashPassword(pass);

    const newUser = await this.repo.create({
      user, pass: hashedPass, name,
      email: email || '', role: 'customer',
      favorites: '[]', orders_count: 0
    });

    const token = jwt.sign(
      { user: newUser.user, name: newUser.name, role: newUser.role },
      secret,
      { expiresIn }
    );
    return UserDTO.forAuthResponse(newUser, token);
  }

  hasPermission(role, permission) { return hasPermission(role, permission); }
  canModifyOrder(role, orderUserId, currentUserId) { return canModifyOrder(role, orderUserId, currentUserId); }
  canAccessDashboard(role) { return canAccessDashboard(role); }
  getRolePermissions(role) { return PERMISSIONS[role] || PERMISSIONS.customer; }
}

module.exports = new AuthService(userRepository);
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.hasPermission = hasPermission;
module.exports.canModifyOrder = canModifyOrder;
module.exports.canAccessDashboard = canAccessDashboard;