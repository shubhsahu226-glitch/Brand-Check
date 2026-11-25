const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Warm up Prisma connection pool on startup to prevent cold-start query drops
if (process.env.NODE_ENV !== 'test') {
  prisma
    .$connect()
    .then(() => {
      console.log('✓ Database connection pool warmed up and ready');
    })
    .catch((err) => {
      console.warn('Database warm-up note (will reconnect on query):', err.message);
    });
}

module.exports = prisma;
