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

exports.searchProducts = async (req, res) => {
  console.log("ENTRÓ AL CONTROLLER DE BÚSQUEDA");
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }

    // Divide la búsqueda en palabras individuales
    // Ej: "call duty moderno" -> ["call", "duty", "moderno"]
    const words = q.trim().split(/\s+/).filter(Boolean);

    // Cada palabra debe aparecer en alguno de los campos (name, description, tags)
    // No importa el orden en que el usuario las escriba
    const searchConditions = words.map((word) => ({
      $or: [
        { name: { $regex: word, $options: "i" } },
        { description: { $regex: word, $options: "i" } },
        { tags: { $regex: word, $options: "i" } },
      ],
    }));

    const products = await Product.find({ $and: searchConditions })
      .collation({ locale: "es", strength: 1 }) // ignora mayúsculas Y acentos (á = a)
      .limit(15)
      .lean();

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar productos" });
  }
};