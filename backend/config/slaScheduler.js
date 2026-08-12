const { runSlaChecks } = require('../services/sla.service');
let handle = null;
const startSlaScheduler = () => {
  if (handle) return;
  console.log('⏱  SLA scheduler started (60s interval)');
  handle = setInterval(async () => {
    try { await runSlaChecks(); }
    catch(e) { console.error('[SLA]', e.message); }
  }, 60000);
};
const stopSlaScheduler = () => { if (handle) { clearInterval(handle); handle = null; } };
module.exports = { startSlaScheduler, stopSlaScheduler };
