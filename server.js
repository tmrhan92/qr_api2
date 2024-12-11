const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// النماذج
const Product = require('./models/product');
const User = require('./models/user');
const Location = require('./models/location'); // تأكد من وجود هذا الملف

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // يستمع على جميع العناوين

// الإعدادات الوسيطة
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// إعداد EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// الاتصال بقاعدة البيانات
const mongoUri = process.env.MONGO_URI; // قراءة رابط الاتصال من متغير البيئة

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// الدالة لإنشاء معرف المنتج
function generateProductId(name, position) {
  return `${name.toLowerCase().replace(/\s+/g, '_')}_${position.toLowerCase().replace(/\s+/g, '_')}`;
}

// رابط الجذر
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// واجهة الإدارة
app.get('/admin', async (req, res) => {
  try {
    const products = await Product.find();
    const locations = await Location.find(); // جلب المواقع
    res.render('admin', { products, locations }); // إرسال المواقع إلى الواجهة
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

// نقاط النهاية الأخرى (إضافة، تعديل، حذف)
app.post('/admin/products', async (req, res) => {
  const { name, position } = req.body;

  if (!name || !position) {
    return res.status(400).json({ message: 'Name and position are required' });
  }

  try {
    const _id = generateProductId(name, position);

    const existingProduct = await Product.findOne({ _id });
    if (existingProduct) {
      return res.status(409).json({ message: 'Product already exists with this ID' });
    }

    const product = new Product({
      _id,
      name,
      position,
      qr: JSON.stringify({ productName: name, productPosition: position, _id }),
    });

    await product.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
});

// حذف منتج
app.post('/admin/products/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// إضافة موقع جديد
app.post('/admin/locations', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'اسم الموقع مطلوب' });
  }

  try {
    const location = new Location({ name });
    await location.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('خطأ في إضافة الموقع:', err);
    res.status(500).json({ message: 'خطأ في إضافة الموقع', error: err.message });
  }
});

// نقاط نهاية للمنتجات
app.post('/api/products', async (req, res) => {
  const { name, position } = req.body;

  if (!name || !position) {
    return res.status(400).json({ message: 'Name and position are required' });
  }

  try {
    const _id = generateProductId(name, position);

    const existingProduct = await Product.findOne({ _id });
    if (existingProduct) {
      return res.status(409).json({ message: 'Product already exists with this ID' });
    }

    const product = new Product({
      _id,
      name,
      position,
      qr: JSON.stringify({ productName: name, productPosition: position, _id }),
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

// تشغيل الخادم
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
