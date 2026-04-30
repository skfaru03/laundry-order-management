# 🧺 CleanPress — Laundry Order Management System

> A lightweight, production-ready order management system for dry cleaning stores.  
> Built with **Node.js + Express**, **MongoDB + Mongoose**, and a **vanilla HTML/CSS/JS** frontend .

---

## 📌 Why I Built This

I built CleanPress because I noticed a real problem: most small dry-cleaning stores near me still manage their daily orders using pen and paper or clunky spreadsheets. This leads to lost clothes, billing mistakes, and absolutely zero visibility into how their business is actually performing.

I wanted to build a lightweight, no-nonsense system to fix this. It provides:
- A **REST API** to handle the entire lifecycle of a laundry order.
- A **browser-based dashboard** that the shop owner can open on any device (even an iPad at the counter).
- **Persistent storage** via MongoDB so nothing gets lost when the power goes out.
- **Zero-friction setup** — I made sure it only takes one command to install and run.

I put this together over a weekend (roughly 72 hours) for an assignment focused on **AI-first development**. My goal was to see how fast I could build a production-ready app by heavily using AI tools for the scaffolding, while relying on my own engineering judgment to fix bugs, refactor the architecture, and polish the user experience.

---

## ✨ Features

### Core Features
| Feature | Details |
|---|---|
| **Create Order** | Customer name, phone, garments with quantity; bill auto-calculated from price list |
| **Unique Order ID** | MongoDB ObjectId, displayed as short uppercase hash in UI |
| **Auto Billing** | Price list built-in (₹40–₹250 per item); override per garment if needed |
| **Order Status Flow** | `RECEIVED → PROCESSING → READY → DELIVERED` |
| **Transition Validation** | Cannot skip steps or go backward — returns `422` with a clear message |
| **View All Orders** | Table view with newest-first ordering |
| **Filter Orders** | By `status`, `customerName`, `phone`, `garmentType`, or combined `search` |
| **Dashboard** | Total orders, total revenue (delivered only), orders per status, recent orders |
| **Delete Order** | Permanent removal with confirmation |
| **Estimated Delivery** | Auto-set to 3 days from order creation |

### Bonus Features
| Feature | Details |
|---|---|
| **Frontend UI** | Full dark-mode UI, no framework, runs in any browser |
| **Real-time Bill Preview** | Order summary updates live as garments are added |
| **Order Detail Modal** | View full details + update status in one click |
| **Toast Notifications** | Non-blocking feedback for every action |
| **Price List Page** | Browse all supported garments and prices |
| **MongoDB Persistence** | Data survives server restarts |
| **Render Deployment** | Ready to deploy in under 10 minutes |

---

## 🗂️ Project Structure

```
laundry-order-management/
│
├── server.js                    # Entry point: DB connection + Express setup
├── package.json                 # Dependencies and scripts
├── .env                         # Local secrets (not committed to git)
├── .env.example                 # Template to share safely
├── .gitignore
│
├── routes/
│   ├── orderRoutes.js           # Maps HTTP verbs/paths to controller functions
│   └── dashboardRoutes.js
│
├── controllers/
│   ├── orderController.js       # Request handling, validation, response
│   └── dashboardController.js   # Dashboard aggregation endpoint
│
├── models/
│   ├── orderSchema.js           # Mongoose schema (shape of data in MongoDB)
│   └── orderModel.js            # All DB operations: create, find, update, delete
│
├── utils/
│   ├── validator.js             # Input validation rules + hardcoded price list
│   ├── response.js              # sendSuccess() / sendError() helpers
│   └── asyncHandler.js          # Wraps async controllers — no try/catch needed
│
└── public/                      # Static frontend (served by Express)
    ├── index.html               # Single-page app shell
    ├── style.css                # Full dark-mode design system
    └── app.js                   # All frontend logic (navigation, API calls, UI)
```

