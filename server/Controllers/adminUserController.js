const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/Auditlog');


const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/users?search=&role=&status=&page=&limit=
const listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || '').trim();
    const { role, status } = req.query;

    const filter = {};

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ email: rx }, { fullName: rx }, { nickname: rx }];
      if (mongoose.Types.ObjectId.isValid(search) && search.length === 24) {
        filter.$or.push({ _id: search });
      }
    }
    if (['admin', 'user'].includes(role)) filter.role = role;
    if (status === 'blocked') filter.isBlocked = true;
    if (status === 'active') filter.isBlocked = { $ne: true };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('email fullName nickname role isBlocked avatarUrl createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map((u) => ({
        ...u,
        isBlocked: !!u.isBlocked,
        isSelf: String(u._id) === String(req.user._id),
      })),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('Error en listUsers:', error);
    res.status(500).json({ message: 'No se pudieron cargar los usuarios' });
  }
};

// PATCH /api/admin/users/:id/role   body: { role: 'admin' | 'user' }
const changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
    }

    const target = await User.findById(id).select('email role');
    if (!target) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (target.role === role) {
      return res.status(400).json({ message: `El usuario ya tiene el rol ${role}` });
    }

    const previous = target.role;
    await User.updateOne({ _id: id }, { role });

    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      target: target._id,
      targetEmail: target.email,
      action: 'role_change',
      from: previous,
      to: role,
    });

    res.json({ message: 'Rol actualizado', role });
  } catch (error) {
    console.error('Error en changeRole:', error);
    res.status(500).json({ message: 'No se pudo cambiar el rol' });
  }
};

// PATCH /api/admin/users/:id/block   body: { blocked: true | false }
const setBlocked = async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ message: 'El campo "blocked" debe ser true o false' });
    }
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ message: 'No puedes bloquearte a ti mismo' });
    }

    const target = await User.findById(id).select('email role isBlocked');
    if (!target) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (blocked && target.role === 'admin') {
      return res.status(400).json({
        message: 'Para bloquear a un administrador primero quítale el rol de admin',
      });
    }
    if (!!target.isBlocked === blocked) {
      return res.status(400).json({
        message: blocked ? 'El usuario ya está bloqueado' : 'El usuario no está bloqueado',
      });
    }

    await User.updateOne({ _id: id }, { isBlocked: blocked });

    await AuditLog.create({
      actor: req.user._id,
      actorEmail: req.user.email,
      target: target._id,
      targetEmail: target.email,
      action: blocked ? 'block' : 'unblock',
      from: blocked ? 'active' : 'blocked',
      to: blocked ? 'blocked' : 'active',
    });

    res.json({ message: blocked ? 'Usuario bloqueado' : 'Usuario desbloqueado', isBlocked: blocked });
  } catch (error) {
    console.error('Error en setBlocked:', error);
    res.status(500).json({ message: 'No se pudo actualizar el estado del usuario' });
  }
};

// GET /api/admin/audit?limit=10
const listAudit = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('actorEmail targetEmail action from to createdAt')
      .lean();
    res.json({ logs });
  } catch (error) {
    console.error('Error en listAudit:', error);
    res.status(500).json({ message: 'No se pudo cargar el historial' });
  }
};

module.exports = { listUsers, changeRole, setBlocked, listAudit };