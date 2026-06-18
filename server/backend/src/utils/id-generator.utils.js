function generateOrderId() {
  return `ord_${Date.now()}`;
}

function generateOrderItemId(orderId, itemId) {
  return `${orderId}_${itemId}`;
}

function generateReportId() {
  return BigInt(Date.now());
}

module.exports = {
  generateOrderId,
  generateOrderItemId,
  generateReportId
};