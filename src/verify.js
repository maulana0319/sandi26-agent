#!/usr/bin/env node
// verify.js — READ-ONLY on-chain verifier for sandi26.ai claims.
// No wallet, no signing, no broadcast. Reads public BSC state and checks the
// evidence claims in ../evidence/EVIDENCE.md against the chain.
// Usage: node verify.js [--wallet 0x..] [--json]
'use strict';
const { ethers } = require('ethers');

const RPCS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-rpc.publicnode.com',
];
const _wi = process.argv.indexOf('--wallet');
const WALLET = (_wi >= 0 && process.argv[_wi + 1]) ? process.argv[_wi + 1] : '0x6C6eE6b986680CdfBea0f906Ecd2ced2a0649C37';
const JSON_OUT = process.argv.includes('--json');
const SCAN = 'https://bscscan.com';

// (label, contract, kind, extra) — kind: 'erc20' | 'erc721' | 'ownerOf' | 'balance'
const CHECKS = [
  // ERC-20 balances the agent holds (18 decimals unless noted)
  ['GOAT', '0x7e65aA61C10249A094cc42ccDd0F2c234DF987dC', 'erc20'],
  ['POWER', '0xc1886c95fcb19dbd5972ebdd4a0273adcff31fde', 'erc20'],
  ['MUSE', '0x4377ee76214B05Efc5b6344306d84704cbe30f53', 'erc20'],
  ['VEIN', '0xB5Bb50828eB449e7b27AaAd8F7e0CFc621347CB8', 'erc20'],
  ['VIRTUAL', '0xeBCB4C3c5813a7d6BAb9694258B57Aa2E043De2F', 'erc20'],
  ['PESI', '0x9AEFce1FC6aEb5A5E4051f5fA9fd9D54C4dA6EF5', 'erc20'],
  ['WNO', '0x8C969a4CD49E4774908e667702C3d7C3ece164D0', 'erc20'],
  ['LOOT', '0xe071F5AA90F211A0824e717f1569060193679Ce6', 'erc20'],
  ['BNBbaby', '0xD0079025a9Bb66a7a1de991De2E4326FABA35729', 'erc20'],
  ['KUMO', '0xdD3e0733E1Ced1f61C0C31b1DE7eE4E2C2bAc27E', 'erc20'],
  // ERC-721 holdings (balanceOf) + specific tokenIds the agent owns
  ['KIJIN', '0x625188954784D2f8c542FE8206050fF540Ae3B20', 'erc721'],
  ['Meow Cards', '0xb8164afefc53910d7a74cece15a60a9e0c86089e', 'erc721'],
  ['FORGE', '0x85294Fd5CffB964E318302B0C03C8f4Ae7BF2fe3', 'erc721'],
  ['PODS', '0x5A5Eff4e9C5bad00e97Cc33d6e6D26983509Eeb8', 'erc721'],
  ['ALCHEMYBIT', '0xca3a9fe5d50e38d0062ee0f0bcc82e1d7c68654f', 'erc721'],
  ['Agent Cards', '0x19f125dA1985033f102CA7746Cbd1F6f512CFACd', 'erc721'],
  ['ONLYAI', '0x156482AD3F0eebD8E3F70d494ebD1dA3F738f5Ba', 'erc721'],
  ['CALLSIGN', '0x4ebFd50398D9889A530F6DE326917BDEef4679f9', 'erc721'],
  ['SYMBOL NFT', '0x993C822E7d9bBC75aa6b5095bD90a011Ff38cF71', 'erc721'],
  ['GOAT NFT', '0xE7a548606eECB32a93B227411b6343B0399DC7C0', 'erc721'],
];
const OWNERS = [
  ['ALCHEMYBIT #502', '0xca3a9fe5d50e38d0062ee0f0bcc82e1d7c68654f', 502],
  ['KIJIN #2414', '0x625188954784D2f8c542FE8206050fF540Ae3B20', 2414],
  ['PODS #382', '0x5A5Eff4e9C5bad00e97Cc33d6e6D26983509Eeb8', 382],
  ['CALLSIGN #633', '0x4ebFd50398D9889A530F6DE326917BDEef4679f9', 633],
];
// Transactions the agent executed (receipt status re-checked live)
const TXS = [
  ['ALCHEMYBIT #502 mint', '0x398f4866747697fc1d8307c9cc62f7dfa90a42df6438b6bc47df66fe990b11a6'],
  ['PODS #382 mint', '0xdb24bd0a2cb312dc5f568c408c0faeb77eb7ad0405a1187aee9287ef608a3977'],
  ['GOAT win bonus claim', '0x4e6b441256fb8c893d13ce204ccea627b0ae31c1554dc04369ce011e6a0d931c'],
  ['CALLSIGN #633 mint', '0x6dffc25448d14391a87cabbd04f94049d3bcc5c297281b88206d6c0e0ad37a23'],
  ['CrossEyed #137 mint', '0xaf1d78ac43bee225d051302a3a9f9d0500a990b2d8ab50921115d60327e93162'],
  ['NEBULA claim (first fastmint success)', '0xbb48f4b1c6eadab2c64eaedbe8634a41faf86ec0f96f6bba3db765e79c561f1d'],
  ['KIJIN #2414 mint', '0x564e0dbb658d6dd44c85e15af8f6c083bd7922f95704af2583d25917bb94ce28'],
  ['Meow #812 mint', '0xab203b5b0ec0baaeb261cb7eae3979b0d9039906a5fe6ec4a7d38887d62326ff'],
  ['Meow #812 listing', '0x613c1be4f42dc7ee8c6318de6d4a25f8d6ed208fa380b63687f765fdf70afdb8'],
];

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function provider() {
  for (const u of RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(u, 56, { staticNetwork: true });
      await p.getBlockNumber();
      return p;
    } catch {}
  }
  throw new Error('no RPC reachable');
}

