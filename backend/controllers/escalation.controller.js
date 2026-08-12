const { manualEscalate } = require('../services/sla.service');
const escalateTicket = async (req,res,next) => {
  try {
    const { targetTier, reason } = req.body;
    if (!['tier2','tier3'].includes(targetTier))
      return res.status(400).json({ success:false, message:'targetTier must be tier2 or tier3' });
    if (!reason || reason.trim().length < 5)
      return res.status(400).json({ success:false, message:'Reason required (min 5 chars)' });
    const ticket = await manualEscalate(req.params.id, targetTier, reason, req.user);
    res.json({ success:true, data:ticket });
  } catch(e){ next(e); }
};
module.exports = { escalateTicket };
