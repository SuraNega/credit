import * as creditsService from './credits.service.js';

export async function listCredits(req, res, next) {
  try {
    const credits = await creditsService.listCredits(parseInt(req.params.id));
    res.json({ success: true, data: credits });
  } catch (err) {
    next(err);
  }
}

export async function createCredit(req, res, next) {
  try {
    const credit = await creditsService.createCredit(parseInt(req.params.id), req.body, req.user.id);
    res.status(201).json({ success: true, data: credit, message: 'Credit recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateCredit(req, res, next) {
  try {
    const credit = await creditsService.updateCredit(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, data: credit, message: 'Credit updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteCredit(req, res, next) {
  try {
    const result = await creditsService.deleteCredit(parseInt(req.params.id), req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
