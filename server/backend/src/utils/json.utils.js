function safeJson(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

function parseJson(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

module.exports = { safeJson, parseJson };