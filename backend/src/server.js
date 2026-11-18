require('dotenv').config();

const app = require('./app');
const prisma = require('./lib/prisma');

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`BrandCheck backend listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
