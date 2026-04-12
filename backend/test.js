require('dotenv').config();
const enc = require('./src/utils/encryption');

console.log('=== 16-char HMAC Determinism Test ===');
var results = [];
for (var i = 0; i < 10; i++) { results.push(enc.hmacEncrypt('abcd@123')); }
console.log('Output:', results[0]);
console.log('Length:', results[0].length);
console.log('All 10 same:', results.every(function(x) { return x === results[0]; }) ? 'PASS' : 'FAIL');
console.log('Exactly 16 chars:', results[0].length === 16 ? 'PASS' : 'FAIL');

console.log('\n=== Different inputs give different outputs ===');
var a = enc.hmacEncrypt('abcd@123');
var b = enc.hmacEncrypt('xyz@456');
var c = enc.hmacEncrypt('Hello@123');
console.log('abcd@123  :', a);
console.log('xyz@456   :', b);
console.log('Hello@123 :', c);
console.log('All different:', (a !== b && b !== c && a !== c) ? 'PASS' : 'FAIL');
