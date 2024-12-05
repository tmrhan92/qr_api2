const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Product = require('./models/product'); 

// إعداد الخادم
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/productsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// إضافة منتج جديد
app.post('/api/products', async (req, res) => {
    const { _id, name, position, qr } = req.body;
  
    if (!_id || !name || !position) {
      return res.status(400).json({ message: 'معرف المنتج، الاسم والموقع مطلوبة' });
    }
  
    try {
      const existingProduct = await Product.findOne({ name, position });
      if (existingProduct) {
        return res.status(409).json({ message: 'Product already exists with this name and position' });
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

// جلب جميع المنتجات
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

// تحديث حالة المسح للمنتج
app.patch('/api/products/:id', async (req, res) => {
    const { _id } = req.params;
    const { isScanned } = req.body;
  
    try {
      const updatedProduct = await Product.findByIdAndUpdate(_id, { isScanned }, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ message: 'المنتج غير موجود، تحقق من المعرف (_id)' });
      }
      res.status(200).json(updatedProduct);
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ message: 'خطأ أثناء تحديث المنتج', error: err.message });
    }
});

// حذف منتج بواسطة ID
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// إعادة تعيين حالة جميع المنتجات
app.patch('/api/products/reset', async (req, res) => {
  try {
    const result = await Product.updateMany({}, { isScanned: false });
    res.status(200).json({
      message: 'All products reset to unscanned status',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error resetting scan status:', error);
    res.status(500).json({ message: 'Error resetting scan status', error: error.message });
  }
});

// جلب جميع المنتجات غير الممسوحة
app.get('/api/unscanned-products', async (req, res) => {
  try {
    const products = await Product.find({ isScanned: false });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching unscanned products:', error);
    res.status(500).json({ message: 'Error fetching unscanned products', error });
  }
});

// بدء التشغيل
const HOST = '192.168.43.181'; 
app.listen(port, HOST, () => {
console.log(`Server running on http://${HOST}:${port}`);
});