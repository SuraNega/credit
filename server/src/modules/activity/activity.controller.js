import * as activityService from './activity.service.js';

export async function listActivity(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const result = await activityService.listActivity({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listCustomerActivity(req, res, next) {
  try {
    const activities = await activityService.listCustomerActivity(parseInt(req.params.id));
    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardSummary(req, res, next) {
  try {
    const summary = await activityService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function getTopDebtors(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const debtors = await activityService.getTopDebtors(limit);
    res.json({ success: true, data: debtors });
  } catch (err) {
    next(err);
  }
}
