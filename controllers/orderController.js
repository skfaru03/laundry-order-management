const OrderModel = require('../models/orderModel');
const { validateOrderPayload, normalizeGarments } = require('../utils/validator');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * POST /api/orders
 * Create a new order
 */
const createOrder = asyncHandler(async (req, res) => {
  const { customerName, phone, garments } = req.body;

  // Guard: body must be a proper JSON object
  if (!req.body || typeof req.body !== 'object') {
    return sendError(res, 'Request body is missing or not valid JSON', 400);
  }

  // Run all validation checks before touching the DB
  const validation = validateOrderPayload({ customerName, phone, garments });
  if (!validation.valid) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  // Auto-fill prices from the price list where not provided
  const normalizedGarments = normalizeGarments(garments);

  const order = await OrderModel.create({ customerName, phone, garments: normalizedGarments });
  return sendSuccess(res, order, 'Order created successfully', 201);
});

/**
 * GET /api/orders
 * List orders — all filters are optional and combinable:
 *   ?status=RECEIVED
 *   ?customerName=ravi
 *   ?phone=9876
 *   ?garmentType=saree
 *   ?search=ravi       ← shorthand: matches name, phone, or garment
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, customerName, phone, garmentType, search } = req.query;

  if (status && !OrderModel.VALID_STATUSES.includes(status.toUpperCase())) {
    return sendError(
      res,
      `Invalid status "${status}". Must be one of: ${OrderModel.VALID_STATUSES.join(', ')}`,
      400
    );
  }

  const orders = await OrderModel.findAll({ status, customerName, phone, garmentType, search });
  return sendSuccess(res, orders, `${orders.length} order(s) found`);
});

/**
 * GET /api/orders/:id
 * Get a single order by its ID
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderModel.findById(id);

  if (!order) {
    return sendError(res, `Order with ID "${id}" not found`, 404);
  }

  return sendSuccess(res, order);
});

/**
 * PATCH /api/orders/:id/status
 * Update order status — forward only, one step at a time:
 *   RECEIVED → PROCESSING → READY → DELIVERED
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const FLOW = OrderModel.VALID_STATUSES;

  // Basic input checks
  if (!status) {
    return sendError(res, '"status" field is required in request body', 400);
  }
  if (typeof status !== 'string') {
    return sendError(res, '"status" must be a string', 400);
  }

  const newStatus = status.toUpperCase();
  if (!FLOW.includes(newStatus)) {
    return sendError(
      res,
      `Invalid status "${status}". Must be one of: ${FLOW.join(', ')}`,
      400
    );
  }

  // Fetch the current order so we can validate the transition
  const existing = await OrderModel.findById(id);
  if (!existing) {
    return sendError(res, `Order with ID "${id}" not found`, 404);
  }

  const currentIdx = FLOW.indexOf(existing.status);
  const newIdx     = FLOW.indexOf(newStatus);

  // Reject same-status or backward moves
  if (newIdx <= currentIdx) {
    return sendError(
      res,
      `Cannot change status from "${existing.status}" to "${newStatus}". Status can only move forward.`,
      422
    );
  }

  // Reject skipping a step (e.g. RECEIVED → READY)
  if (newIdx - currentIdx > 1) {
    const expected = FLOW[currentIdx + 1];
    return sendError(
      res,
      `Cannot skip status steps. "${existing.status}" must go to "${expected}" next.`,
      422
    );
  }

  const updated = await OrderModel.updateStatus(id, newStatus);
  return sendSuccess(res, updated, `Status updated: ${existing.status} → ${newStatus}`);
});

/**
 * DELETE /api/orders/:id
 * Permanently delete an order
 */
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await OrderModel.delete(id);

  if (!deleted) {
    return sendError(res, `Order with ID "${id}" not found`, 404);
  }

  return sendSuccess(res, null, 'Order deleted successfully');
});

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, deleteOrder };
