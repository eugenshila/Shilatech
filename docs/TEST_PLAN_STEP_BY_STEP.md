# Shilatech Auto Spares — Step-by-Step Test Plan

This test plan checks the customer website and the staff portal against the **User Manual** (`docs/USER_MANUAL.md`) and the application code.

It is designed for **short, low-friction sessions** so you can test steadily without losing your place or getting pulled into side tasks.

---

## How this plan works (read once, then start)

- **Short sessions:** each session takes **10–15 minutes**, has **one goal**, tick boxes (`- [ ]`), and a **"Done when…"** line at the end.
- **Always resume at the first unticked box.** You never need to remember where you left off.
- **Pace:** there is **1 Setup session**, **27 test sessions** (9 customer site, 3 staff sign-in and access, 13 departments, 2 wrap-up), plus a **45-minute Smoke Test** for busy days or after changes. At **two sessions a day** (~25 minutes total), the full plan takes **about 12 working days**.

### The 5 built-in rules

1. **Set a 12-minute timer** before you start a session. When it rings, finish the box you are on and stop.
2. **Use `TEST-` fake data only.** Prefix every test part, customer, supplier, batch, PO and payment reference with `TEST-` (for example `TEST-PART-001`, `TEST Customer`, `TEST-GRN-001`, `TEST-MPESA-001`).
3. **Never debug mid-test.** If something does not match the expected result, write **one line** in the [Bug log](#bug-log-copy-or-fill-in) with a severity icon (🔴 / 🟠 / 🟡) and move to the next tick box.
4. **Put side thoughts in the [Parking lot](#parking-lot-side-thoughts--ideas-for-later).** If you notice a wording tweak, design idea or feature wish, jot one line in the Parking lot and do not look at it until Session 27.
5. **Reward yourself after each session.** Pick a small reward (tea, coffee, a walk, music, 5 minutes outside) before starting the timer.

---

## Launch rule & bug severities

| Icon | Level | Meaning | Holds up launch? |
|---|---|---|---|
| 🔴 | **Blocker** | Blocks selling (online or counter), corrupts or double-deducts stock, exposes staff pages to customers/wrong roles, or crashes checkout/fulfilment. | **Yes — must be fixed before launch.** |
| 🟠 | **Major** | A secondary feature or non-core workflow does not work as expected, with a manual workaround. | **No** — log it and fix after launch. |
| 🟡 | **Minor / Polish** | Layout, wording, alignment, or convenience issue that does not stop staff or customers finishing a task. | **No** — log it for later. |

> **Launch rule:** **Zero 🔴 bugs** in the key selling and stock sessions (Smoke Test, Sessions 2, 3, 6, 10, 12, 13, 15, 16, 17, 19, 20, 26). 🟠 and 🟡 bugs do **not** hold up launch.

---

## Known problems — do NOT log these again

These are already documented in `docs/USER_MANUAL.md` (Sections 3.3 and 3.4). Skip them during testing instead of logging duplicate bugs:

1. **Sales & customer accounts (`/receivables`) — customer, quotation and invoice forms are hidden:** the Finance workspace view currently hides the account-customer, quotation, invoice and credit-limit forms. Test the **Finance workspace** cards only (bills, salary payments, settlements, reports, KPIs, audit trail, P&L, forecast).
2. **Contact page (`Send enquiry` button):** the on-page form button is not wired to an email backend yet. Customers use phone, email or WhatsApp (`+254 721 802 597`, `info@shilatechautospares.co.ke`).
3. **Fresh empty database migration (`pnpm db:migrate` / `npm test` on brand-new DB):** `scripts/locations-pos.sql` references `must_change_password` before `scripts/staff-workflows.sql` adds it. Does not affect an already-migrated database.
4. **Deliberately disconnected external services (by design in v1):**
   - Online Card and PayPal do not charge live cards yet (orders are created with payment status recorded for follow-up).
   - Online M-Pesa STK Push requires live Daraja credentials; before they are connected, the system shows a clear configuration message rather than marking payment Paid.
   - Counter M-Pesa / Card records a reference you verified yourself; it does not call M-Pesa or a card terminal.
   - Approved refunds and approved payroll record decisions only — they do not transfer money or file KRA/NSSF/SHIF returns.
   - Receipts and invoices are internal records, not KRA eTIMS tax invoices.
   - Workshop booking opens WhatsApp with pre-filled text; garage staff enter confirmed bookings manually in `/staff-garage`.
   - My HR → **Email** is a visual placeholder only.

---

## Setup Session — Start the site & create test accounts (15–20 min once)

**Goal:** Confirm the database is healthy, start the site, create one test account per role, and press the one-time module setup buttons.

### Step 1 — Start the site

- [ ] Open a terminal in the project folder and run the read-only stock check first:
  ```bash
  npm run db:check-stock
  ```
  *(Expected: prints `0 stock discrepancies; 0 unassigned pending lines. No data was changed.` If testing against existing data with old seed discrepancies, note the count before starting.)*
- [ ] Start the development server:
  ```bash
  npm run dev
  ```
- [ ] Open `http://localhost:3000/api/health` in your browser.
  *(Expected: `{"ok":true,"service":"Shilatech Auto Spares","database":"ok",...}`.)*

### Step 2 — Sign in as Administrator

- [ ] Open `/staff-login` and sign in with your Administrator account.
  *(If you are on a brand-new local database and need an admin account first, run `npm run admin:bootstrap:local -- admin@shilatech.test` in the terminal and change the temporary password on first sign-in.)*

### Step 3 — Create test accounts (email pattern per role)

Use **Operations & staff (`/operations`) → Create employee** (or **Reports & administration (`/admin`) → Add staff**). Give every account the same initial temporary password (for example `TempPass-2026!`) and replace it with a permanent 12+ character test password (for example `TestStaff-2026!`) the first time you sign in as that role.

| Role | Role code | Recommended test email | Landing page after sign-in |
|---|---|---|---|
| **Customer** *(create at `/account`)* | *(customer)* | `test.customer@shilatech.test` | `/account` |
| **General manager** | `general_manager` | `test.gm@shilatech.test` | `/staff` (view-only) |
| **Warehouse manager** | `warehouse_manager` | `test.whmanager@shilatech.test` | `/warehouse` |
| **Warehouse clerk (all brands)** | `warehouse_clerk` | `test.clerk@shilatech.test` | `/warehouse` |
| **Warehouse clerk (Jeep only)** | `warehouse_clerk` | `jeep@shilatech.test` | `/warehouse` *(locked to Jeep)* |
| **Warehouse operator** | `warehouse_operator` | `test.operator@shilatech.test` | `/warehouse` (pick, pack, dispatch & deliver) |
| **Dispatch** | `dispatch` | `test.dispatch@shilatech.test` | `/warehouse` & `/delivery` |
| **Auditor** | `auditor` | `test.auditor@shilatech.test` | `/warehouse` (view) |
| **Cashier** | `cashier` | `test.cashier@shilatech.test` | `/pos` |
| **Garage staff** | `garage_staff` | `test.garage@shilatech.test` | `/staff-garage` |
| **Delivery driver 1** | `delivery_driver` | `test.driver1@shilatech.test` | `/delivery` (own jobs) |
| **Delivery driver 2** | `delivery_driver` | `test.driver2@shilatech.test` | `/delivery` (own jobs) |
| **Finance** | `finance` | `test.finance@shilatech.test` | `/receivables` |
| **HR** | `hr` | `test.hr@shilatech.test` | `/my-hr` |

> **Why `jeep@shilatech.test`?** Any warehouse email whose local part before `@` is `jeep`, `mercedesbenz`, `volkswagen`, `rangerrover`, `volvo`, or `ford` is automatically restricted to that single brand warehouse. All other warehouse emails must **not** start with a brand name so they can see all six brands.

- [ ] Create `test.gm@shilatech.test` (`general_manager`) first — the approval chain needs a General Manager.
- [ ] Create the remaining staff test accounts from the table above (or create each one right before the session that uses it).
- [ ] Open `/receivables` as Administrator: if **Enable sales and finance records** or **Enable extended finance** appears, click it once.
- [ ] Open `/payroll` as Administrator: if **Initialise payroll** appears, click it once.
- [ ] Open `/my-hr` as Administrator: if **Enable HR records** appears, click it once.

**Done when:** `/api/health` shows `ok: true`, Administrator can sign in, `test.gm@shilatech.test` exists, and `/receivables`, `/payroll` and `/my-hr` are initialised.

---

## The 45-Minute Smoke Test (bad days & after every change)

**When to use:** On low-energy days instead of full sessions, after any code change, and right before launch.
**Goal:** Prove that a customer can browse and buy, the warehouse sees the order, and the counter can make a cash sale without breaking stock.

### Part A — Browse (10 min)
- [ ] Open `/api/health` → shows `"ok": true` and `"database": "ok"`.
- [ ] Open `/` (Home) → header, VIN search box, category tiles and featured parts load cleanly.
- [ ] Open `/shop`, filter by **Jeep**, click a part with stock, and confirm the product page shows price in KSh, part number and stock count.

### Part B — Buy online (12 min)
- [ ] Note the part's current stock number on its product page: `______`.
- [ ] Click **Add to cart**, open `/cart`, then click **Proceed to checkout** (`/checkout`).
- [ ] Enter `TEST Smoke Customer`, `test.customer@shilatech.test`, `0712000000`, `TEST Nairobi Road`, country **Kenya**, **Next Day Delivery (KSh 500)**, **M-Pesa**, and click **Place order**.
- [ ] Confirm **Order received** appears with an order number (`ORD-...`), and the product page stock has dropped by 1.

### Part C — Warehouse sees the order (12 min)
- [ ] Sign in at `/staff-login` as Warehouse Manager (`test.whmanager@shilatech.test`) or Administrator.
- [ ] Open **Warehouse (`/warehouse`)** → click the **Pick, pack & dispatch** card.
- [ ] Confirm the `TEST Smoke Customer` order appears in the **Customer order fulfilment queue** with the ordered item and quantity.

### Part D — Counter cash sale (11 min)
- [ ] Sign in as Cashier (`test.cashier@shilatech.test`) or open **Sales counter (`/pos`)** as Administrator.
- [ ] Click **Create counter sale** (or **Find a part**), search for a part with available stock, and click **Add**.
- [ ] Enter customer name `TEST Smoke Walk-in`, choose **Cash**, enter **Cash received** equal to or above the total, and verify **Change** is calculated.
- [ ] Click **Record paid sale** → confirm the **Sales receipt** opens with a receipt number (`POS-...`) and available stock decreases by the sold quantity.

**Done when:** All four parts pass with zero 🔴 blockers. Stop here and take your reward!

---

# Part 1 — Customer Website (9 Sessions)

## Session 1 — Home page, header & footer navigation
**Time:** 12 min · **Manual ref:** 1.1, 1.2 · **Goal:** Check that the public layout, menu, search bar and home page sections work.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/` (Home). Confirm the **top bar** shows the phone number, email and delivery/original-parts reminders.
- [ ] Click each main menu link in turn and confirm the page opens without error: **Home**, **Shop**, **Brands**, **Workshop**, **Facility**, **About Us**, **Contact**, **Staff portal**.
- [ ] Return to **Home** (`/`). In the header search box (*"Search parts, brands…"*), type `brake` and press **Enter**. Confirm `/shop` opens with the search applied.
- [ ] Back on **Home** (`/`), check the three quick category links (**Brakes**, **Engine**, **Suspension**) — click one and confirm `/shop` opens filtered to that category.
- [ ] Scroll down **Home** (`/`): confirm **Featured auto spare parts**, the **Workshop** section (*Book a workshop visit* button), and the **WhatsApp** link (`+254 721 802 597`) are visible.
- [ ] Check the **footer** links under *Shop*, *Support* and *Dealer*.

**Done when:** Every menu link, header search, home category shortcut and footer link opens the expected page.

---

## Session 2 — Shop: searching, filtering & sorting parts
**Time:** 12 min · **Manual ref:** 1.3 · **Goal:** Check that customers can filter, search and sort the catalogue in `/shop`.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/shop`. Confirm the results count line (for example *"12 parts found"*) and part cards are shown.
- [ ] In the left filter panel, set **Vehicle make** to **Jeep** → confirm the heading updates (e.g. *Jeep parts*) and only Jeep parts are listed.
- [ ] Choose a **Category** (for example *Brakes* or *Engine*) → confirm results narrow to that category.
- [ ] Change **Availability** to **In stock** → confirm only in-stock parts remain.
- [ ] Click **Clear filters** → confirm all makes, categories and stock states return.
- [ ] Type a part name or part number into **Search part name or number…** above the results → confirm results update as you type.
- [ ] Test the **Sort** dropdown: *Featured*, *Price: Low to high*, and *Price: High to low* → confirm card order changes accordingly.
- [ ] Type `ZZZZ-NO-SUCH-PART` into the search box → confirm the empty-state message suggests contacting Shilatech with your VIN.

**Done when:** Make, category, availability filters, Clear filters, live search, sorting and the empty-results prompt all behave as described.

---

## Session 3 — Product page
**Time:** 10 min · **Manual ref:** 1.4 · **Goal:** Verify the individual product page shows complete fitment, stock and pricing details and adds to the cart.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] From `/shop`, click the name or photo of an in-stock part to open `/product/<slug>`.
- [ ] Check that the page displays:
  - [ ] **Breadcrumb** at the top (*Home / Auto spare parts / part name*).
  - [ ] Part type badge (*OEM*, *Aftermarket*, or *Genuine*).
  - [ ] Stock badge (for example *"X in stock"* or *"Out of stock"*).
  - [ ] Part name, **part number**, and price in **KSh**.
  - [ ] Compatible models, years, engine (where recorded) and overview text.
- [ ] Click **Add to cart** → confirm the cart icon count in the header increases by 1.
- [ ] Click the breadcrumb link **Auto spare parts** → confirm it takes you back to `/shop`.

**Done when:** A product page displays all required fields, adds the item to the cart, and links back via the breadcrumb.

---

## Session 4 — Brands page
**Time:** 10 min · **Manual ref:** 1.5 · **Goal:** Confirm all six specialist vehicle brands display and filter the Shop properly.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/brands` from the main menu.
- [ ] Confirm all six brands appear with their models: **Jeep**, **Mercedes-Benz**, **Volkswagen**, **Range Rover**, **Volvo**, and **Ford**.
- [ ] Click **Browse [brand] parts →** on at least three brands → confirm each opens `/shop?brand=...` filtered to that brand.
- [ ] Return to `/brands` and click **Find parts by VIN** → confirm it opens `/vin`.

**Done when:** All six brand cards render and link to the filtered Shop, and the VIN button opens `/vin`.

---

## Session 5 — VIN checker
**Time:** 12 min · **Manual ref:** 1.6 · **Goal:** Test valid 17-character VIN decoding, invalid-character rejection (`I`, `O`, `Q`), and the VIN catalogue reference search.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/vin`.
- [ ] Enter a short VIN (e.g. `12345`) or one containing `I`, `O`, or `Q` (e.g. `1C4RJFBG0EC12345O`) and submit → confirm the page rejects it with a clear message.
- [ ] Enter a valid 17-character VIN (for example Jeep Grand Cherokee `1C4RJFBG0EC123456` or Volvo `YV1CZ592951123456`) and press search.
- [ ] Confirm the site identifies the vehicle details and opens `/shop` with the **"VIN-assisted search active"** banner.
- [ ] In the **Parts catalogue for this vehicle** box, click **Browse full catalogue** and select a category (or search `brake pads`).
- [ ] Confirm catalogue references clearly state that stock and price are not confirmed, and click **Request this part** → confirm it opens `/contact` with the part/VIN details ready.

**Done when:** Invalid VINs are rejected, a valid 17-character VIN activates VIN-assisted search in `/shop`, and *Request this part* links to `/contact`.

---

## Session 6 — Cart & checkout (Kenya delivery)
**Time:** 15 min · **Manual ref:** 1.7 · **Goal:** Test cart quantity controls and place a local Kenya test order.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Add an in-stock part to the cart and open `/cart` (🛒).
- [ ] Change the **quantity** in the number box → confirm the line total and subtotal update immediately.
- [ ] Add a second item, then click **×** on the second item → confirm it is removed.
- [ ] Click **Proceed to checkout** (`/checkout`).
- [ ] Leave **Destination country** as **Kenya** and test all four **Delivery speed** options, checking that the order summary adds the right delivery fee:
  - [ ] **2 Hour Delivery** — KSh 1,200
  - [ ] **4 Hour Delivery** — KSh 900
  - [ ] **8 Hour Delivery** — KSh 700
  - [ ] **Next Day Delivery** — KSh 500
- [ ] Fill in customer details:
  - Full name: `TEST Kenya Buyer`
  - Email: `test.customer@shilatech.test`
  - Phone: `0712345678`
  - Delivery address: `TEST Industrial Area, Nairobi`
- [ ] Select **M-Pesa** (also check that **Card** and **PayPal** can be selected) and click **Place order**.
- [ ] Confirm the **Order received** screen appears with an order number, total, delivery speed and payment status. Write down the order number for later sessions: `________________`.

**Done when:** Cart adjustments work, all four Kenya delivery fees calculate accurately, and placing the order produces an order number.

---

## Session 7 — Checkout (International delivery estimate)
**Time:** 10 min · **Manual ref:** 1.7 · **Goal:** Check that choosing a country outside Kenya switches to the international courier and customs/tax estimate.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Add an in-stock part to the cart and open `/checkout`.
- [ ] Change **Destination country** from *Kenya* to another country (for example **Uganda**, **Tanzania**, or **United Kingdom**).
- [ ] Confirm the local Kenya delivery-speed options are replaced by an **international estimate** showing:
  - [ ] Courier estimate (minimum **KSh 4,500**, or **8%** of the order subtotal if higher).
  - [ ] Customs/tax provision (**20%**).
  - [ ] A note explaining that international figures are estimates only.
- [ ] Switch **Destination country** back to **Kenya** → confirm the four local delivery speeds return.
- [ ] *(Optional)* Empty the cart in `/cart` and confirm **Proceed to checkout** is disabled when the cart is empty.

**Done when:** Selecting a non-Kenya destination displays the 8% (min KSh 4,500) courier + 20% customs/tax estimate, and an empty cart cannot proceed to checkout.

---

## Session 8 — Customer account & My Garage
**Time:** 12 min · **Manual ref:** 1.8 · **Goal:** Create or sign into a customer account, view order history, save a vehicle in My Garage, and confirm customers cannot open staff pages.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/account` (the **♙** icon in the header).
- [ ] If `test.customer@shilatech.test` is not registered yet, click **Create an account**, enter `TEST Customer`, `0712345678`, `test.customer@shilatech.test`, password `TestCustomer-2026!`, and submit. Otherwise sign in directly.
- [ ] Confirm the three tiles appear: **Orders**, **My Garage**, and **Account**.
- [ ] Check **Orders** → confirm the `TEST Kenya Buyer` order from Session 6 appears (if placed under `test.customer@shilatech.test`).
- [ ] In **My Garage**, enter a valid 17-character VIN (e.g. `1C4RJFBG0EC123456`) and save it → confirm the vehicle appears in your saved vehicles list.
- [ ] While signed in as a customer, type `/warehouse` and `/admin` in the address bar → confirm you are **blocked** from viewing any staff tools.
- [ ] Return to `/account` and click **Sign out**.

**Done when:** Customer registration/sign-in, Orders, My Garage VIN saving, Sign out, and staff-portal blocking all work.

---

## Session 9 — Workshop booking & information pages
**Time:** 12 min · **Manual ref:** 1.9, 1.10 · **Goal:** Test the Workshop WhatsApp booking form and check the five information pages.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/workshop`. Confirm the six service descriptions (diagnostics, routine servicing, brakes & suspension, engine & cooling, electrical repairs, pre-purchase inspection) and the four steps (**Book → Inspect → Approve → Repair & test**) are shown.
- [ ] Scroll to **Request a booking** (or click **Book a workshop visit**). Fill in:
  - Name: `TEST Workshop Customer`
  - Phone: `0712345678`
  - Vehicle: `Jeep Grand Cherokee 2018`
  - Registration / VIN: `KDD 123T`
  - Service & preferred date, plus a short note `TEST brake inspection`.
- [ ] Submit the form → confirm it opens a **WhatsApp** URL (`wa.me/...` or `api.whatsapp.com/...`) pre-filled with your booking details. *(You do not need to actually send the WhatsApp message.)*
- [ ] Open each information page and confirm it loads cleanly:
  - [ ] `/facility` (flagship facility photos and concept)
  - [ ] `/about` (Shilatech story and specialist focus)
  - [ ] `/contact` (parts enquiry details — *remember: the Send enquiry button is a known non-connected item*)
  - [ ] `/faq` (click at least two questions to confirm the answers expand)
  - [ ] `/delivery-returns` (delivery, returns, warranty and order-tracking info)

**Done when:** The Workshop booking form builds the pre-filled WhatsApp link and all five information pages load and work.

---

# Part 2 — Staff Sign-In & Who Can Open What (3 Sessions)

## Session 10 — First-time staff sign-in & temporary password change
**Time:** 12 min · **Manual ref:** 2.1 · **Goal:** Confirm temporary passwords force a password change to 12+ characters before any staff page can be used.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/staff-login`. Try signing in with the **customer** account (`test.customer@shilatech.test`) → confirm sign-in is refused.
- [ ] Sign in with a newly created staff test account that still has its temporary password (for example `test.cashier@shilatech.test` with `TempPass-2026!`).
- [ ] Confirm you are sent to `/staff-password` (**Change your password**).
- [ ] Before changing the password, manually type `/pos` or `/warehouse` in the browser address bar → confirm the **Change your temporary password** screen still blocks access to the department.
- [ ] Back on `/staff-password`, try a short new password (e.g. `short123`) → confirm passwords under **12 characters** are rejected.
- [ ] Enter the current temporary password and a new 12+ character password twice (e.g. `TestStaff-2026!`), then click **Save my new password**.
- [ ] Confirm you are redirected straight to that role's landing page (`/pos` for Cashier).
- [ ] Click **Sign out** on the right side of the staff bar → confirm you are signed out.

**Done when:** Customer accounts are blocked at `/staff-login`, temporary passwords block all staff pages until changed to a 12+ character password, and Sign out works.

---

## Session 11 — Staff bar, Staff centre & department dashboard cards
**Time:** 12 min · **Manual ref:** 2.2 · **Goal:** Check `/staff`, the top staff bar, the *"What would you like to do?"* card layout, and returning to the dashboard without losing typed input.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in at `/staff-login` as **Administrator**.
- [ ] Confirm you land on **Staff centre (`/staff`)** and see:
  - [ ] The **staff bar** at the top showing your name, role (`admin`), allowed page links, and **Sign out**.
  - [ ] Department tiles with **Open department →** buttons.
- [ ] Click a department tile (for example **Sales counter** or **Garage jobs**).
- [ ] Confirm the page opens on the **"What would you like to do?"** dashboard with two card groups:
  - [ ] **On this page** (functions for that department).
  - [ ] **Departments & personal services** (other allowed departments + personal HR links).
- [ ] Click one function card under **On this page** (for example **New booking** in `/staff-garage`).
- [ ] Type `TEST Draft Note` into one of the fields (do not submit yet), then click **Back to dashboard**.
- [ ] Re-open the same function card → confirm `TEST Draft Note` is still in the field (nothing you typed was lost).

**Done when:** `/staff` loads, the staff bar highlights the current page, department cards open individual functions, and *Back to dashboard* keeps typed text.

---

## Session 12 — Role boundaries, General Manager view-only mode & brand lock
**Time:** 15 min · **Manual ref:** 2.3 · **Goal:** Verify that each role can open only its permitted pages, General Manager is view-only on operational pages, and a brand-prefixed email sees only that brand's warehouse.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **General Manager** (`test.gm@shilatech.test`).
  - [ ] Open `/staff`, `/admin`, `/operations`, `/warehouse`, `/pos`, `/staff-garage`, and `/delivery`.
  - [ ] Confirm you can view every one of those pages, **but** forms and action buttons are greyed out / read-only (cannot change stock, prices, or record sales).
  - [ ] Open `/approvals`, `/payroll` and `/my-hr` → confirm General Manager **can** use review/decision controls on those three pages.
- [ ] Sign in as **Cashier** (`test.cashier@shilatech.test`):
  - [ ] Confirm `/pos`, `/approvals`, `/my-hr` and `/receivables` open.
  - [ ] Type `/warehouse` and `/admin` in the address bar → confirm you see the **"Welcome to the staff portal / available only to authorised staff"** boundary screen with **Open my department**.
- [ ] Sign in as **HR** (`test.hr@shilatech.test`):
  - [ ] Confirm you land on `/my-hr` (**HR administration**) and cannot open `/warehouse`, `/pos`, `/payroll`, or `/admin`.
- [ ] Sign in as the **Jeep-assigned Warehouse Clerk** (`jeep@shilatech.test`):
  - [ ] Open `/warehouse` → confirm the account is restricted to the **Jeep** brand storage area only and cannot receive or work on other brands.

**Done when:** General Manager is strictly read-only on operational pages, staff roles are blocked from other departments, and `jeep@shilatech.test` is locked to Jeep.

---

# Part 3 — Departments (13 Sessions)

## Session 13 — Warehouse 1: Create new part & receive stock batches
**Time:** 15 min · **Manual ref:** 2.4 · **Goal:** Create a new `TEST-` part in the Warehouse, receive two FIFO batches, check website stock sync, and verify wrong-brand storage is blocked.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Warehouse Manager** (`test.whmanager@shilatech.test`) or **Warehouse Clerk** (`test.clerk@shilatech.test`) and open `/warehouse`.
- [ ] Click the **Receive parts** (*Receive stock*) card and choose **+ Create new part**.
- [ ] Fill in the new part details:
  - Vehicle brand: **Jeep**
  - Part number / SKU: `TEST-JEEP-001`
  - Name: `TEST Jeep Brake Pad Set`
  - Category: `Brakes`
  - Part type: `OEM`
  - Selling price (KSh): `8500`
  - Compatible models / years: `Wrangler 2018-2023`
- [ ] In the receiving fields, select the **Jeep** storage area, Quantity `5`, Batch / GRN `TEST-GRN-001`, Bin `TEST-BIN-A1`, Supplier `TEST Supplier`, Unit cost `5000`, and save.
- [ ] Open **Stock batches & labels** → confirm `TEST-GRN-001` (qty 5) appears in the FIFO table with a **Print label** barcode link.
- [ ] Open `/shop?q=TEST-JEEP-001` in a new tab → confirm `TEST Jeep Brake Pad Set` appears online immediately with **5 in stock**.
- [ ] Back in `/warehouse` → **Receive parts**, select **Existing part** (`TEST-JEEP-001`), receive a second batch of Quantity `3` (`TEST-GRN-002`, Unit cost `5200`) into the **Jeep** zone → confirm `/shop` stock increases to **8 in stock**.
- [ ] Try receiving `TEST-JEEP-001` into the **Volvo** storage area → confirm the system **blocks** receiving a Jeep part into the wrong brand warehouse.

**Done when:** `TEST-JEEP-001` has two FIFO batches (5 + 3 = 8 in stock on `/shop`), barcode label opens, and wrong-brand receiving is blocked.

---

## Session 14 — Warehouse 2: CSV bulk import, preorders & returns quarantine
**Time:** 12 min · **Manual ref:** 2.4 · **Goal:** Test bulk CSV receiving, open preorders, and confirm factory defects go to quarantine without inflating website stock.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] In `/warehouse`, open **Upload parts from CSV** (*Bulk receiving*).
- [ ] Click **Download CSV template**, fill in one `TEST-CSV-001` row (for example a Volvo or Ford test part with quantity `4` and batch `TEST-CSV-BATCH-1`), select the file and upload → confirm the part and its FIFO batch are created in the matching brand warehouse.
- [ ] Return to the Warehouse dashboard and open **Create preorder**.
- [ ] Enter customer `TEST Preorder Client`, phone `0711222333`, part `TEST-JEEP-001`, quantity `2`, expected date, and notes `TEST waiting shipment`, then click **Save preorder** → confirm it appears under **Open preorders**.
- [ ] Return to the Warehouse dashboard and open **Return / factory defect** (*Receive returns*).
- [ ] Note current website stock of `TEST-JEEP-001`: `______`.
- [ ] Record a **Factory defect** (or **Customer return**) for `TEST-JEEP-001`, quantity `1`, notes `TEST cracked housing` → confirm it appears under **Open returns & defects** (quarantine) and **does not** increase sellable website stock.

**Done when:** CSV upload creates a batched part, preorder saves to *Open preorders*, and recording a defect/return keeps it in quarantine without increasing website stock.

---

## Session 15 — Warehouse 3: Order fulfilment (Pick, Pack & Dispatch + FIFO)
**Time:** 15 min · **Manual ref:** 2.4 · **Goal:** Take a website order for `TEST-JEEP-001` from picking through dispatch and verify the oldest FIFO batch (`TEST-GRN-001`) is consumed first.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] In `/shop`, add **2 units** of `TEST-JEEP-001` to the cart and place a checkout order as `TEST Fulfilment Buyer` (choose **Card** or **M-Pesa**). Confirm website available stock drops by **2** immediately (reserved once).
- [ ] Open `/warehouse` → **Pick, pack & dispatch** (*Customer order fulfilment queue*).
- [ ] Find the `TEST Fulfilment Buyer` order and click **Start picking** (as Warehouse operator `test.operator@shilatech.test` or Warehouse Manager).
- [ ] Enter/scan the barcode for `TEST-JEEP-001` and click **Scan & pick** → confirm the item is picked and website stock is **not** deducted a second time.
- [ ] Open **Stock batches & labels** → confirm the 2 picked units were deducted from the **oldest** batch (`TEST-GRN-001` drops from 5 to 3, while `TEST-GRN-002` stays at 3).
- [ ] In the fulfilment queue, advance the order through:
  - [ ] **Start packing** (Warehouse operator or Warehouse Manager)
  - [ ] **Ready for dispatch** (Warehouse operator, Dispatch, or Warehouse Manager)
  - [ ] **Mark dispatched** (Warehouse operator, Dispatch `test.dispatch@shilatech.test` or Warehouse Manager)
- [ ] If the order was paid by M-Pesa, click **Prompt customer to pay** on the same card, then **Refresh payment status** after the customer pays. Confirm the delivery button stays disabled until the payment shows as paid.
- [ ] In the delivery panel, enter the recipient name, sign in the white box and click **Customer signed — mark Delivered**. Confirm the order leaves the queue and the proof is stored.

**Done when:** The order reaches **Dispatched** and then **Delivered** from the one card, stock was deducted once only, and `TEST-GRN-001` (oldest batch) was consumed first.

---

## Session 16 — Sales counter (POS) 1: Cash sale, change & receipt reprint
**Time:** 12 min · **Manual ref:** 2.5 · **Goal:** Complete a cash sale at `/pos`, check change calculation and stock deduction, and reprint the receipt from Recent receipts.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Cashier** (`test.cashier@shilatech.test`) at `/staff-login` → confirm you land on **Sales counter (`/pos`)**.
- [ ] Click **Create counter sale** (or **Find a part**). Search `TEST-JEEP-001` and note its shown available quantity: `______`.
- [ ] Click **Add** to put `TEST-JEEP-001` (KSh 8,500) on the **Counter sale** panel.
- [ ] Enter **Customer name**: `TEST Counter Cash Buyer`.
- [ ] Leave **Payment method** on **Cash** and enter **Cash received**: `10000` → confirm the screen calculates **Change: KSh 1,500**.
- [ ] Click **Record paid sale** → confirm:
  - [ ] The receipt opens showing `Sales receipt` (not a tax invoice), line item, cash received and change.
  - [ ] Available stock of `TEST-JEEP-001` drops by 1 immediately (and does **not** create a warehouse dispatch job).
- [ ] Click **Back to dashboard**, open **Recent receipts**, click the sale you just made, and confirm the receipt reopens with **Print receipt**.

**Done when:** Cash sale records cleanly, change and stock update accurately, and the receipt can be reopened from *Recent receipts*.

---

## Session 17 — Sales counter (POS) 2: M-Pesa / Card references & safety rules
**Time:** 12 min · **Manual ref:** 2.5 · **Goal:** Test electronic payment references at the counter, verify duplicate references are blocked, and check the General Manager's read-only view.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] In `/pos` as **Cashier** (`test.cashier@shilatech.test`), add 1 unit of `TEST-JEEP-001` to a new counter sale.
- [ ] Change **Payment method** to **M-Pesa** (or **Card**).
- [ ] Leave **Confirmed payment reference** blank and try to press **Record paid sale** → confirm the sale is blocked until a reference is entered.
- [ ] Enter customer `TEST Counter MPesa Buyer` and reference `TEST-MPESA-REF-001`, then click **Record paid sale** → confirm the sale succeeds and prints the reference on the receipt.
- [ ] Start another sale, choose **M-Pesa**, and enter the **same** reference `TEST-MPESA-REF-001` → confirm the system **rejects** the duplicate payment reference.
- [ ] Sign out and sign in as **General Manager** (`test.gm@shilatech.test`), then open `/pos` → confirm the counter inputs and buttons are greyed out (read-only).

**Done when:** M-Pesa/Card sales require a unique confirmed payment reference, duplicate references are rejected, and General Manager cannot record a sale.

---

## Session 18 — Garage jobs (`/staff-garage`)
**Time:** 12 min · **Manual ref:** 2.6 · **Goal:** Create a workshop job card, add append-only progress notes, move it through all statuses, and confirm notes do not deduct stock.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Garage staff** (`test.garage@shilatech.test`) → confirm you land on **Garage jobs (`/staff-garage`)**.
- [ ] Click the **New booking** card and enter:
  - Customer name: `TEST Garage Client`
  - Phone: `0722000111`
  - Vehicle / model: `Range Rover Sport 2019`
  - Registration or VIN: `KDT 999T`
  - Requested service: `Brake service & diagnostics`
  - Preferred date: today's date
- [ ] Save the booking → confirm a **job card** is created with a job number (`JOB-...`) and status **Booked**.
- [ ] Open the **Job cards** view. Try clicking **Move to Inspection** with the **Progress / parts-required note** box empty → confirm it requires a note first.
- [ ] Type `TEST vehicle received, needs 1x TEST-JEEP-001` and click **Move to Inspection** → confirm the status becomes **Inspection** and the note appears in the history (and cannot be edited or deleted).
- [ ] Advance the job card with a short `TEST` note at each step:
  - [ ] **Move to Awaiting customer** (or **Move to In progress**)
  - [ ] **Move to In progress**
  - [ ] **Move to Ready**
  - [ ] **Move to Completed**
- [ ] Check `TEST-JEEP-001` stock in `/shop` → confirm writing the part name in garage notes did **not** deduct stock.

**Done when:** A job card progresses from *Booked* to *Completed* with mandatory append-only notes, and stock is unchanged.

---

## Session 19 — Delivery 1: Control Centre & driver assignment
**Time:** 10 min · **Manual ref:** 2.7 · **Goal:** Assign a dispatched order to Driver 1 in `/delivery` and verify the active queue.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Dispatch** (`test.dispatch@shilatech.test`) or **Administrator** and open **Delivery (`/delivery`)**.
- [ ] *(If signed in as Administrator)* Confirm the **Driver accounts** card is visible for creating driver logins.
- [ ] Open **Assign deliveries**. Locate the dispatched `TEST Fulfilment Buyer` order from Session 15.
- [ ] Select **Delivery driver 1** (`test.driver1@shilatech.test`) from the driver dropdown and click **Apply**.
- [ ] Open **Active delivery queue** → confirm the job shows as assigned to `test.driver1@shilatech.test`.

**Done when:** The dispatched test order is assigned to Driver 1 and appears in the active delivery queue.

---

## Session 20 — Delivery 2: Driver PDA, payment control & proof of delivery
**Time:** 15 min · **Manual ref:** 2.7 · **Goal:** Verify driver job isolation, M-Pesa Pending payment protection, and Proof of Delivery completion.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Delivery driver 2** (`test.driver2@shilatech.test`) and open `/delivery` → confirm Driver 1's assigned delivery does **not** appear in Driver 2's queue.
- [ ] Sign out and sign in as **Delivery driver 1** (`test.driver1@shilatech.test`) at `/delivery`.
- [ ] Confirm **My Assigned Deliveries** shows the assigned `TEST Fulfilment Buyer` order, along with **Call customer** and **Open address** links.
- [ ] **Check payment control:**
  - [ ] If the order's payment is **M-Pesa Pending**, confirm **Proof of delivery is blocked** and the card shows **Prompt Customer to Pay** and **Refresh payment status**.
  - [ ] Click **Prompt Customer to Pay** → if Daraja credentials are not connected yet, confirm a clear configuration message is shown instead of falsely marking the order Paid.
- [ ] **Complete Proof of Delivery** *(use an order whose payment status is Paid/Completed — or mark the test order's payment Paid via an approved Order correction in Session 22)*:
  - [ ] Enter **Recipient name**: `TEST Recipient`.
  - [ ] Draw a signature in the **Customer signature** box (test **Clear signature** once, then sign again).
  - [ ] Add **Delivery notes**: `TEST handed over at gate` and submit (allow browser location if prompted).
  - [ ] Confirm the delivery job becomes **Delivered** and the customer order status updates to **Delivered**.

**Done when:** Driver 2 cannot see Driver 1's job, unpaid M-Pesa orders block handover, and submitting recipient name + signature marks a paid order *Delivered*.

---

## Session 21 — Requests & approvals 1: Submitting exception requests
**Time:** 12 min · **Manual ref:** 2.8 · **Goal:** Submit exception requests from operational roles and verify pending requests do NOT alter live stock, prices or sales.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Cashier** (`test.cashier@shilatech.test`) and open **Requests & approvals (`/approvals`)**.
- [ ] Click **Submit an exception request**. Confirm Cashier sees only **PRICE_CHANGE**, **REFUND** (POS only), and **SALE_CORRECTION** (own counter sales).
- [ ] Submit a **PRICE_CHANGE** request for `TEST-JEEP-001` proposing new price `8900` KSh with reason `TEST price update check`, and click **Submit for approval**.
- [ ] Also submit a **REFUND** request (POS) for the `TEST Counter Cash Buyer` sale from Session 16 for `8500` KSh with reason `TEST customer returned unused pad`.
- [ ] Check `/shop?q=TEST-JEEP-001` and `/pos` → confirm the price of `TEST-JEEP-001` is **still KSh 8,500** while the request is `pending manager`.
- [ ] Sign in as **Finance** (`test.finance@shilatech.test`) and open `/approvals`:
  - [ ] Confirm Finance can view all requests and approved refunds, and can submit **REFUND** (POS or ONLINE), **SALE_CORRECTION**, and **ORDER_CORRECTION**, but **cannot** see Approve/Reject buttons.
  - [ ] Submit an **ORDER_CORRECTION** on the `TEST Fulfilment Buyer` order to set **Payment record status** to `Paid` with reason `TEST verified payment for delivery test`.

**Done when:** Price change, POS refund and Order correction requests are submitted with status `pending manager`, and no price or sale has changed yet.

---

## Session 22 — Requests & approvals 2: GM review, Admin approval & refund payout
**Time:** 15 min · **Manual ref:** 2.8 · **Goal:** Walk the submitted requests through General Manager review and Administrator execution, and record an external refund payout reference.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **General Manager** (`test.gm@shilatech.test`) and open `/approvals` → **Requests & decisions**.
- [ ] On each of the three pending requests from Session 21 (`PRICE_CHANGE`, `REFUND`, `ORDER_CORRECTION`):
  - [ ] Confirm the **Recommend to administrator** button is disabled until you type a **Decision note**.
  - [ ] Type `TEST GM reviewed and approved` and click **Recommend to administrator** → confirm status moves to `pending admin`.
- [ ] Sign out and sign in as **Administrator** and open `/approvals` → **Requests & decisions**.
- [ ] On each of the three `pending admin` requests, enter a Decision note `TEST Admin final approval` and click **Approve and apply**:
  - [ ] Confirm `TEST-JEEP-001` price in `/shop` updates to **KSh 8,900** once only.
  - [ ] Confirm the `TEST Fulfilment Buyer` order payment status is now **Paid** (so you can finish Proof of Delivery in Session 20 if it was waiting on payment).
  - [ ] Confirm the approved refund appears under **Approved refunds** with status `awaiting payout` (and `TEST-JEEP-001` stock was **not** automatically increased by the refund).
- [ ] Under **Approved refunds**, enter **Actual transfer reference / cash voucher** `TEST-PAYOUT-VOUCHER-001` and click **Record completed external payout** → confirm status becomes settled/recorded.

**Done when:** GM review → Admin apply executes each change transactionally once, and the external refund payout reference is recorded.

---

## Session 23 — Sales & customer accounts / Finance workspace (`/receivables`)
**Time:** 15 min · **Manual ref:** 2.9 · **Goal:** Test supplier/statutory bills, approval chain, payment settlement, reports & CSV downloads, and P&L / forecast views.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Finance** (`test.finance@shilatech.test`) → confirm you land automatically on `/receivables` (**Finance workspace**). *(Remember: the account-customer / quotation / invoice panels are a Known Issue — test the Finance workspace cards only.)*
- [ ] Click **Supplier and government bills**. Fill in a bill:
  - Type: `SUPPLIER` (or statutory obligation)
  - Payee: `TEST Brake Supplier Ltd`
  - Reference: `TEST-INV-2026-001`
  - Amount (KSh): `25000`
  - Accounting month & Due date: current month
  - Details: `TEST opening brake pad shipment`
  - Click **Submit liability for review**.
- [ ] Sign in as **General Manager** (`test.gm@shilatech.test`), open `/receivables` → **Supplier and government bills**, add a review reason `TEST GM verified invoice`, and approve the liability.
- [ ] Sign in as **Administrator**, open `/receivables` → **Supplier and government bills**, add reason `TEST Admin approved for payment`, and give final approval.
- [ ] Sign back in as **Finance** (`test.finance@shilatech.test`) (or stay as Administrator) in `/receivables`:
  - [ ] Open **Payment settlements**, pick `TEST-INV-2026-001`, enter amount `25000`, method, unique receipt reference `TEST-BANK-TX-001`, confirm external payment, and submit.
  - [ ] Open **Payment reports** → confirm totals update (approved / paid) and test a **CSV download**.
  - [ ] Open **Finance audit trail**, **Profit & loss analysis**, and **Forecast analysis** → confirm each card loads without error.

**Done when:** A `TEST-` supplier bill goes through Finance → GM → Admin → settled with a unique payment reference, and Finance reports/P&L load.

---

## Session 24 — ERP & payroll (`/payroll`)
**Time:** 12 min · **Manual ref:** 2.10 · **Goal:** Prepare a monthly salary record, verify the statutory deduction preview, review as GM, approve as Admin, and open the A5 payslip.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Sign in as **Finance** (`test.finance@shilatech.test`) or **Cashier** and try opening `/payroll` → confirm access is **denied** (only Administrator and General Manager may open `/payroll`).
- [ ] Sign in as **Administrator** and open **ERP & payroll (`/payroll`)**.
- [ ] Click **Prepare a salary record**:
  - Choose Employee: `test.cashier@shilatech.test`
  - Month: `2026-10` (or another month between February and December 2026)
  - Basic pay: `50000`
  - Regular cash allowances: `0`
  - Preferred payment method: `Bank transfer` (or `M-Pesa`)
  - Tax residency: `Resident`
- [ ] Confirm the **Calculation preview** displays NSSF, SHIF, housing levy, PAYE and net pay, then click **Submit for general manager review**.
- [ ] Confirm that as the preparer (Administrator), you **cannot** review your own submitted record before the General Manager reviews it.
- [ ] Sign in as **General Manager** (`test.gm@shilatech.test`), open `/payroll` → **Salary records**, enter review note `TEST GM checked payroll`, and approve it.
- [ ] Sign in as **Administrator**, open `/payroll` → **Salary records**, give final approval, and click **Print approved payslip (A5)** → confirm the printable A5 payslip opens and clearly states that approval is not an automatic payment.
- [ ] *(Optional bonus check)* Open `/receivables` → **Salary payments** and click **Add approved salary to payments** to verify it imports once into Finance.

**Done when:** Non-managers are blocked from `/payroll`, a salary record passes Admin → GM → Admin approval, and the A5 payslip opens.

---

## Session 25 — My HR (`/my-hr`), Reports & administration (`/admin`) & Operations (`/operations`)
**Time:** 15 min · **Manual ref:** 2.11, 2.12, 2.13 · **Goal:** Test the leave workflow in My HR, check payslip/document visibility, and test suppliers, POs, low-stock alerts and staff management in `/admin` and `/operations`.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] **My HR (`/my-hr`):**
  - [ ] Sign in as **Cashier** (`test.cashier@shilatech.test`) and open **My HR (`/my-hr`)**.
  - [ ] Under **My approved payslips**, confirm the approved `2026-10` payslip from Session 24 is visible and opens.
  - [ ] Under **Leave applications**, apply for **Annual** leave (start/end dates next month, reason `TEST annual leave`) and click **Submit leave application**.
  - [ ] Sign in as **HR** (`test.hr@shilatech.test`) at `/my-hr`, add a note `TEST HR verified leave balance`, and click **Forward to general manager**.
  - [ ] Sign in as **General Manager** (`test.gm@shilatech.test`) at `/my-hr`, add a note `TEST GM approved leave`, and click **Approve leave** → confirm status becomes **Approved**.
- [ ] **Reports & administration (`/admin`):**
  - [ ] Sign in as **Administrator** and open `/admin`.
  - [ ] Confirm summary metrics, **Recent order pipeline**, and **Products** table load.
  - [ ] Open **Add product** and create `TEST-ADMIN-001` (`TEST Admin Created Filter`, Jeep, Engine, KSh `3200`) → confirm it is created with **0 stock** (stock can only be added by receiving in the Warehouse).
- [ ] **Operations & staff (`/operations`):**
  - [ ] Open `/operations`. Under **Add supplier**, create `TEST Auto Supplier` and click **Save supplier**.
  - [ ] Under **Create purchase order**, select `TEST Auto Supplier` and `TEST-ADMIN-001`, quantity `10`, unit cost `2000`, and click **Create PO** → confirm the PO appears under **Recent purchase orders**.
  - [ ] Under **Low stock alerts**, confirm `TEST-ADMIN-001` (stock 0) appears; change its **Reorder level** to `5` and **Suggested order** to `10` and click **Save**.
  - [ ] Under **Employee access**, test resetting the password of `test.auditor@shilatech.test` to a new 12+ character temporary password.

**Done when:** Leave passes Staff → HR → GM approval, Cashier sees their payslip, Admin creates a 0-stock product, and Supplier + PO + Low-stock alert + Password reset all work in `/operations`.

---

# Part 4 — Wrap-Up (2 Sessions)

## Session 26 — Technical health, stock reconciliation & SEO checks
**Time:** 12 min · **Manual ref:** 3.1, 3.2 & `V1_TEST_PLAN.md` 10–11 · **Goal:** Confirm stock numbers are 100% consistent across the database, health endpoint passes, and SEO/privacy rules hold.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Open `/api/health` in the browser → confirm `"ok": true` and `"database": "ok"`.
- [ ] In the terminal, run the stock reconciliation check:
  ```bash
  npm run db:check-stock
  ```
  Confirm none of your `TEST-` parts appear as stock discrepancies or unassigned pending lines.
- [ ] Open `/sitemap.xml` and `/robots.txt` → confirm both load cleanly.
- [ ] View page source (or inspect `<meta name="robots">`) on `/staff-login`, `/warehouse`, `/pos`, `/admin`, and `/payroll` → confirm staff pages are marked `noindex`.
- [ ] Resize your browser window to phone width (~375 px) and laptop width (~1366 px) on `/` (Home), `/shop`, and `/delivery` → confirm the header icons (account and cart) and main buttons remain visible and usable.

**Done when:** `/api/health` is green, `npm run db:check-stock` shows zero new discrepancies, `/sitemap.xml` and `/robots.txt` load, and staff pages are `noindex`.

---

## Session 27 — Triage, Parking Lot review & Launch Sign-Off
**Time:** 15 min · **Goal:** Review your Bug Log and Parking Lot, note any `TEST-` data to clean up on staging/production, and make the launch decision.

- [ ] Set a 12-minute timer and pick your reward: `________________`.
- [ ] Count the bugs in your [Bug log](#bug-log-copy-or-fill-in) by severity:
  - 🔴 Blockers: `____`
  - 🟠 Major: `____`
  - 🟡 Minor / Polish: `____`
- [ ] Read through your [Parking lot](#parking-lot-side-thoughts--ideas-for-later) and move any real bugs into the Bug log (usually 🟡).
- [ ] Check the **Launch rule**:
  - [ ] Are there **zero 🔴 Blocker bugs** in the key sessions (Smoke Test, Sessions 2, 3, 6, 10, 12, 13, 15, 16, 17, 19, 20, 26)?
  - [ ] If yes: **V1 is ready to launch.** Schedule 🟠 and 🟡 items for post-launch sprints.
  - [ ] If any 🔴 Blocker exists: fix only the 🔴 items, then re-run the **45-Minute Smoke Test** plus the affected session.

**Done when:** Every logged item has a severity icon, the Launch Rule check is complete, and you have celebrated finishing the test plan!

---

## If you get stuck (quick rescue guide)

| What happened | What to do right now (under 1 minute) |
|---|---|
| **Timer rang mid-session** | Finish the single tick box you are on, save the file, and stop. Next time, start at the very next `[ ]` box. |
| **Locked out on "Change your temporary password"** | Sign in at `/staff-password`, enter the temporary password and a new password with **12 or more characters** (`TestStaff-2026!`). Or sign in as Administrator → `/operations` → **Employee access** → reset that test account's password. |
| **"Welcome to the staff portal / available only to authorised staff"** | You are signed into the wrong role for that URL. Check the top-left of the staff bar to see who is signed in, click **Sign out**, and sign in with the role listed at the top of the session. |
| **A staff page is completely greyed out** | You are signed in as **General Manager** (`test.gm@shilatech.test`), which is view-only by design. Sign out and sign in as the department role or Administrator. |
| **Warehouse only shows Jeep** | You are signed in as `jeep@shilatech.test`. Sign out and sign in as `test.whmanager@shilatech.test` or `test.clerk@shilatech.test`. |
| **Missing table / "Initialise…" message on `/receivables`, `/payroll` or `/my-hr`** | Sign in as **Administrator**, open that page, and click the one-time **Enable / Initialise** button at the top. |
| **Tempted to read code or fix a bug during a test** | Stop! Write **one line** in the Bug log below, mark it 🔴, 🟠 or 🟡, and move to the next tick box. |
| **Bad focus day / don't feel like testing** | Do **only Part A** (10 min) of the Smoke Test, or just **one** 10-minute session, tick the boxes, and stop for the day. |

---

## Session record (copy or fill in)

| Date | Session # | Started at | Finished? (Y / Paused) | Bugs logged (count) | Reward taken |
|---|---|---|---|---|---|
| 2026-10-__ | Setup | | | | |
| 2026-10-__ | Session 1 | | | | |
| 2026-10-__ | Session 2 | | | | |
| 2026-10-__ | Session 3 | | | | |
| 2026-10-__ | Session 4 | | | | |
| 2026-10-__ | Session 5 | | | | |
| 2026-10-__ | Session 6 | | | | |
| 2026-10-__ | Session 7 | | | | |
| 2026-10-__ | Session 8 | | | | |
| 2026-10-__ | Session 9 | | | | |
| 2026-10-__ | Session 10 | | | | |
| 2026-10-__ | Session 11 | | | | |
| 2026-10-__ | Session 12 | | | | |
| 2026-10-__ | Session 13 | | | | |
| 2026-10-__ | Session 14 | | | | |
| 2026-10-__ | Session 15 | | | | |
| 2026-10-__ | Session 16 | | | | |
| 2026-10-__ | Session 17 | | | | |
| 2026-10-__ | Session 18 | | | | |
| 2026-10-__ | Session 19 | | | | |
| 2026-10-__ | Session 20 | | | | |
| 2026-10-__ | Session 21 | | | | |
| 2026-10-__ | Session 22 | | | | |
| 2026-10-__ | Session 23 | | | | |
| 2026-10-__ | Session 24 | | | | |
| 2026-10-__ | Session 25 | | | | |
| 2026-10-__ | Session 26 | | | | |
| 2026-10-__ | Session 27 | | | | |

---

## Bug log (copy or fill in)

> **Rule:** One line per bug. Do not investigate during a testing session.

| # | Severity (🔴 / 🟠 / 🟡) | Session # | Page / URL | Role used | One-line description (what you clicked → what happened) | Status (Open / Fixed / Retested) |
|---|---|---|---|---|---|---|
| 1 | | | | | | Open |
| 2 | | | | | | Open |
| 3 | | | | | | Open |
| 4 | | | | | | Open |
| 5 | | | | | | Open |
| 6 | | | | | | Open |
| 7 | | | | | | Open |
| 8 | | | | | | Open |
| 9 | | | | | | Open |
| 10 | | | | | | Open |

---

## Parking lot (side thoughts & ideas for later)

> **Rule:** Write your thought here in one sentence and immediately return to the current tick box. Review only in Session 27.

| # | Session # | Idea, question, or nice-to-have improvement |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| 9 | | |
| 10 | | |
