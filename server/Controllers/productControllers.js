const Product = require('../models/Product');

const MAX_FEATURED = 5;

exports.getFeaturedProducts = async (req, res) => {
  console.log("ENTRÓ AL CONTROLLER");
  try {
    const products = await Product.find({ featured: true })
      // _id como desempate: si varios tienen el mismo displayOrder el orden no cambia entre peticiones
      .sort({ displayOrder: 1, _id: 1 })
      .limit(MAX_FEATURED)
      .lean();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos destacados' });
  }
};

// PATCH /api/products/:id/featured
// Body: { featured: true|false, replaceId?: "<id del producto destacado a reemplazar>" }
exports.setFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured, replaceId } = req.body;

    if (typeof featured !== 'boolean') {
      return res.status(400).json({ message: 'El campo "featured" debe ser true o false' });
    }

    const product = await Product.findById(id).select('_id featured').lean();
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const update = { featured };

    // Solo hay que validar el cupo cuando se pasa de apagado a encendido
    if (featured && !product.featured) {
      const currentFeatured = await Product.find({ featured: true })
        .select('_id name displayOrder')
        .sort({ displayOrder: 1, _id: 1 })
        .lean();

      if (currentFeatured.length >= MAX_FEATURED) {
        // Cupo lleno y sin producto a reemplazar: el frontend abre la alerta de reemplazo
        if (!replaceId) {
          return res.status(409).json({
            message: `Ya hay ${MAX_FEATURED} productos destacados`,
            featured: currentFeatured.map(({ _id, name }) => ({ _id, name })),
          });
        }

        const toReplace = currentFeatured.find((p) => String(p._id) === String(replaceId));
        if (!toReplace) {
          return res.status(400).json({ message: 'El producto a reemplazar no está destacado' });
        }

        // Primero se quita el anterior: si algo falla a mitad, quedan 4 y no 6
        await Product.updateOne({ _id: toReplace._id }, { $set: { featured: false } });

        // El nuevo ocupa el mismo lugar que tenía el reemplazado
        update.displayOrder = toReplace.displayOrder;
      } else {
        // Hay cupo: se agrega al final de los destacados
        const maxOrder = currentFeatured.reduce((max, p) => Math.max(max, p.displayOrder || 0), 0);
        update.displayOrder = maxOrder + 1;
      }
    }

    // updateOne evita validar el documento completo (enum de platforms, etc.)
    await Product.updateOne({ _id: id }, { $set: update });

    const featuredIds = (await Product.find({ featured: true }).select('_id').lean()).map((p) =>
      String(p._id)
    );
    return res.json({ message: 'Actualizado', featuredIds });
  } catch (err) {
    console.error('Error en setFeatured:', err);
    return res.status(500).json({ message: 'Error al actualizar el producto destacado' });
  }
};

// Vocales con todas sus variantes acentuadas, para que "accion" encuentre "acción"
const ACCENT_MAP = {
  a: 'aáàâãäAÁÀÂÃÄ',
  e: 'eéèêëEÉÈÊË',
  i: 'iíìîïIÍÌÎÏ',
  o: 'oóòôõöOÓÒÔÕÖ',
  u: 'uúùûüUÚÙÛÜ',
};

// Convierte lo que escribe el usuario en un patrón regex seguro e insensible a acentos.
// Escapa los caracteres especiales (evita errores y ataques ReDoS con entradas como "(a+)+$").
const buildSearchPattern = (word) =>
  [...word.normalize('NFC')]
    .map((char) => {
      const lower = char.toLowerCase();
      // La ñ es una letra distinta de la n en español, así que se conserva tal cual
      const base = lower === 'ñ' ? lower : lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (ACCENT_MAP[base]) return `[${ACCENT_MAP[base]}]`;
      return base.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
    })
    .join('');

exports.searchProducts = async (req, res) => {
  console.log("ENTRÓ AL CONTROLLER DE BÚSQUEDA");
  try {
    // String() protege contra ?q[]=... (llegaría como arreglo) y se limita el largo de la búsqueda
    const q = String(req.query.q || '').trim().slice(0, 100);

    if (!q) {
      return res.status(200).json([]);
    }

    // Divide la búsqueda en palabras individuales (máx. 6)
    // Ej: "call duty moderno" -> ["call", "duty", "moderno"]
    const words = q.split(/\s+/).filter(Boolean).slice(0, 6);

    // Cada palabra debe aparecer en alguno de los campos (name, description, tags)
    // No importa el orden en que el usuario las escriba
    const searchConditions = words.map((word) => {
      const pattern = buildSearchPattern(word);
      return {
        $or: [
          { name: { $regex: pattern, $options: "i" } },
          { description: { $regex: pattern, $options: "i" } },
          { tags: { $regex: pattern, $options: "i" } },
        ],
      };
    });

    const products = await Product.find({ $and: searchConditions })
      .limit(15)
      .lean();

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar productos" });
  }
};

