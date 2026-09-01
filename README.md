# Ledger — Shop Tracker (PWA, local-only)

A installable, offline shop management app: daily sales entry, inventory,
expenses, an auto-updating debt tracker, a monthly budget sheet, and a
dashboard that rolls performance up from daily → weekly → monthly → yearly.

**No accounts, no login, no backend.** All data is stored locally on the
device, in the browser's built-in database (IndexedDB). Open the app and
you're straight into the dashboard.

Because there's no login, there's also **no automatic sync between devices**
— each install (each phone/browser) keeps its own separate data. See
"Backup & restore" below if you ever need to move data between devices or
protect against losing it.

---

## 1. Put it on GitHub and turn on Pages

1. Create a new GitHub repository and push this whole folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick your main branch and the `/ (root)` folder, then **Save**.
4. After a minute your app is live at `https://<your-username>.github.io/<repo-name>/`.

> ⚠️ PWAs require **HTTPS** to install and to register a service worker — GitHub Pages gives you this automatically, so no extra setup is needed.

That's it — there's no project to create, no config file to edit. It works as soon as it's deployed.

---

## 2. Install it on Android

1. Open your GitHub Pages URL in **Chrome** on your Android phone.
2. Tap the **⋮** menu → **Add to Home screen** / **Install app**. Chrome may also prompt you automatically after a few visits.
3. The app now opens full-screen from your home screen like a native app, and keeps working with no internet connection at all — because everything, including your data, lives on the device.

---

## 3. Backup & restore (important!)

Since there's no cloud login, **your data only exists on this one device's browser**. It can be lost if you clear browser/app data, uninstall, or switch phones. To protect against that:

- Go to **Settings → Backup & restore → Export backup (.json)** regularly — this downloads a single file with everything (products, sales, expenses, debts, budget).
- Save that file somewhere safe (email it to yourself, save to Google Drive/WhatsApp, etc.).
- To move to a new phone, or recover from a lost one: install the app there, go to **Settings → Restore from file**, and pick your backup file. This replaces whatever is currently on that device with the backup.

---

## What's included

| Area | What it does |
|---|---|
| **Dashboard** | Revenue, COGS, gross profit, expenses, net profit, and outstanding debt — switchable between Today / This Week / This Month / This Year, plus a revenue-vs-expenses trend chart and best/lowest sellers. |
| **Sales** | Log a sale with one or more products; price and cost are pulled from Inventory automatically. Stock is deducted the moment a sale is saved. Choose Cash or Credit — Credit sales create a linked debt automatically. |
| **Inventory** | Add/edit/delete products with cost price, sell price, stock quantity, and a low-stock alert threshold. |
| **Expenses** | Log expenses by category (Rent, Utilities, Transport, Salaries, Supplies, Maintenance, Marketing, Other) with notes. |
| **Debt Tracker** | Every credit sale becomes a debt automatically. Record partial or full payments — balance and status (Unpaid / Partial / Paid / Overdue) update themselves. You can also add debts manually. |
| **Budget Sheet** | Set a planned amount per category per month; actual spend is pulled live from your logged Expenses, with a progress bar and over-budget warning. |
| **Settings** | Shop name, JSON backup/export, restore from a backup file, and a "erase everything" option. |

All figures are shown in **Ghana Cedis (GH₵)** — you can change this by editing the `fmtMoney` function in `js/calc.js`.

## How profit is calculated

- **Cost of Goods Sold (COGS)** = sum of each sold item's cost price × quantity, at the moment of sale.
- **Gross profit** = Revenue − COGS.
- **Net profit** = Gross profit − Expenses (for the selected period).
- Credit sales count toward revenue immediately (standard accrual accounting) and simultaneously create a debt — so your profit reporting and your debt tracker never disagree with each other.

## Local development

No build step is needed. To preview changes before pushing, run any static file
server from this folder, e.g.:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Wanting multi-device sync later?

If you later want the same data to show up across several phones (with a
login), that needs a backend — Firebase is the simplest free option. That's
a bigger change (adds an account system and cloud database) — just ask and
it can be added back in without losing this local-only version.
