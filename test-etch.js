/**
 * Test script to verify testnet4 patch works for etching
 */

const { applyTestnet4Patch } = require('./src/lib/runes-testnet4-patch.ts');
const { init, etch } = require('bc-runes-js');

require('dotenv').config({ path: '.env.local' });

async function testEtch() {
  console.log('🧪 Testing testnet4 patch for etch...');

  // Apply the testnet4 patch
  applyTestnet4Patch();

  const adminWif = process.env.RUNES_ADMIN_WIF;
  const adminAddress = process.env.RUNES_ADMIN_ADDRESS;
  const feePerVByte = parseInt(process.env.RUNES_FEE_PER_VBYTE || '300');

  if (!adminWif || !adminAddress) {
    console.error('❌ Admin wallet not configured');
    return;
  }

  console.log(`📍 Admin address: ${adminAddress}`);

  // Initialize bc-runes-js
  init({
    taprootAddress: adminAddress,
    wif: adminWif,
    feePerVByte: feePerVByte
  });

  try {
    console.log('🪙 Attempting to etch AIBUBU•COIN...');

    const etchResult = await etch({
      name: 'AIBUBU•COIN',
      symbol: '🐣',
      amount: 1000000,
      cap: 1000000,
      divisibility: 0
    });

    console.log('✅ Etch successful!', etchResult);

    const runeId = `${etchResult.blockHeight || etchResult.blockNumber}:${etchResult.txIndex}`;
    console.log(`🆔 Rune ID: ${runeId}`);

  } catch (error) {
    console.error('❌ Etch failed:', error.message);
    console.error('Full error:', error);
  }
}

testEtch().catch(console.error);