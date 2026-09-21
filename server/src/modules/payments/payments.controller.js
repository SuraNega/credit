import * as paymentsService from './payments.service.js';

export async function listPayments(req, res, next) {
  try {
    const payments = await paymentsService.listPayments(parseInt(req.params.id));
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    const payment = await paymentsService.createPayment(parseInt(req.params.id), req.body, req.user.id);
    res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deletePayment(req, res, next) {
  try {
    const result = await paymentsService.deletePayment(parseInt(req.params.id), req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
