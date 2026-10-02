const mongoose = require('mongoose');
const Report = require('../models/Report');
const { clearStatsCache } = require('./adminStatsController');

const STATUSES = ['open', 'in_review', 'closed'];
const TYPES = ['queja', 'reclamo', 'sugerencia', 'falla_producto', 'falla_sitio'];

// GET /api/admin/reports?status=&type=&page=&limit=
const listReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const { status, type } = req.query;

    const filter = {};
    if (STATUSES.includes(status)) filter.status = status;
    if (TYPES.includes(type)) filter.type = type;

    const [reports, total, grouped] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'email fullName nickname')
        .populate('relatedProductId', 'name')
        .populate('relatedOrderId', 'totals.total paymentStatus')
        .lean(),
      Report.countDocuments(filter),
      // Conteo por estado para los badges de las pestañas (ignora el filtro de estado)
      Report.aggregate([
        { $match: TYPES.includes(type) ? { type } : {} },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
    ]);

    const counts = { open: 0, in_review: 0, closed: 0 };
    grouped.forEach((g) => {
      counts[g._id] = g.n;
    });

    res.json({
      reports,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      counts,
    });
  } catch (error) {
    console.error('Error en listReports:', error);
    res.status(500).json({ message: 'No se pudieron cargar los reportes' });
  }
};

// PATCH /api/admin/reports/:id/status   body: { status }
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de reporte inválido' });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true }).select('status');
    if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });

    // El KPI "reportes pendientes" del dashboard debe reflejar el cambio al instante
    clearStatsCache();

    res.json({ message: 'Estado del reporte actualizado', status: report.status });
  } catch (error) {
    console.error('Error en updateReportStatus:', error);
    res.status(500).json({ message: 'No se pudo actualizar el reporte' });
  }
};

module.exports = { listReports, updateReportStatus };