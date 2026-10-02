const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Report = require('../models/Report');

const DAYS = 30;
const TZ = 'America/Bogota';

// Caché en memoria: evita repetir las agregaciones en cada visita al dashboard.
// (Render corre una sola instancia, así que no hace falta Redis.)
const CACHE_TTL_MS = 2 * 60 * 1000;
let cache = { data: null, at: 0 };
const clearStatsCache = () => {
  cache = { data: null, at: 0 };
};

// Devuelve 'YYYY-MM-DD' en zona horaria de Colombia
const toDayKey = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const fresh = cache.data && Date.now() - cache.at < CACHE_TTL_MS;
    if (fresh && req.query.refresh !== '1') {
      return res.json(cache.data);
    }

    const since = new Date();
    since.setDate(since.getDate() - (DAYS - 1));
    since.setHours(0, 0, 0, 0);

    // Una orden cuenta como venta cuando el pago está confirmado
    const paidMatch = { paymentStatus: 'paid' };

    const [
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingReports,
      revenueAgg,
      unitsAgg,
      dailyAgg,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Report.countDocuments({ status: 'open' }),

      // Ingresos totales y número de órdenes pagadas
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, revenue: { $sum: '$totals.total' }, orders: { $sum: 1 } } },
      ]),

      // Unidades vendidas (suma de quantity de cada producto en órdenes pagadas)
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: '$products' },
        { $group: { _id: null, units: { $sum: '$products.quantity' } } },
      ]),

      // Ingresos por día de los últimos 30 días
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $ifNull: ['$paidAt', '$createdAt'] },
                timezone: TZ,
              },
            },
            revenue: { $sum: '$totals.total' },
            orders: { $sum: 1 },
          },
        },
      ]),

      // Últimas órdenes
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('customer.fullName customer.email totals.total paymentStatus orderStatus createdAt')
        .lean(),
    ]);

    // Rellenar con 0 los días sin ventas para que la gráfica no tenga huecos
    const byDay = Object.fromEntries(dailyAgg.map((d) => [d._id, d]));
    const revenueByDay = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDayKey(d);
      revenueByDay.push({
        date: key,
        revenue: byDay[key]?.revenue || 0,
        orders: byDay[key]?.orders || 0,
      });
    }

    const revenue = revenueAgg[0]?.revenue || 0;
    const paidOrders = revenueAgg[0]?.orders || 0;

    const payload = {
      kpis: {
        totalUsers,
        totalProducts,
        unitsSold: unitsAgg[0]?.units || 0,
        revenue,
        paidOrders,
        averageTicket: paidOrders ? Math.round(revenue / paidOrders) : 0,
        pendingOrders,
        pendingReports,
      },
      revenueByDay,
      recentOrders,
    };

    cache = { data: payload, at: Date.now() };
    res.json(payload);
  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({ message: 'No se pudieron cargar las estadísticas' });
  }
};

module.exports = { getStats, clearStatsCache };