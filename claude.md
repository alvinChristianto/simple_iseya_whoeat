LAUDE.md — iSeya Bread Distribution Tracker

## 1. Project Purpose

An internal web app for ISEYA Bakery to record which employee received/ate which bread, on which day, and to report that data back out (on-screen and as Excel).

Optimize for:
- Fastest possible data entry (this is used many times a day by an operator)
- Zero training required for a new operator
- Reliable, persistent storage
- Simple, low-maintenance admin
- Clean Excel export other people can pivot/filter in their own workbooks

This is an **internal operational tool**, not a public product. Prefer the boring, simple solution over the flexible one every time there's a choice.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript, React |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Hosting | Vercel |
| Excel generation | `exceljs` (needs two named, independently styled sheets — this handles that better than raw SheetJS) |
| Validation | `zod`, used identically on client and server |
| Admin session | Signed, HTTP-only cookie using Node's built-in `crypto` (HMAC) — no session table, no extra auth library |

Don't add anything not in this table without a reason. No state management library, no UI kit, no ORM alternative, no auth provider (Employees never log in; Admin is a single shared PIN, not a user account system).

---

## 3. Architecture

```
Browser
  ↓
Next.js app (Vercel)
  ↓
Server Actions / Route Handlers   ← all business logic + validation lives here
  ↓
Prisma
  ↓
Supabase PostgreSQL
```

Hard rule: **the browser never talks to Postgres directly**, and never sees `DATABASE_URL` or `ADMIN_PIN`. All reads/writes go through server-side code.

---

## 4. Data Model

Three tables. Nothing gets hard-deleted; master data is soft-deactivated so history stays valid forever.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (pgbouncer) connection — used at runtime
  directUrl = env("DIRECT_URL")     // direct connection — used only for migrations
}

enum Category {
  HO
  LUAR
}

model Employee {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  breadRecords BreadRecord[]

  @@index([isActive])
  @@map("employees")
}

model BreadType {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  breadRecords BreadRecord[]

  @@index([isActive])
  @@map("bread_types")
}

model BreadRecord {
  id          Int       @id @default(autoincrement())
  employeeId  Int       @map("employee_id")
  breadTypeId Int       @map("bread_type_id")
  category    Category
  recordedAt  DateTime  @default(now()) @map("recorded_at") // stored as UTC timestamptz — see §8
  createdAt   DateTime  @default(now()) @map("created_at")

  employee  Employee  @relation(fields: [employeeId], references: [id])
  breadType BreadType @relation(fields: [breadTypeId], references: [id])

  @@index([recordedAt])
  @@index([employeeId])
  @@index([breadTypeId])
  @@map("bread_records")
}
```

**Why Supabase Postgres, and how the connection works on Vercel** (this answers "does this need a database"): yes — Vercel functions are stateless and have no persistent filesystem, so `localStorage`, JSON files, or in-memory arrays are not options; data would vanish between requests. Supabase gives you a managed Postgres reachable from Vercel's serverless functions. Because those functions spin up per-request and can each open a DB connection, use Supabase's **pooled connection string (port 6543, pgbouncer)** as `DATABASE_URL` for normal queries, and the **direct connection (port 5432)** as `DIRECT_URL` only for running Prisma migrations. Both come straight from the Supabase project settings page — no extra networking setup is needed.

---

## 5. Core Flows

### 5.1 Record bread (`/`, the main screen)

```
Search employee → Select bread → HO / LUAR (default HO) → SIMPAN
                                                              ↓
                                        form resets, focus returns to search
