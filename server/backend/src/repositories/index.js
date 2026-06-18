const prisma = require('../lib/prisma');
const DbAdapter = require('../infrastructure/db.adapter');

const dbAdapter = new DbAdapter(prisma);

const UserRepository = require('./user.repository');
const RestaurantRepository = require('./restaurant.repository');
const MenuRepository = require('./menu.repository');
const TableRepository = require('./table.repository');
const ReservationRepository = require('./reservation.repository');
const OrderRepository = require('./order.repository');
const CartRepository = require('./cart.repository');
const StatsRepository = require('./stats.repository');
const ReportRepository = require('./report.repository');
const ExchangeRepository = require('./exchange.repository');
const StaffRepository = require('./staff.repository');

module.exports = {
  userRepository: new UserRepository(dbAdapter),
  restaurantRepository: new RestaurantRepository(dbAdapter),
  menuRepository: new MenuRepository(dbAdapter),
  tableRepository: new TableRepository(dbAdapter),
  reservationRepository: new ReservationRepository(dbAdapter),
  orderRepository: new OrderRepository(dbAdapter),
  cartRepository: new CartRepository(dbAdapter),
  statsRepository: new StatsRepository(dbAdapter),
  reportRepository: new ReportRepository(dbAdapter),
  exchangeRepository: new ExchangeRepository(dbAdapter),
  staffRepository: new StaffRepository(dbAdapter)
};