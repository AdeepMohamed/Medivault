const supabase = require('../config/supabase');

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const from = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + Number(limit) - 1);

    if (search) query = query.ilike('email', `%${search}%`);

    const { data: users, error, count } = await query;
    if (error) throw error;
    res.json({ users, total: count });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const { data: user, error } = await supabase
      .from('users').update({ role }).eq('id', req.params.id)
      .select('id, name, email, role').single();

    if (error) throw error;
    res.json({ user });
  } catch (err) { next(err); }
};

// GET /api/admin/records
const getAllRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;

    const { data: records, error, count } = await supabase
      .from('records')
      .select('id, title, category, file_size, created_at, owner_id, users(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + Number(limit) - 1);

    if (error) throw error;
    res.json({ records, total: count });
  } catch (err) { next(err); }
};

// GET /api/admin/audit
const getAllAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const from = (page - 1) * limit;

    const { data: logs, error, count } = await supabase
      .from('audit_logs')
      .select('*, users(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + Number(limit) - 1);

    if (error) throw error;
    res.json({ logs, total: count });
  } catch (err) { next(err); }
};

// GET /api/admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const [usersRes, recordsRes, logsRes] = await Promise.all([
      supabase.from('users').select('role', { count: 'exact' }),
      supabase.from('records').select('category', { count: 'exact' }),
      supabase.from('audit_logs').select('action', { count: 'exact' }),
    ]);

    const usersByRole = {};
    usersRes.data?.forEach(u => { usersByRole[u.role] = (usersByRole[u.role] || 0) + 1; });

    res.json({
      totalUsers: usersRes.count,
      totalRecords: recordsRes.count,
      totalAuditLogs: logsRes.count,
      usersByRole,
    });
  } catch (err) { next(err); }
};

module.exports = { getUsers, updateUserRole, getAllRecords, getAllAuditLogs, getAdminStats };
