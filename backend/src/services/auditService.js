const supabase = require('../config/supabase');

const logAction = async ({ userId, action, resourceId, resourceType, details = {}, ipAddress }) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      resource_id: resourceId || null,
      resource_type: resourceType || null,
      details,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
};

module.exports = { logAction };
