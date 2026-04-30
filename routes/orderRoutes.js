const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');

// POST   /api/orders          - Create a new order
router.post('/', createOrder);

// GET    /api/orders          - List all orders (filters: ?status=&search=)
router.get('/', getAllOrders);

// GET    /api/orders/:id      - Get a single order
router.get('/:id', getOrderById);

// PATCH  /api/orders/:id/status - Update status
router.patch('/:id/status', updateOrderStatus);

// DELETE /api/orders/:id      - Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
