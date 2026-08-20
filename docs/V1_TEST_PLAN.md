# Shilatech Autospares V1 Test Plan

Run these tests on production after Railway shows SUCCESS. Use test products/orders only.

## 1. Access and roles
- Admin login works and `/admin`, `/operations`, `/warehouse`, `/delivery` open correctly.
- Customer account cannot access employee portals.
- Create Warehouse Clerk, Picker, Packer, Dispatch and Delivery Driver accounts.
- Confirm each employee can access only the relevant portal/actions.

## 2. Product and receiving
- In Warehouse > Receive Stock choose **Create New Part**.
- Create a test part with brand, part number, price, model/year and first batch.
- Verify barcode is created and stock batch appears in FIFO table.
- Verify the new product appears in `/shop` immediately with the received stock quantity.
- Receive a second batch and verify website stock increases.
- Attempt to receive a part into the wrong brand storage zone and confirm it is blocked.

## 3. FIFO
- Create two batches of the same part with different receipt times.
- Place an order requiring less than total stock.
- Pick by barcode and confirm the oldest available batch is consumed first.

## 4. Customer order to warehouse
- Add a live-stock test part to cart and complete checkout.
- Confirm the order appears automatically in the warehouse fulfilment queue.
- Start Picking > scan barcode > Packing > Ready for Dispatch > Dispatch.
- Verify website stock is reserved once only and not deducted twice during physical picking.

## 5. Driver assignment and PDA
- In `/delivery`, assign the dispatched order to one driver.
- Sign in as that driver and confirm only assigned deliveries appear.
- Confirm another driver cannot see or complete the job.

## 6. Payment control
- For an M-Pesa Pending order, confirm PDA shows **Prompt Customer to Pay** and blocks delivery completion.
- Before Daraja credentials are connected, confirm the system gives a clear configuration message rather than marking payment Paid.
- After Daraja is connected, test STK Push with a small payment.
- Confirm successful callback changes `payment_status` to Paid.
- Refresh PDA and verify the payment prompt disappears after payment is confirmed.
- Confirm Paid order allows customer signature and delivery completion.

## 7. Proof of delivery
- Capture recipient name and signature.
- Allow GPS permission on the PDA/phone.
- Submit delivery.
- Confirm the customer order becomes Delivered, warehouse job becomes Completed, delivery job becomes Delivered and proof information is retained.

## 8. Returns / factory defects
- Record a factory defect.
- Confirm it is moved to quarantine/non-sellable handling and does not increase available website stock.
- Verify audit trail records the return action.

## 9. Suppliers and purchase orders
- Add a supplier in `/operations`.
- Create a PO for a test part.
- Confirm it appears in Recent Purchase Orders.
- Confirm low-stock products appear when stock is at or below reorder level.
- Change reorder level/quantity and verify the low-stock list recalculates correctly.

## 10. SEO and public pages
- Verify homepage, shop, brands, VIN checker and product pages load on mobile and desktop.
- Verify `/sitemap.xml` and `/robots.txt` load.
- Verify warehouse/admin/delivery/operations pages are not indexable.
- Create a warehouse product and verify its individual product URL loads with correct part number, brand, price and stock.

## 11. Health and deployment
- Open `/api/health` and confirm `ok: true` and `database: ok`.
- Confirm Railway app and Postgres both show SUCCESS.
- Check Railway logs for uncaught errors after all tests.

## V1 sign-off criteria
V1 is ready for real operational use when all critical workflows pass: login/roles, receiving, website stock sync, customer checkout, warehouse FIFO/barcode fulfilment, dispatch/driver assignment, payment protection, proof of delivery, returns quarantine and database health. Live M-Pesa launch additionally requires validated Daraja production credentials and a successful small-value live payment test.