```

- Employee field: searchable combobox, not a plain `<select>` (100–200 employees; a scrolling dropdown is painful). Fetch the active employee list once client-side and filter in-memory — no need for a search API, the dataset is small enough.
- Bread field: dropdown or simple searchable select (fewer options than employees).
- Category: two radio-style buttons, HO pre-selected.
- On Save: validate on the client for instant feedback, **re-validate everything server-side** (employee exists + active, bread type exists + active, category is exactly `HO` or `LUAR`), write one `bread_records` row, return success, clear the form, keep the category at its default, refocus the employee search box.
- Stay on the same page. Never redirect after save.
- **One Save = one row.** Never merge/aggregate on insert, even if the same employee picks the same bread twice in a row.

### 5.2 Daily records (`/daftar` or `/records`)

- Date picker, defaulting to today (Asia/Jakarta "today", see §8).
- A flat table: Time | Employee | Bread Type | Category — one row per transaction, duplicates shown as separate rows.
- A summary block above or beside it: total records, HO total, LUAR total, totals by bread type, totals by employee.
- "Download Excel" button for the selected date.

### 5.3 Excel export

See §9 — this is the most detail-sensitive part of the spec.

### 5.4 Admin (`/admin`)

- Entering `/admin` prompts for the 4-digit PIN before anything else loads.
- Once verified, admin can: add employee, activate/deactivate employee, add bread type, activate/deactivate bread type.
- No delete of employees or bread types. No edit/delete of transactions, ever — see §6.

**Add employee / add bread type — field-level spec:**
- Single text field (`Nama Karyawan` / `Jenis Roti`), trimmed, required, non-empty.
- Server checks for an existing row with the same name, case-insensitively, before inserting (`name` is `@unique` in the schema, so this also prevents a raw constraint-violation error reaching the user).
- **If a match exists and is inactive** (the common real case: someone left and was deactivated, then comes back / a bread type is reintroduced) — do not create a second row. Instead, either auto-reactivate it, or show `Nama sudah ada (nonaktif) — aktifkan kembali?` and let admin confirm reactivation. Reactivating is a one-click action on the existing "Activate" control either way, so this just routes them there instead of failing.
- **If a match exists and is already active** — reject with `Nama sudah terdaftar.`, no new row.
- On success: clear the input, show `Data berhasil disimpan.`, and the new/reactivated entry appears immediately in the list below (and becomes selectable on the main input screen right away).

### 5.5 Responsive & In-Page Behavior

This is a responsive **web app** — no native mobile app, no PWA (see §13) — but the main input screen is used standing at a counter on a phone or tablet, so it needs to actually feel good there, not just technically render.

- Main input form: single-column layout on small screens, large tap targets for the HO/LUAR toggle and the Save button, no pinch-zoom required to use it comfortably.
- After Save, the form updates **in place** — no full page navigation or reload. The Server Action returns the result and the client applies it directly (clear fields, show the success message, refocus the search box). This is what makes the search → bread → HO/LUAR → Save → next loop feel instant on a phone rather than like a page reloading each time — the "SPA-like" feel comes from this in-page update pattern, not from adding client-side routing infrastructure.
- `/daftar` can scroll horizontally on narrow screens for the detailed table rather than cramming every column into a small width — don't sacrifice readability to force-fit mobile.
- Desktop use (e.g. admin reviewing at a desk) should work well too — mobile-first for the input screen specifically, not mobile-only for the whole app.

---

## 6. Business Rules (non-negotiable)

1. Every Save creates exactly one `bread_records` row. No de-duplication, no "did they already get this today" logic — an employee can legitimately get the same bread twice in one day, and both must be recorded.
2. Transactions are permanent once saved: no edit, no delete, in this version.
3. Employees and bread types are never hard-deleted, only `is_active = false`. Deactivating one must not hide or affect past `bread_records` rows tied to it.
4. Only active employees/bread types are selectable on the input form; inactive ones can still appear in historical reports.
5. Never trust values from the browser — every save re-checks existence + active status + valid category server-side.

---

## 7. Security

**On the "hardcoded PIN" from the brief** — one correction worth flagging: a PIN literally hardcoded into frontend source (`const ADMIN_PIN = "1234"`) would ship inside the JS bundle and be readable by anyone who opens dev tools, and you couldn't rotate it without a redeploy. What you actually want, and what's specified below, gets you the same simplicity (one fixed 4-digit code, no user accounts) without that exposure:

- `ADMIN_PIN` lives only as a Vercel **environment variable**, read only in server-side code (Server Action / Route Handler).
- The browser never receives the real PIN — only a success/failure response.
- On correct PIN, the server sets an **HTTP-only, Secure, SameSite=Strict cookie** containing a short-lived signed token (HMAC with a `SESSION_SECRET` env var + expiry timestamp, verified with Node's `crypto` module — no session table, no extra auth package needed). Suggest ~60 minutes expiry; admin re-enters the PIN after that.
- Every admin Server Action re-verifies that cookie server-side before doing anything.
- No secrets committed to git; `.env.example` ships with placeholder values only.

---

## 8. Timezone Handling (Asia/Jakarta)

This is the easiest part of the spec to get subtly wrong, so be deliberate:

- Store `recordedAt` as UTC (`timestamptz`) in Postgres — this is standard and correct.
- **Never derive "which calendar day a record belongs to" from the raw UTC timestamp.** WIB is UTC+7, so a record saved at, say, `00:20 WIB` is still `17:20 UTC` **the previous day** — a naive `.toISOString().slice(0,10)` would silently put it on the wrong day.
- Always convert to `Asia/Jakarta` first (e.g. with `date-fns-tz` or `Intl.DateTimeFormat` with `timeZone: "Asia/Jakarta"`) before extracting a date, displaying a time, or building the Excel filename.
- When querying "give me all records for date X," compute the Jakarta day boundaries first (`X 00:00:00+07:00` → `X 23:59:59+07:00`), convert those two instants to UTC, and filter `recordedAt` between them — don't filter by string-matching a date column.

---

## 9. Excel Export Spec

Filename: `bread-records-YYYY-MM-DD.xlsx` (the date is the Jakarta calendar date being exported).

Server generates the file from a fresh DB query for the requested date — never from whatever happens to be rendered in the browser.

**Sheet 1 — `Records`** (machine-first, this is the sheet someone will pivot/filter/`SUMIFS` in their own workbook):
- Columns, in this order, headers in row 1 with no title/merged rows above them: `Date | Time | Employee Name | Bread Type | Category`
- One transaction per row, exactly mirroring the daily table.
- No merged cells, no decorative formatting, no blank spacer rows.

**Sheet 2 — `Summary`** (human-first, formatting is fine here):
- Date, total records, HO total, LUAR total.
- Totals by bread type.
- Totals by employee.
- Optional employee × bread-type matrix (rows = employees, columns = bread types present that day, values = counts) if it's not a lot of extra work — genuinely useful but not a blocker for v1.

This structure directly answers "is this plan Excel-ready": yes — a normalized one-row-per-transaction sheet with clean headers and no merged cells is exactly what Power Query, Pivot Tables, and `SUMIFS`/`COUNTIFS` want. Keep it that way even if it looks a little plain.

---

## 10. UI Language & Copy

Interface is in Indonesian. Code, comments, and this file are in English.

Core labels: `Nama Karyawan`, `Jenis Roti`, `HO`, `LUAR`, `Simpan`, `Daftar Harian`, `Tanggal`, `Download Excel`, `Admin`, `Tambah Karyawan`, `Tambah Jenis Roti`, `Aktif`, `Nonaktif`.

Error/feedback messages, plain Indonesian, no raw DB errors ever shown to the user:
- `Data berhasil disimpan.`
- `Nama karyawan wajib dipilih.`
- `Jenis roti wajib dipilih.`
- `Karyawan tidak ditemukan atau sudah tidak aktif.`
- `Jenis roti tidak tersedia.`
- `PIN salah.`

---

## 11. Environment Variables

```env
# .env.example
DATABASE_URL=       # Supabase pooled connection string (port 6543)
DIRECT_URL=         # Supabase direct connection string (port 5432), migrations only
ADMIN_PIN=0000      # placeholder only — real PIN is set in Vercel project settings
SESSION_SECRET=     # random string used to sign the admin session cookie
```

Never commit real values. `ADMIN_PIN` and `SESSION_SECRET` in production are set through Vercel's Environment Variables UI, not in any file in the repo.

---

## 12. Build Order

1. **Plan** — confirm this file matches reality before writing app code.
2. **Scaffold** — Next.js + TypeScript + Tailwind + Prisma, env config.
3. **Database** — models above, migration, dev seed data (a handful of employees + bread types).
4. **Input screen** — searchable employee combobox, bread select, HO/LUAR, Save, server validation, reset-after-save.
5. **Daily records** — date picker, table, summary numbers.
6. **Excel export** — `Records` + `Summary` sheets, filename convention.
7. **Admin** — PIN gate, signed session cookie, employee & bread-type management (add/activate/deactivate only).
8. **Production pass** — verify on Vercel: build, Prisma against Supabase, env vars, PIN flow, Excel download, Jakarta-day filtering around midnight.

---

## 13. Out of Scope — do NOT build

Employee login/passwords, user registration, roles/permissions, transaction editing or deletion, payroll, inventory/stock management, accounting, notifications/email, mobile app or PWA, analytics dashboards, complex charts, multi-branch/multi-company support.

One purpose only: **record who received what bread, and report it accurately.**

---

## 14. Acceptance Criteria

- [ ] Operator can search → select employee → select bread → pick HO/LUAR → Save → get confirmation → immediately enter the next record without leaving the page.
- [ ] Main input screen is comfortably usable one-handed on a phone/tablet without zooming, and Save does not trigger a full page reload.
- [ ] Entering the same employee + same bread twice produces two separate rows, visible as two rows in `/daftar` and two rows in the Excel `Records` sheet.
- [ ] Selecting a date shows every transaction for that day plus correct HO/LUAR/bread-type/employee totals.
- [ ] Excel download for a date opens cleanly in Microsoft Excel with both sheets populated and matching the on-screen data.
- [ ] `/admin` is inaccessible without the correct PIN; wrong PIN shows `PIN salah.` and nothing else.
- [ ] Admin can add a new employee and a new bread type, and each appears immediately as selectable on the main input screen.
- [ ] Adding a name that matches an existing **inactive** employee/bread type offers reactivation instead of failing or creating a duplicate row.
- [ ] Adding a name that matches an existing **active** employee/bread type is rejected with `Nama sudah terdaftar.`
- [ ] Deactivating an employee or bread type removes it from the input form but leaves all past records referencing it fully intact and visible.
- [ ] A record saved at, e.g., 00:20 WIB lands on the correct Jakarta calendar day everywhere it's shown (screen, filename, Excel `Date` column).

---

## 15. Assumptions Made Here — flag if any of these are wrong

- Viewing `/daftar` (daily records) does **not** require the PIN — only the `/admin` actions do. If this data should also be gated, say so before build starts.
- Package manager: no strong preference stated, defaulting to `npm`.
- Admin session length: defaulting to ~60 minutes; change if you want shorter/longer.
- If a decision affects the database schema or a business rule and isn't covered above, stop and ask the project owner rather than guessing. For minor UI details, use sensible defaults and move on.
