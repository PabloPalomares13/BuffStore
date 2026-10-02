const Comment = require('../models/Comment');
const StoreFeedback = require('../models/StoreFeedback');

const TZ = 'America/Bogota';
const TREND_MONTHS = 6;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const round1 = (n) => Math.round(n * 10) / 10;

// GET /api/admin/reviews?rating=&search=&page=&limit=
// Lista global de reseñas de juegos. Para ELIMINAR se reutiliza el endpoint existente
// DELETE /api/reviews/:reviewId (ya permite admin y recalcula reviewsAvg/reviewsCount).
const listReviews = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const rating = parseInt(req.query.rating, 10);
    const search = String(req.query.search || '').trim();

    const filter = {};
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;
    if (search) filter.text = new RegExp(escapeRegex(search), 'i');

    const [reviews, total, summary] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'email fullName nickname')
        .populate('product', 'name')
        .lean(),
      Comment.countDocuments(filter),
      Comment.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ]),
    ]);

    res.json({
      reviews,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      summary: {
        total: summary[0]?.total || 0,
        average: summary[0] ? round1(summary[0].avg) : 0,
      },
    });
  } catch (error) {
    console.error('Error en listReviews:', error);
    res.status(500).json({ message: 'No se pudieron cargar las reseñas' });
  }
};

// GET /api/admin/feedback?limit=10
// Promedios, tendencia mensual y últimos comentarios del feedback de la tienda.
const getStoreFeedback = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (TREND_MONTHS - 1));

    const [averages, latest, trendAgg] = await Promise.all([
      StoreFeedback.getAverages(),
      StoreFeedback.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'email fullName nickname')
        .select('ratings comment createdAt user')
        .lean(),
      StoreFeedback.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $addFields: {
            overall: {
              $avg: ['$ratings.purchaseEase', '$ratings.deliverySpeed', '$ratings.paymentTrust'],
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TZ } },
            avg: { $avg: '$overall' },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Rellenar los meses sin feedback para que la gráfica no tenga huecos
    const byMonth = Object.fromEntries(trendAgg.map((t) => [t._id, t]));
    const trend = [];
    for (let i = TREND_MONTHS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trend.push({
        month: key,
        avg: byMonth[key] ? round1(byMonth[key].avg) : null,
        total: byMonth[key]?.total || 0,
      });
    }

    const overall = averages.total
      ? round1((averages.purchaseEase + averages.deliverySpeed + averages.paymentTrust) / 3)
      : 0;

    res.json({ averages: { ...averages, overall }, trend, latest });
  } catch (error) {
    console.error('Error en getStoreFeedback:', error);
    res.status(500).json({ message: 'No se pudo cargar el feedback de la tienda' });
  }
};

module.exports = { listReviews, getStoreFeedback };