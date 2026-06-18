const crypto = require('crypto');

function generateOrderId() {
  return `ord_${Date.now()}`;
}

function generateOrderItemId(orderId, itemId) {
  return `${orderId}_${itemId}`;
}

function generateReportId() {
  return BigInt(Date.now());
}

function generateCartItemId(itemData, userId) {
  const base = itemData.baseName || itemData.name || 'item';
  const restaurant = itemData.restaurantId || itemData.restaurant_id || 'unknown';
  const variant = itemData.variant ? (itemData.variant.variantId || 'novar') : 'novar';
  const options = (itemData.options || [])
    .map(o => o.choiceId || o.choice_id || '')
    .sort()
    .join('-') || 'noopt';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  
  const hashInput = `${userId}_${restaurant}_${base}_${variant}_${options}`;
  const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8);
  
  return `cart_${hash}_${timestamp}_${random}`;
}

function generateDeliveryCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateReservationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = {
  generateOrderId, generateOrderItemId, generateReportId,
  generateCartItemId, generateDeliveryCode, generateReservationCode
};