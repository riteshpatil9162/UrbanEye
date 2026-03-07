/**
 * cron.js — UrbanEye scheduled tasks
 *
 * Run standalone:  node cron.js
 * Render Cron Job: node cron.js   (schedule set in Render dashboard)
 *
 * Tasks performed:
 *   1. Keep-alive  — GET /api/health so Render free instance doesn't spin down
 *   2. Escalate    — mark issues "pending" for >48 h as high-priority (log only)
 *   3. Daily stats — print a summary of issue counts by status to stdout (Render logs)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios    = require('axios');

const MONGO_URI   = process.env.MONGO_URI;
const SERVER_URL  = process.env.SERVER_URL || 'https://urbaneye-server.onrender.com';

// ── 1. Keep-alive ping ────────────────────────────────────────────────────────
async function keepAlive() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/health`, { timeout: 10000 });
    console.log(`[keep-alive] ${new Date().toISOString()} — status: ${res.data.status}`);
  } catch (err) {
    console.error(`[keep-alive] FAILED — ${err.message}`);
  }
}

// ── 2. Escalate stale pending issues (>48 h) ─────────────────────────────────
async function escalateStaleIssues() {
  const Issue = require('./models/Issue');
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

  const stale = await Issue.find({
    status: 'pending',
    createdAt: { $lt: cutoff },
  }).select('_id title area createdAt');

  if (stale.length === 0) {
    console.log('[escalate] No stale pending issues found.');
    return;
  }

  console.log(`[escalate] ${stale.length} issue(s) pending for >48 h:`);
  stale.forEach((i) => {
    const hoursOld = Math.round((Date.now() - i.createdAt) / 3600000);
    console.log(`  • [${i.area}] "${i.title}" — ${hoursOld}h old (id: ${i._id})`);
  });
}

// ── 3. Daily stats summary ────────────────────────────────────────────────────
async function dailyStats() {
  const Issue = require('./models/Issue');
  const User  = require('./models/User');

  const statuses = ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'];
  const counts = await Promise.all(
    statuses.map((s) => Issue.countDocuments({ status: s }))
  );

  const total        = counts.reduce((a, b) => a + b, 0);
  const resolved     = counts[statuses.indexOf('resolved')];
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';

  const totalUsers   = await User.countDocuments();
  const totalWorkers = await User.countDocuments({ role: 'worker' });

  console.log('─'.repeat(48));
  console.log(`[daily-stats] ${new Date().toISOString()}`);
  console.log(`  Total issues   : ${total}`);
  statuses.forEach((s, i) => {
    console.log(`  ${s.padEnd(14)}: ${counts[i]}`);
  });
  console.log(`  Resolution rate: ${resolutionRate}%`);
  console.log(`  Total users    : ${totalUsers}  (workers: ${totalWorkers})`);
  console.log('─'.repeat(48));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n[cron] UrbanEye cron started — ${new Date().toISOString()}`);

  // Always ping first (works even without DB)
  await keepAlive();

  if (!MONGO_URI) {
    console.warn('[cron] MONGO_URI not set — skipping DB tasks.');
    process.exit(0);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[cron] MongoDB connected');

    await escalateStaleIssues();
    await dailyStats();

    await mongoose.disconnect();
    console.log('[cron] Done.\n');
    process.exit(0);
  } catch (err) {
    console.error('[cron] Error:', err.message);
    process.exit(1);
  }
}

run();
