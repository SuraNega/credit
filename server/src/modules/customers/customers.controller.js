import * as customersService from './customers.service.js';

export async function listCustomers(req, res, next) {
  try {
    const result = await customersService.listCustomers(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const customer = await customersService.getCustomerById(parseInt(req.params.id));
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await customersService.createCustomer(req.body, req.user.id);
    res.status(201).json({ success: true, data: customer, message: 'Customer created successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await customersService.updateCustomer(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, data: customer, message: 'Customer updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, blacklist_reason } = req.body;
    const customer = await customersService.updateCustomerStatus(
      parseInt(req.params.id), status, blacklist_reason, req.user.id
    );
    res.json({ success: true, data: customer, message: 'Customer status updated.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const result = await customersService.deleteCustomer(parseInt(req.params.id), req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
