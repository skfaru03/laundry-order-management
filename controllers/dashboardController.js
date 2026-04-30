const OrderModel = require('../models/orderModel');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * GET /api/dashboard
 * Returns aggregated stats: total orders, revenue, and counts per status.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await OrderModel.getStats();
  return sendSuccess(res, stats, 'Dashboard data fetched');
});

module.exports = { getDashboard };
