const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Favorite = require('../models/Favorites');
const Report = require('../models/Report');
 
// IMPORTANTE: cada handler vuelve a chequear req.chatRole / req.chatUser.
// Nunca confiamos en que Gemini solo va a pedir lo que le corresponde a su
// rol; la barrera de seguridad real está aquí, igual que en tus rutas REST.
 
async function getProducts(args = {}) {
  const limit = Math.min(Number(args.limit) || 10, 20);
  const filter = {};
 
  if (args.search && args.search.trim() !== '') {
    const words = args.search.trim().split(/\s+/).filter(Boolean);
    filter.$and = words.map((word) => ({
      $or: [
        { name: { $regex: word, $options: 'i' } },
        { description: { $regex: word, $options: 'i' } },
        { tags: { $regex: word, $options: 'i' } },
        { category: { $regex: word, $options: 'i' } }
      ]
    }));
  }
 
  const products = await Product.find(filter)
    .select('name price stock category tags platforms description featured')
    .limit(limit)
    .lean();
 
  return { count: products.length, products };
}
 
async function createProduct(args, req) {
  if (req.chatRole !== 'admin') return { error: 'No autorizado: solo un administrador puede crear productos.' };
  const product = await Product.create(args);
  return { product };
}
 
async function updateProduct(args, req) {
  if (req.chatRole !== 'admin') return { error: 'No autorizado: solo un administrador puede editar productos.' };
  if (!args.productId) return { error: 'Falta el productId.' };
 
  const product = await Product.findByIdAndUpdate(args.productId, args.updates || {}, { new: true });
  if (!product) return { error: 'No se encontró un producto con ese ID.' };
  return { product };
}
 
async function deleteProduct(args, req) {
  if (req.chatRole !== 'admin') return { error: 'No autorizado: solo un administrador puede eliminar productos.' };
  if (!args.productId) return { error: 'Falta el productId.' };
 
  const product = await Product.findByIdAndDelete(args.productId);
  if (!product) return { error: 'No se encontró un producto con ese ID.' };
  return { deleted: true, productId: args.productId };
}
 
async function getOrders(args = {}, req) {
  if (req.chatRole !== 'admin') return { error: 'No autorizado: solo un administrador puede consultar órdenes.' };
 
  const filter = {};
  if (args.status) filter.status = args.status;
  const limit = Math.min(Number(args.limit) || 10, 20);
 
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('user products totals status paymentStatus orderStatus createdAt')
    .lean();
 
  return { count: orders.length, orders };
}
 
async function getUsers(args = {}, req) {
  if (req.chatRole !== 'admin') return { error: 'No autorizado: solo un administrador puede consultar usuarios.' };
 
  const filter = {};
  if (args.role) filter.role = args.role;
  const limit = Math.min(Number(args.limit) || 10, 20);
 
  const users = await User.find(filter).select('email role createdAt').limit(limit).lean();
  return { count: users.length, users };
}
 
async function getMyOrders(args, req) {
  if (!req.chatUser) return { error: 'Necesitas iniciar sesión para ver tu historial de compras.' };
 
  const orders = await Order.find({ user: req.chatUser._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('products totals status orderStatus createdAt')
    .lean();
 
  return { count: orders.length, orders };
}
 
async function getMyFavorites(args, req) {
  if (!req.chatUser) return { error: 'Necesitas iniciar sesión para ver tus favoritos.' };
 
  const favorites = await Favorite.find({ userId: req.chatUser._id })
    .populate('productId', 'name price category tags')
    .lean();
 
  return { count: favorites.length, favorites };
}
 
async function createReport(args, req) {
  if (!req.chatUser) return { error: 'Necesitas iniciar sesión para enviar un reporte.' };
  if (!args.type || !args.message) return { error: 'Falta el tipo o el mensaje del reporte.' };
 
  const report = await Report.create({
    user: req.chatUser._id,
    type: args.type,
    message: args.message,
    relatedProductId: args.relatedProductId || undefined
  });
 
  // Nota: aquí conectas tu envío de correo (ver mensaje después del código)
  // con el correo de req.chatUser.email + un resumen del chat.
 
  return { report: { id: report._id, type: report.type, status: report.status } };
}
 
const HANDLERS = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getUsers,
  getMyOrders,
  getMyFavorites,
  createReport
};
 
async function executeTool(name, args, req) {
  const handler = HANDLERS[name];
  if (!handler) return { error: `Función desconocida: ${name}` };
 
  try {
    return await handler(args || {}, req);
  } catch (error) {
    console.error(`Error ejecutando la tool "${name}":`, error);
    return { error: 'Error interno al ejecutar la acción.' };
  }
}
 
module.exports = { executeTool };