**Pattern:** MVC — Models handle data, Controllers handle logic, Routes handle routing. No over-engineering; each file has one clear job.

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18 or higher — [download](https://nodejs.org)
- **MongoDB** — either:
  - Local: [Install MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: Free [MongoDB Atlas](https://cloud.mongodb.com) cluster (recommended)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example file
copy .env.example .env
```

Open `.env` and set your MongoDB URI:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/laundry

# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/laundry

PORT=3000
```

### 3. Start the Server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

### 4. Open the App

```
http://localhost:3000
```

The frontend and API are both served from the same port.

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:3000/api`

All responses follow this shape:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... }
}
```

---

### `POST /api/orders` — Create Order

**Request body:**
```json
{
  "customerName": "Ravi Kumar",
  "phone": "9876543210",
  "garments": [
    { "type": "shirt", "quantity": 2 },
    { "type": "saree", "quantity": 1, "pricePerItem": 150 }
  ]
}
```

- `pricePerItem` is optional — auto-filled from the price list if omitted
- `status` defaults to `RECEIVED`
- `estimatedDelivery` is auto-set to 3 days from now

**Response `201`:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "664abc1234def5678",
    "customerName": "Ravi Kumar",
    "phone": "9876543210",
    "garments": [
      { "type": "shirt",  "quantity": 2, "pricePerItem": 50  },
      { "type": "saree",  "quantity": 1, "pricePerItem": 150 }
    ],
    "totalAmount": 250,
    "status": "RECEIVED",
    "estimatedDelivery": "2026-05-03",
    "createdAt": "2026-04-30T16:42:00.000Z"
  }
}
```

---

### `GET /api/orders` — List Orders

All query parameters are optional and can be combined:

| Parameter | Type | Description |
|---|---|---|
| `status` | string | Exact match: `RECEIVED`, `PROCESSING`, `READY`, `DELIVERED` |
| `customerName` | string | Partial, case-insensitive |
| `phone` | string | Partial match |
| `garmentType` | string | Matches any garment in the order |
| `search` | string | Combined: name OR phone OR garment |

```http
GET /api/orders?status=PROCESSING
GET /api/orders?customerName=ravi&status=RECEIVED
GET /api/orders?search=saree
```

---

### `GET /api/orders/:id` — Get Single Order

```http
GET /api/orders/664abc1234def5678
```

Returns `404` if not found. Returns `400` if the ID format is invalid.

---

### `PATCH /api/orders/:id/status` — Update Status

```http
PATCH /api/orders/664abc1234def5678/status
Content-Type: application/json

{ "status": "PROCESSING" }
```

**Transition rules:**
- Must move **forward** only: `RECEIVED → PROCESSING → READY → DELIVERED`
- Cannot **skip** steps (e.g. `RECEIVED → READY`)
- Cannot move **backward**

**Error responses:**

| Scenario | HTTP Code | Message |
|---|---|---|
| Invalid status value | `400` | `Invalid status "X". Must be one of: ...` |
| Skipping a step | `422` | `Cannot skip. "RECEIVED" must go to "PROCESSING" next.` |
| Going backward | `422` | `Cannot change status from "READY" to "PROCESSING".` |
| Order not found | `404` | `Order with ID "..." not found` |

---

### `DELETE /api/orders/:id` — Delete Order

```http
DELETE /api/orders/664abc1234def5678
```

Returns `404` if the order doesn't exist.

---

### `GET /api/dashboard` — Dashboard Stats

```http
GET /api/dashboard
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data fetched",
  "data": {
    "totalOrders": 15,
    "totalRevenue": 4800,
    "ordersPerStatus": {
      "RECEIVED":   3,
      "PROCESSING": 5,
      "READY":      4,
      "DELIVERED":  3
    },
    "recentOrders": [ ... ]
  }
}
```

> `totalRevenue` counts only `DELIVERED` orders — revenue not yet earned is excluded.

---

## 💰 Garment Price List (₹ INR)

| Garment | Price | Garment | Price |
|---|---|---|---|
| T-Shirt | ₹40 | Saree | ₹120 |
| Shirt | ₹50 | Bedsheet | ₹130 |
| Blouse | ₹60 | Curtain | ₹150 |
| Pants | ₹60 | Jacket | ₹150 |
| Kurta | ₹70 | Blanket | ₹180 |
| Jeans | ₹80 | Suit | ₹200 |
| Dress | ₹100 | Lehenga | ₹250 |

Override any price by passing `"pricePerItem"` in the garment object.

---

## ☁️ Deploy on Render

### Step 1 — MongoDB Atlas Setup
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Security → Database Access** → Add a user with read/write permissions
3. **Security → Network Access** → Add `0.0.0.0/0` (allow all IPs — required for Render's dynamic IPs)
4. **Database → Connect → Drivers** → Copy your connection string

### Step 2 — Push to GitHub
```bash
git init && git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
> Ensure `.env` is listed in `.gitignore` — never commit secrets.

