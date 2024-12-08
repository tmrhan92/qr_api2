const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const Product = require('./models/product');
const User = require('./models/user');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// إعداد EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


mongoose.connect('mongodb://localhost:27017/productsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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


function generateProductId(name, position) {
  return `${name.toLowerCase().replace(/\s+/g, '_')}_${position.toLowerCase().replace(/\s+/g, '_')}`;
}




// نقاط النهاية الأخرى (إضافة، تعديل، حذف)
app.post('/admin/products', async (req, res) => {
  const { name, position } = req.body;

  if (!name || !position) {
      return res.status(400).json({ message: 'Name and position are required' });
  }

  try {
      const _id = generateProductId(name, position); // استخدم دالة المعرف

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
app.post('/api/locations', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Location name is required' });
  }

  try {
    const location = new Location({ name });
    await location.save();
    res.status(201).json(location);
  } catch (err) {
    console.error('Error adding location:', err);
    res.status(500).json({ message: 'Error adding location', error: err.message });
  }
});


// نقطة النهاية للتسجيل
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hash });
  await user.save();
  res.status(201).send({ message: 'تم تسجيل المستخدم' });
});

// نقطة النهاية لتسجيل الدخول
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).send({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  const token = jwt.sign({ id: user._id }, 'your_jwt_secret');
  res.send({ token });
});

// جلب جميع المواقع
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json(locations);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Error fetching locations', error: err.message });
  }
});


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

// نموذج للموقع
const Location = require('./models/location'); // تأكد من أن لديك نموذج للموقع

// نهاية لإضافة موقع جديد
app.post('/admin/locations', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'اسم الموقع مطلوب' });
    }

    try {
        const location = new Location({ name });
        await location.save();
        res.redirect('/admin'); // إعادة توجيه المستخدم إلى لوحة الإدارة بعد النجاح
    } catch (err) {
        console.error('خطأ في إضافة الموقع:', err);
        res.status(500).json({ message: 'خطأ في إضافة الموقع', error: err.message });
    }
});

app.patch('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { isScanned } = req.body;

  try {
      const updatedProduct = await Product.findByIdAndUpdate(
          id,
          { isScanned, scannedDate: isScanned ? new Date() : null, $inc: { scanCount: isScanned ? 1 : 0 } },
          { new: true }
      );
      if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(updatedProduct);
  } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

app.get('/api/scanned-count', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // تعيين الوقت لبدء اليوم

  try {
      const count = await Product.countDocuments({
          scannedDate: { $gte: today } // عد المنتجات التي تم مسحها اليوم
      });
      res.status(200).json({ scannedCount: count });
  } catch (error) {
      console.error('Error fetching scanned count:', error);
      res.status(500).json({ message: 'Error fetching scanned count', error });
  }
});


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

// Reset all products to unscanned status
app.post('/api/products/reset', async (req, res) => {
  try {
      const result = await Product.updateMany({}, { isScanned: false, scannedDate: null, scanCount: 0 });
      console.log(`Products reset: ${result.modifiedCount}`); // سجل عدد المنتجات التي تم إعادة تعيينها
      res.status(200).json({
          message: 'جميع المنتجات تم إعادة تعيينها إلى حالة غير ممسوحة',
          updatedCount: result.modifiedCount,
      });
  } catch (error) {
      console.error('Error resetting scan status:', error);
      res.status(500).json({ message: 'خطأ في إعادة تعيين حالة المسح', error: error.message });
  }
});

app.get('/api/unscanned-products', async (req, res) => {
  try {
    const products = await Product.find({ isScanned: false });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching unscanned products:', error);
    res.status(500).json({ message: 'Error fetching unscanned products', error });
  }
});

const HOST = '192.168.43.181';
app.listen(port, HOST, () => {
  console.log(`Server running on http://${HOST}:${port}`);
});