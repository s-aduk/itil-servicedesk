const SLA_TARGETS = {
  critical: { responseMinutes: 15,  resolutionMinutes: 60   },
  high:     { responseMinutes: 30,  resolutionMinutes: 240  },
  medium:   { responseMinutes: 120, resolutionMinutes: 1440 },
  low:      { responseMinutes: 480, resolutionMinutes: 4320 },
};
const ESCALATION_THRESHOLDS = { tier2: 0.75, tier3: 0.90 };
module.exports = { SLA_TARGETS, ESCALATION_THRESHOLDS };
