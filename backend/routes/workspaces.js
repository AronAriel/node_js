const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/', async (req, res) => {
  try {
    const workspaces = await db.Workspace.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }

  try {
    const workspace = await db.Workspace.create({
      name: name.trim()
    });
    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

router.put('/:id', async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }

  try {
    const workspace = await db.Workspace.findByPk(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    workspace.name = name.trim();
    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const workspace = await db.Workspace.findByPk(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const articleCount = await db.Article.count({
      where: { workspaceId: req.params.id }
    });

    if (articleCount > 0) {
      return res.status(400).json({ error: 'Cannot delete workspace with existing articles' });
    }

    await workspace.destroy();
    res.json({ id: workspace.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

module.exports = router;
