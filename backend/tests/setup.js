require('dotenv').config();

// Enforce NODE_ENV=test
process.env.NODE_ENV = 'test';

const databaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

// DATABASE SAFETY GUARD
if (!testDatabaseUrl) {
  throw new Error(
    '[DATABASE SAFETY GUARD] Aborting tests! TEST_DATABASE_URL is not set. Tests delete data and must NEVER run against the development/production database.'
  );
}

if (databaseUrl && testDatabaseUrl.trim() === databaseUrl.trim()) {
  throw new Error(
    '[DATABASE SAFETY GUARD] Aborting tests! TEST_DATABASE_URL must differ from DATABASE_URL to prevent accidental data loss on real databases.'
  );
}

// Redirect runtime DATABASE_URL and DIRECT_URL to the test database for test runs
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = process.env.TEST_DIRECT_URL || testDatabaseUrl;
