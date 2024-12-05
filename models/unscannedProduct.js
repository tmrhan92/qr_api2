// const mongoose = require('mongoose');

// // الاتصال بـ MongoDB
// mongoose.connect('mongodb://localhost:27017/productsdb')
//     .then(() => console.log('MongoDB connected successfully'))
//     .catch(err => console.error('MongoDB connection error:', err));


// // تعريف الـ Schema للمنتجات غير الممسوحة
// const unscannedProductSchema = new mongoose.Schema({
// _id: { type: String, required: true }, // استخدام String لـ ID
// name: { type: String, required: true },
// position: { type: String, required: true },
// qr: { type: String },
// isScanned: { type: Boolean, default: false },

// });

// // إنشاء النموذج
// const UnscannedProduct = mongoose.model('UnscannedProduct', unscannedProductSchema);
// module.exports = UnscannedProduct;
