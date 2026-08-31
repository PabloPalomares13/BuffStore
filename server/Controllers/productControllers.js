const Product = require('../models/Product');

exports.getFeaturedProducts = async (req, res) => {
      console.log("ENTRÓ AL CONTROLLER");
  try {
    const products = await Product.find({ featured: true })
      .sort({ displayOrder: 1 })
      .limit(5)
      .lean();
    res.json(products);
  } catch (err) {
     console.error(err); 
    res.status(500).json({ error: 'Error al obtener productos destacados' });
  }
};