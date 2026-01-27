const express = require('express');
const router = express.Router();
const db = require('../models');
const { requireRole } = require('../middleware/roles');

// GET /users - list users (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const users = await db.User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'] });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /users/:id/role - update user role (admin only)
router.put('/:id/role', requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
