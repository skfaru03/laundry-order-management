const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Garment sub-schema (embedded inside each order)
// Each garment item stores its type, how many, and price per piece.
// ---------------------------------------------------------------------------
const garmentSchema = new mongoose.Schema(
  {
    type:         { type: String, required: true, trim: true },
    quantity:     { type: Number, required: true, min: 1 },
    pricePerItem: { type: Number, required: true, min: 0 },
  },
  { _id: false } // we don't need a separate _id for each garment
);

// ---------------------------------------------------------------------------
// Main Order schema
// ---------------------------------------------------------------------------
const orderSchema = new mongoose.Schema(
  {
    // Customer details
    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },

    // Array of garment line-items
    garments: { type: [garmentSchema], required: true },

    // Calculated at creation time: sum of (quantity × pricePerItem)
    totalAmount: { type: Number, required: true },

    // Order lifecycle — always starts at RECEIVED
    status: {
      type:    String,
      enum:    ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
      default: 'RECEIVED',
    },

    // 3 days from creation (set in the model layer, not here)
    estimatedDelivery: { type: String },
  },
  {
    // Mongoose automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Virtual field: expose Mongo's _id as "id" (string) so our API response
// stays consistent with the previous in-memory shape.
// ---------------------------------------------------------------------------
orderSchema.set('toJSON', {
  virtuals: true,         // include virtual "id" field
  versionKey: false,      // remove __v field
  transform(doc, ret) {
    delete ret._id;       // remove raw _id, "id" virtual takes its place
  },
});

module.exports = mongoose.model('Order', orderSchema);
