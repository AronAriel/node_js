const db = require('../models');

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function requireOwnerOrAdmin(modelName, idParam = 'id', ownerField = 'authorId') {
  return async (req, res, next) => {
    try {
      const Model = db[modelName];
      if (!Model) return res.status(500).json({ error: 'Server misconfiguration' });

      const id = req.params[idParam];
      const resource = await Model.findByPk(id);
      if (!resource) return res.status(404).json({ error: `${modelName} not found` });

      const requesterId = req.user?.id;
      const requesterRole = req.user?.role;

      if (String(requesterId) === String(resource[ownerField]) || requesterRole === 'admin') {
        // attach the loaded resource for handler convenience
        req.resource = resource;
        return next();
      }

      return res.status(403).json({ error: 'Not authorized' });
    } catch (err) {
      console.error('requireOwnerOrAdmin error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = {
  requireRole,
  requireOwnerOrAdmin
};