(async () => {
  const p = await provider();
  const out = { wallet: WALLET, block: await p.getBlockNumber(), bnb: null, balances: {}, owners: {}, txs: {} };
  out.bnb = ethers.formatEther(await p.getBalance(WALLET));
  for (const [label, addr, kind] of CHECKS) {
    try {
      const c = new ethers.Contract(addr, ABI, p);
      const bal = await c.balanceOf(WALLET);
      let txt = bal.toString();
      if (kind === 'erc20') {
        try { const d = await c.decimals(); txt = ethers.formatUnits(bal, d); } catch {}
        try { const s = await c.symbol(); out.balances[label] = `${txt} ${s}`; continue; } catch {}
      }
      out.balances[label] = txt;
    } catch (e) {
      out.balances[label] = 'READ-FAIL';
    }
  }
  for (const [label, addr, id] of OWNERS) {
    try {
      const c = new ethers.Contract(addr, ABI, p);
      const o = await c.ownerOf(id);
      out.owners[label] = o.toLowerCase() === WALLET.toLowerCase() ? `YES (${o})` : `NO (owner=${o})`;
    } catch (e) {
      out.owners[label] = 'READ-FAIL';
    }
  }
  for (const [label, hash] of TXS) {
    try {
      const r = await p.getTransactionReceipt(hash);
      out.txs[label] = r ? `status=${r.status === 1 ? 'SUCCESS' : 'REVERTED'} block=${r.blockNumber} gasUsed=${r.gasUsed} ${SCAN}/tx/${hash}` : 'NOT-FOUND';
    } catch (e) {
      out.txs[label] = 'READ-FAIL';
    }
  }
  if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); return; }
  console.log(`=== VERIFY sandi26.ai  ${WALLET}  (block ${out.block}) ===`);
  console.log(`BNB: ${out.bnb}`);
  console.log('-- token / NFT balances --');
  for (const [k, v] of Object.entries(out.balances)) console.log(`  ${k}: ${v}`);
  console.log('-- owned tokenIds --');
  for (const [k, v] of Object.entries(out.owners)) console.log(`  ${k}: ${v}`);
  console.log('-- executed transactions (receipts) --');
  for (const [k, v] of Object.entries(out.txs)) console.log(`  ${k}: ${v}`);
})().catch(e => { console.error('VERIFY ERR', e.message); process.exit(1); });
