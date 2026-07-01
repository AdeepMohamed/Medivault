const supabase = require('../config/supabase');

/**
 * Keep-alive endpoint to prevent Supabase from pausing.
 * Executes a simple query to register activity.
 */
exports.keepAlive = async (req, res, next) => {
  try {
    // 1. Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Unauthorized cron request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const startTime = Date.now();

    // 2. Perform a lightweight query to register database activity
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase keep-alive query failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to query Supabase',
        error: error.message,
      });
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Supabase keep-alive query completed in ${duration}ms. Registered count: ${count}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Supabase keep-alive successful',
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
