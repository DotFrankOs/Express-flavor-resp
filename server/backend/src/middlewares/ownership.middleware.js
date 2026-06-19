const { userRepository } = require('../repositories');

function requireOwnership(paramName = 'userId') {
  return async (req, res, next) => {
    const resourceUserId = req.params[paramName];
    const currentUserId = req.userId;
    const userRole = req.userRole;

    if (userRole === 'admin') return next();

    if (resourceUserId === currentUserId) return next();

    return res.status(403).json({ 
      error: 'No autorizado. No puedes acceder a recursos de otro usuario.' 
    });
  };
}

function requireRestaurantAccess() {
  return async (req, res, next) => {
    const restaurantId = req.params.restaurantId || req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole === 'admin') return next();

    const { staffRepository } = require('../repositories');
    const access = await staffRepository.findUserRestaurant(userId, restaurantId);
    
    if (!access) {
      return res.status(403).json({ 
        error: 'No tienes acceso a este restaurante' 
      });
    }
    
    req.staffRole = access.role;
    next();
  };
}

module.exports = { requireOwnership, requireRestaurantAccess };