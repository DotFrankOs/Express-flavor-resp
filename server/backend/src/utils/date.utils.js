function getTodayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
}

function toISOString(date) {
  return date ? new Date(date).toISOString() : null;
}

module.exports = {
  getTodayRange,
  toISOString
};