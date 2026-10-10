import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staffPages,canViewStaffPage,staffLinkLabels } from '../lib/staff-access.mjs';
import { allowedRequestKinds } from '../lib/approvals.mjs';
import { functionCard,employeeShortcuts } from '../lib/staff-dashboard.mjs';

test('finance can open Requests & approvals as well as the finance workspace', () => {
  assert.deepEqual(staffPages('finance'),['/receivables','/approvals']);
  assert.equal(canViewStaffPage('finance','/approvals'),true);
  assert.equal(canViewStaffPage('finance','/pos'),false);
  assert.equal(staffLinkLabels['/receivables'],'Sales & customer accounts');
  assert.ok(employeeShortcuts('finance','/approvals').some(c=>c.href==='/receivables'&&c.label==='Sales & customer accounts'));
  assert.ok(employeeShortcuts('finance','/receivables').some(c=>c.href==='/approvals'&&c.label==='Requests & approvals'));
});

test('finance may raise payment-related requests only', () => {
  assert.deepEqual(allowedRequestKinds('finance'),['REFUND','SALE_CORRECTION','ORDER_CORRECTION']);
  assert.equal(allowedRequestKinds('hr').length,0);
  assert.ok(!allowedRequestKinds('finance').includes('PRICE_CHANGE'));
});

test('the request form has a dashboard card', () => {
  assert.equal(functionCard('Submit an exception request').id,'new-request');
  assert.equal(functionCard('New request').id,'new-request');
});