### Step 3 — Create Web Service on Render
1. [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Use these settings:

| Setting | Value |
|---|---|
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

### Step 4 — Set Environment Variables
In Render → **Environment** tab:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

### Step 5 — Deploy
Click **Create Web Service**. Your app will be live at:
`https://<your-app-name>.onrender.com`

### Common Deployment Mistakes

| Problem | Fix |
|---|---|
| `MongoServerSelectionError` | Atlas Network Access not set to `0.0.0.0/0` |
| App crashes at startup | Check Render **Logs** tab — usually a missing env var |
| Blank page on `/` | Verify Build/Start commands are exact |
| Free tier slow first load | Normal — Render free tier sleeps after 15 min of inactivity |
| Port already in use | Always use `process.env.PORT \|\| 3000`, never hardcode |
| `.env` not found on server | Correct — Render uses its own env panel, not your `.env` file |

---

## 🤖 AI Usage Report

### Tools Used
- **Antigravity by Google DeepMind** — Primary AI coding assistant used for all phases

---

### Phase-by-Phase Breakdown

#### Phase 1 — Project Scaffolding
**Prompt given:**
> *"Create a Node.js + Express project structure for a Laundry Management System. Use MVC pattern. Include routes, controllers, models, utils. No database for now, use in-memory storage."*

**What AI produced:**
- Complete MVC folder structure (`routes/`, `controllers/`, `models/`, `utils/`)
- Working `server.js` with middleware setup, static file serving, 404 handler, and global error handler
- `package.json` with correct dependencies

**Human review:** Structure was clean and needed no changes. AI correctly kept it simple without over-engineering.

---

#### Phase 2 — Order Model Design
**Prompt given:**
> *"Design a simple Order model. Fields: orderId, customerName, phoneNumber, garments (type/quantity/price), totalAmount, status (RECEIVED/PROCESSING/READY/DELIVERED), createdAt. Keep it simple — JavaScript object, no DB."*

**What AI produced:**
- `orderModel.js` with in-memory array storage
- `create()`, `findAll()`, `findById()`, `updateStatus()`, `delete()`, `getStats()` methods
- JSDoc comment block describing the order shape

**Human improvements:**
- Added `estimatedDelivery` field (3 days from creation) — AI didn't think of this
- Added `updatedAt` timestamp alongside `createdAt`
- Added `recentOrders` to `getStats()` for the dashboard preview table

---

#### Phase 3 — Create Order API
**Prompt given:**
> *"Build an Express API to create a laundry order. Input: customerName, phoneNumber, garments (type, quantity). Use predefined price list: Shirt=10, Pants=15, Saree=20. Calculate totalAmount automatically. Generate unique orderId. Default status = RECEIVED."*

**What AI produced:**
- `orderController.js` with `createOrder` function
- `validator.js` with `validateOrderPayload()` and `normalizeGarments()`
- Price list object with auto-fill logic
- `response.js` helpers (`sendSuccess`, `sendError`) for consistent API shape

**Human improvements:**
- AI used USD-style prices (Shirt=$10) — corrected to realistic INR values (Shirt=₹50, Saree=₹120, etc.) appropriate for an Indian store
- AI's validator didn't handle the case where a garment type is unknown and no `pricePerItem` is given — added that check with a clear error message

---

#### Phase 4 — Update Status API
**Prompt given:**
> *"Create an API to update order status. Valid statuses: RECEIVED, PROCESSING, READY, DELIVERED. Validate status transitions — no skipping DELIVERED directly."*

**What AI produced:**
- `updateOrderStatus` controller with `VALID_STATUSES` check
- Transition logic checking current vs new index in the status array
- Used `400` status code for transition errors

**Human improvements:**
- Changed transition error HTTP code from `400` to `422 Unprocessable Entity` — semantically correct (the request is well-formed, the business rule is violated)
- Added separate error messages for "going backward" vs "skipping a step" for better API usability
- AI checked the order existed after the transition check — reordered to fetch the order first, then validate transition

---

#### Phase 5 — Fetch Orders API with Filters
**Prompt given:**
> *"Create an API to fetch orders. Features: get all orders, filter by status, customerName, phoneNumber."*

**What AI produced:**
- `getAllOrders` controller with a single `search` query parameter

**Human improvements:**
- AI used one combined `search` param — refactored to proper separate params (`customerName`, `phone`, `garmentType`, `search`) matching standard REST conventions
- Updated `orderModel.findAll()` to build the query conditionally from whichever params are present
- All params remain combinable (e.g. `?status=RECEIVED&customerName=ravi`)

---

#### Phase 6 — Dashboard API
**Prompt given:**
> *"Create a dashboard API. Return: totalOrders, totalRevenue, ordersPerStatus (count per status)."*

**What AI produced:**
- `getDashboard` controller + `getStats()` in the model
- Correct aggregation of all three required fields

**Human improvements:**
- Added `recentOrders` (5 most recent) — useful for the dashboard preview and not much extra code
- Clarified that `totalRevenue` should count **only DELIVERED orders** — AI initially counted all orders regardless of status

---

#### Phase 7 — Error Handling
**Prompt given:**
> *"Improve the APIs with proper error handling. Include: invalid input, missing fields, order not found, clean error responses."*

**What AI produced:**
- Consistent `{ success, message, errors }` response shape
- Field-level error messages for validation failures

**Human improvements:**
- AI generated controllers without `try/catch` — added `asyncHandler.js` wrapper utility instead, which is cleaner (no repetitive boilerplate in every controller)
- Added `CastError` handler in the global error middleware for when an invalid MongoDB ObjectId is passed as `:id`

---

#### Phase 8 — MongoDB Migration
**Prompt given:**
> *"Convert the in-memory storage to MongoDB using Mongoose. Keep schema simple. Do not overcomplicate."*

**What AI produced:**
- `orderSchema.js` with embedded `garmentSchema`
- Async model methods using `find()`, `findById()`, `findByIdAndUpdate()`, `aggregate()`
- `dotenv` integration for `MONGODB_URI`

**Human improvements:**
- Added `{ _id: false }` to garment sub-schema (Mongoose adds `_id` to sub-documents by default — unnecessary overhead here)
- Added `toJSON` transform to expose `id` (string) and remove `_id` and `__v` from responses, keeping the API shape consistent with the in-memory version
- Added `engines` field to `package.json` so Render selects the correct Node version automatically

---

#### Phase 9 — Frontend
**Prompt given:**
> *"Create a simple HTML + JS frontend for: create order, view orders, update status. No frameworks. Keep UI minimal."*

**What AI produced:**
- Full single-page app with sidebar navigation
- Dashboard, Orders list, Create Order form, and Price List pages
- Order detail modal with inline status update
- Toast notifications and success overlay

**Human review:** AI delivered a premium dark-mode UI with animations, real-time bill preview, and search/filter functionality — well beyond "minimal" but aligned with the overall quality bar. No significant corrections needed.

---

### Summary Table

| What AI Did Well | What Needed Human Fixes |
|---|---|
| MVC structure — clean first time | Price list values (USD → INR) |
| Status transition logic | Single `search` → proper separate filter params |
| `asyncHandler` pattern | `recentOrders` not included in dashboard |
| Mongoose embedded sub-schema | Revenue counted all orders, not just DELIVERED |
| Global error handler | `CastError` for bad ObjectIds not handled |
| Full frontend with no framework | `_id`/`__v` leaking into API responses |
| MongoDB aggregation (`$group`) | `422` vs `400` for transition errors |

---

## ⚖️ Tradeoffs & My Thought Process

When you only have 72 hours, you have to make some tough calls. Here is why I built things the way I did:

### Deliberate Decisions

| Decision | Why I did it |
|---|---|
| **Moving from In-memory to MongoDB** | Storing data in memory is fine for a quick demo, but I wanted this app to be actually usable in the real world. Losing all orders on a server restart is unacceptable. |
| **Vanilla HTML/JS instead of React** | I love React, but for a simple CRUD dashboard, a build step (Webpack/Vite) felt like overkill. I wanted a zero-dependency frontend that anyone could just open and run. |
| **Embedding garments in the order schema** | I thought about making a separate `Garments` collection, but garments don't exist independently of an order. Embedding them is the correct NoSQL pattern and makes queries way faster. |
| **Status validation in the controller** | I kept my Mongoose models strictly for database operations and put business logic (like checking if you can skip from `RECEIVED` to `DELIVERED`) in the controllers. Clean separation of concerns. |
| **No Authentication** | Building a secure login system takes time. I skipped it to focus entirely on perfecting the order management flow, though it would definitely be the very next thing I add. |

### Things I Purposely Skipped

| Feature | Why I skipped it |
|---|---|
| **Pagination** | A single neighborhood store usually doesn't have thousands of active orders at once. Fetching all active orders is perfectly fine for this scale. |
| **Automated Testing (Jest)** | Manual API testing via Postman and the UI was faster for this tight deadline. |
| **WebSockets for real-time updates** | Polling the API when you navigate between pages is more than adequate for this use case. |

---

## 🔮 Future Improvements

With more time, these would be the next steps in priority order:

1. **JWT Authentication** — Store staff log in; orders scoped to a store account
2. **Pagination** — `?page=1&limit=20` for stores with high daily volume
3. **SMS / WhatsApp Notification** — Notify customer when order is `READY` (via Twilio or MSG91)
4. **Order Receipt PDF** — Downloadable receipt per order using `pdfkit`
5. **Unit + Integration Tests** — Jest + Supertest covering all controller flows
6. **Per-garment Status Tracking** — Individual piece-level tracking, not just order-level
7. **Analytics Dashboard** — Revenue trends, busiest days, most common garment types
8. **Barcode / QR Labels** — Print a QR code per order for quick scanning at the counter

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 18 | Widely supported, great async performance |
| Framework | Express 4 | Minimal, no magic, easy to reason about |
| Database | MongoDB + Mongoose | Simple schema, free Atlas tier, fast to prototype |
| Frontend | Vanilla HTML/CSS/JS | No build step, zero dependencies, runs anywhere |
| Hosting | Render (free tier) | Git-connected auto-deploy, zero config |
| ID generation | MongoDB ObjectId | Built into Mongoose, globally unique |
| Config | dotenv | Industry standard for environment variables |

---

*Built in 72 hours · AI-assisted · No over-engineering*
