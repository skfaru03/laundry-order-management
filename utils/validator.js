/**
 * Hardcoded price list for garment types.
 * Keys are lowercase for case-insensitive matching.
 */
const PRICE_LIST = {
  shirt: 50,
  pants: 60,
  saree: 120,
  suit: 200,
  jacket: 150,
  dress: 100,
  kurta: 70,
  jeans: 80,
  tshirt: 40,
  blouse: 60,
  lehenga: 250,
  blanket: 180,
  bedsheet: 130,
  curtain: 150,
};

/**
 * Validate order creation payload.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateOrderPayload({ customerName, phone, garments }) {
  const errors = [];

  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    errors.push('customerName is required.');
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    errors.push('phone is required.');
  } else if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim())) {
    errors.push('phone must be a valid number (7–15 digits).');
  }

  if (!Array.isArray(garments) || garments.length === 0) {
    errors.push('garments must be a non-empty array.');
  } else {
    garments.forEach((g, i) => {
      if (!g.type || typeof g.type !== 'string') {
        errors.push(`garments[${i}].type is required.`);
      }
      if (!g.quantity || typeof g.quantity !== 'number' || g.quantity < 1) {
        errors.push(`garments[${i}].quantity must be a positive number.`);
      }
      // pricePerItem: use provided or fall back to price list
      const priceFromList = PRICE_LIST[g.type?.toLowerCase()];
      if (
        g.pricePerItem !== undefined &&
        (typeof g.pricePerItem !== 'number' || g.pricePerItem < 0)
      ) {
        errors.push(`garments[${i}].pricePerItem must be a non-negative number.`);
      }
      if (g.pricePerItem === undefined && !priceFromList) {
        errors.push(
          `garments[${i}].type "${g.type}" is not in the price list. Provide pricePerItem manually.`
        );
      }
    });
  }

  return errors.length ? { valid: false, errors } : { valid: true };
}

/**
 * Normalize garments — auto-fill pricePerItem from price list if missing.
 */
function normalizeGarments(garments) {
  return garments.map((g) => ({
    type: g.type.trim(),
    quantity: Number(g.quantity),
    pricePerItem:
      g.pricePerItem !== undefined
        ? Number(g.pricePerItem)
        : PRICE_LIST[g.type.toLowerCase()] || 0,
  }));
}

module.exports = { validateOrderPayload, normalizeGarments, PRICE_LIST };
