const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Product = require('./models/product');

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

function generateProductId(name, position) {
  return `${name.toLowerCase().replace(/\s+/g, '_')}_${position.toLowerCase().replace(/\s+/g, '_')}`;
}

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

app.patch('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { isScanned } = req.body;
  
    try {
      const updatedProduct = await Product.findByIdAndUpdate(id, { isScanned }, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(updatedProduct);
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ message: 'Error updating product', error: err.message });
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

app.patch('/api/products/reset', async (req, res) => {
    try {
        const result = await Product.updateMany({}, { isScanned: false });
        console.log(`Products reset: ${result.modifiedCount}`); // log the count of updated products
        res.status(200).json({
            message: 'All products reset to unscanned status',
            updatedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error resetting scan status:', error);
        res.status(500).json({ message: 'Error resetting scan status', error: error.message });
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
