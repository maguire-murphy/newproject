const crypto = require('crypto');

console.log('======================================');
console.log('🔐 Generated JWT Secrets:');
console.log('======================================');
console.log('');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('');
console.log('📋 Copy these to your .env file!');
console.log('======================================');