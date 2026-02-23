// Traditions DB controller

const prisma = require('../config/database');

async function traditionsSearch(req, res) {
  try {
      console.log(req.search);
    const traditions = await prisma.traditions.findMany({
      where: { 
          OR [title { contains : req.search }, description { contains : req.search }]
      }
    });

    if (!traditions) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ traditions });

  } catch (error) {
    console.error('Get traditions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
    traditionsSearch,
};
