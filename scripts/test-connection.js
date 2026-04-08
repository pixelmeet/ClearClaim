/**
 * Diagnostic tool to test MongoDB Atlas connectivity
 * Run with: node scripts/test-connection.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

console.log('🚀 Starting Database Diagnosis...');
console.log('---------------------------------');

if (!uri) {
  console.error('❌ MONGODB_URI is missing from .env.local');
  process.exit(1);
}

console.log('📡 Testing DNS resolution and Connection...');
console.log(`🔗 Target: ${uri.split('@')[1] || uri}`); // Mask credentials

async function test() {
  try {
    const start = Date.now();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    const end = Date.now();
    console.log(`✅ SUCCESS! Connected in ${end - start}ms`);
    console.log('🔒 Database reachable and credentials verified.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ CONNECTION FAILED');
    console.log('---------------------------------');
    console.log(`Error Message: ${err.message}`);
    console.log(`Error Code: ${err.code || 'N/A'}`);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 DIAGNOSIS: IP Whitelist Blocked');
      console.log('Atlas is rejecting your connection. Your computer\'s IP address');
      console.log('is likely not added to the "Network Access" list in MongoDB Atlas.');
    } else if (err.message.includes('Authentication failed')) {
      console.log('\n🔍 DIAGNOSIS: Invalid Credentials');
      console.log('The username or password in your MONGODB_URI is incorrect.');
    } else if (err.message.includes('querySrv')) {
      console.log('\n🔍 DIAGNOSIS: DNS Issue');
      console.log('Your ISP or firewall is blocking SRV records. Try using a VPN or');
      console.log('different DNS (like 8.8.8.8) or use a non-SRV connection string.');
    }
    
    console.log('\n👉 HOW TO FIX:');
    console.log('1. Go to cloud.mongodb.com');
    console.log('2. Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0)');
    console.log('3. Wait 1 minute and try again.');
    
    process.exit(1);
  }
}

test();
