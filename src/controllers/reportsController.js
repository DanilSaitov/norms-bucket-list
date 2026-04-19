// Reports DB Controller
const prisma = require('../config/database');

async function getReports(req, res) {
}

async function createReports(req, res) {
    const {
        user,
        issue_type,
        description,
    } = req.body;

    if (!description||!issue_type) {
      return res.status(400).json({ error: 'must have description and issue_type' });
    }
}
