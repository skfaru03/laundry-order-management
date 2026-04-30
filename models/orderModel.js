// ---------------------------------------------------------------------------
// orderModel.js
//
// Tries to use MongoDB (Mongoose) when available.
// Falls back to a simple in-memory array if MongoDB is not connected.
// This means the app works for demo/testing even without a running DB.
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');
const Order    = require('./orderSchema');
const { v4: uuidv4 } = require('uuid');

const VALID_STATUSES = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

// ── In-memory fallback store ─────────────────────────────────────────────────
let memoryStore = [];

// Returns true when Mongoose has an active connection
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function calcTotal(garments) {
  return garments.reduce((sum, g) => sum + g.quantity * g.pricePerItem, 0);
}

function deliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

// ── In-memory implementations ────────────────────────────────────────────────
const Memory = {
  create({ customerName, phone, garments }) {
    const order = {
      id: uuidv4(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      garments,
      totalAmount: calcTotal(garments),
      status: 'RECEIVED',
      estimatedDelivery: deliveryDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.push(order);
    return order;
  },

  findAll({ status, customerName, phone, garmentType, search } = {}) {
    let r = [...memoryStore];
    if (status)       r = r.filter(o => o.status === status.toUpperCase());
    if (customerName) r = r.filter(o => o.customerName.toLowerCase().includes(customerName.toLowerCase()));
    if (phone)        r = r.filter(o => o.phone.includes(phone.trim()));
    if (garmentType)  r = r.filter(o => o.garments.some(g => g.type.toLowerCase().includes(garmentType.toLowerCase())));
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.garments.some(g => g.type.toLowerCase().includes(q))
      );
    }
    return r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findById(id) {
    return memoryStore.find(o => o.id === id) || null;
  },

  updateStatus(id, status) {
    const order = memoryStore.find(o => o.id === id);
    if (!order) return null;
    order.status    = status.toUpperCase();
    order.updatedAt = new Date().toISOString();
    return order;
  },

  delete(id) {
    const idx = memoryStore.findIndex(o => o.id === id);
    if (idx === -1) return null;
    const [deleted] = memoryStore.splice(idx, 1);
    return deleted;
  },

  getStats() {
    const totalOrders  = memoryStore.length;
    const totalRevenue = memoryStore.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.totalAmount, 0);
    const ordersPerStatus = VALID_STATUSES.reduce((acc, s) => {
      acc[s] = memoryStore.filter(o => o.status === s).length;
      return acc;
    }, {});
    const recentOrders = [...memoryStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    return { totalOrders, totalRevenue, ordersPerStatus, recentOrders };
  },
};

// ── MongoDB implementations ──────────────────────────────────────────────────
const DB = {
  async create({ customerName, phone, garments }) {
    return Order.create({
      customerName, phone, garments,
      totalAmount: calcTotal(garments),
      estimatedDelivery: deliveryDate(),
    });
  },

  async findAll({ status, customerName, phone, garmentType, search } = {}) {
    const query = {};
    if (status)       query.status = status.toUpperCase();
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (phone)        query.phone = { $regex: phone.trim() };
    if (garmentType)  query['garments.type'] = { $regex: garmentType, $options: 'i' };
    if (search) {
      query.$or = [
        { customerName:    { $regex: search, $options: 'i' } },
        { phone:           { $regex: search } },
        { 'garments.type': { $regex: search, $options: 'i' } },
      ];
    }
    return Order.find(query).sort({ createdAt: -1 });
  },

  async findById(id) {
    return Order.findById(id);
  },

  async updateStatus(id, status) {
    return Order.findByIdAndUpdate(id, { status: status.toUpperCase() }, { new: true });
  },

  async delete(id) {
    return Order.findByIdAndDelete(id);
  },

  async getStats() {
    const [totalOrders, delivered, statusCounts, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.find({ status: 'DELIVERED' }, 'totalAmount'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);
    const totalRevenue    = delivered.reduce((s, o) => s + o.totalAmount, 0);
    const ordersPerStatus = VALID_STATUSES.reduce((acc, s) => {
      const found = statusCounts.find(x => x._id === s);
      acc[s] = found ? found.count : 0;
      return acc;
    }, {});
    return { totalOrders, totalRevenue, ordersPerStatus, recentOrders };
  },
};

// ── Unified OrderModel — picks DB or Memory automatically ────────────────────
const OrderModel = {
  async create(data)         { return isDbConnected() ? DB.create(data)         : Memory.create(data); },
  async findAll(filters)     { return isDbConnected() ? DB.findAll(filters)      : Memory.findAll(filters); },
  async findById(id)         { return isDbConnected() ? DB.findById(id)          : Memory.findById(id); },
  async updateStatus(id, s)  { return isDbConnected() ? DB.updateStatus(id, s)   : Memory.updateStatus(id, s); },
  async delete(id)           { return isDbConnected() ? DB.delete(id)            : Memory.delete(id); },
  async getStats()           { return isDbConnected() ? DB.getStats()            : Memory.getStats(); },
  VALID_STATUSES,
};

module.exports = OrderModel;
