// Database configuration file
// This creates a single Prisma Client instance that's reused across the app
// Prevents issues with too many database connections

const { PrismaClient } = require('@prisma/client');

// Create single instance
const prisma = new PrismaClient();

module.exports = prisma;
