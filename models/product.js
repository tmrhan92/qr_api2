const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  position: { type: String, required: true },
  qr: { type: String },
  scannedDate: { type: Date }, // لتخزين تاريخ المسح
  isScanned: { type: Boolean, default: false },
});

// لمنع التكرار
productSchema.index({ name: 1, position: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
