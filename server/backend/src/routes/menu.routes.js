const express = require('express');
const router = express.Router();
const { protegerRuta, requireRoles } = require('../middlewares/auth.middleware');
const menuController = require('../controllers/menu.controller');
const { menuValidator } = require('../middlewares/validators');

router.get('/restaurants/:id/menu', menuController.getMenu);

router.get(
  '/restaurants/:id/menu/all',
  protegerRuta,
  requireRoles('manager', 'owner', 'admin'),
  menuController.getAllMenu
);

router.post(
  '/restaurants/:id/menu/items',
  protegerRuta,
  requireRoles('manager', 'owner', 'admin'),
  menuValidator.validateCreateItem,
  menuController.createItem
);

router.patch(
  '/restaurants/:id/menu/items/:itemId',
  protegerRuta,
  requireRoles('manager', 'owner', 'admin'),
  menuValidator.validateUpdateItem,
  menuController.updateItem
);

router.patch(
  '/restaurants/:id/menu/items/:itemId/toggle',
  protegerRuta,
  requireRoles('manager', 'owner', 'admin'),
  menuController.toggleItem
);

router.delete(
  '/restaurants/:id/menu/items/:itemId',
  protegerRuta,
  requireRoles('owner', 'admin'),
  menuController.deleteItem
);

module.exports = router;