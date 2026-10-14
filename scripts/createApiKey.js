import 'dotenv/config';
import crypto from 'crypto';
import process from 'process';
import pool from '../src/db/index.js';

async function main () {
  const label = process.argv[2] || 'default-client';
  const scopesArg = process.argv.find((arg) => arg.startsWith('--scopes='));
  const scopes = scopesArg ? scopesArg.replace('--scopes=', '').split(',') : ['events:read', 'events:write', 'artifacts:read'];

  const rawKey = crypto.randomBytes(32).toString('base64url');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  await pool.query(
    'INSERT INTO api_keys (key_hash, label, scopes) VALUES ($1, $2, $3)',
    [keyHash, label, scopes]
  );

  console.log('API key created for label:', label);
  console.log('Scopes:', scopes.join(', '));
  console.log('Save this key securely, it will not be shown again:');
  console.log(rawKey);

  await pool.end();
}

main().catch((err) => {
  console.error('Failed to create API key', err);
  process.exit(1);
});
