# AI Usage Report
## Project: CleanPress — Laundry Order Management System

> This document describes how I used AI tools during the development of this project,
> including exact prompts, what the AI produced, where it fell short, and how I fixed it.

---

## Tools Used

| Tool | Purpose |
|---|---|
| **ChatGPT (GPT-4o)** | Initial planning, MVC structure design, understanding MongoDB aggregation |
| **Antigravity (Google DeepMind)** | Primary coding assistant — writing and iterating on all backend and frontend files |

Both tools were used heavily. ChatGPT was used more for thinking through architecture and asking conceptual questions. Antigravity was used for actual code generation, file creation, and iterative fixes.

---

## How I Used AI (Overview)

Instead of writing code from scratch, I broke the project into small focused prompts and asked AI to handle each piece. My role was to:

- Write clear, specific prompts
- Review every output before using it
- Spot mistakes and either fix them manually or re-prompt
- Connect pieces together and test the full system

This approach let me build a working full-stack system in a few hours instead of days.

---

## Prompt-by-Prompt Breakdown

---

### Prompt 1 — Project Structure

**Tool:** ChatGPT

**Prompt I used:**
```
You are a senior backend engineer.

Create a Node.js + Express project structure for a "Laundry Order Management System".

Requirements:
- Keep it simple and clean
- Use MVC pattern (basic, not over-engineered)
- Include: routes, controllers, models, utils
- No database for now (use in-memory storage)

Output: Folder structure, basic server.js setup, required npm packages
```

**What AI produced:**
- Clean MVC folder layout: `routes/`, `controllers/`, `models/`, `utils/`
- A working `server.js` with Express middleware, static file serving, 404 handler
- `package.json` with the right dependencies (`express`, `cors`, `uuid`)

**Where AI helped:** The structure came out clean and consistent first try. I didn't need to restructure anything. This alone saved 30–45 minutes of planning.

**Where AI fell short:** Nothing major here — this was a straightforward prompt and AI handled it well.

---

### Prompt 2 — Order Model

**Tool:** Antigravity

**Prompt I used:**
```
Design a simple Order model for a Laundry Management System.

Fields:
- orderId (unique)
- customerName
- phoneNumber
- garments (array of { type, quantity, price })
- totalAmount
- status (RECEIVED, PROCESSING, READY, DELIVERED)
- createdAt

Keep it simple (JavaScript object, no DB).
Output: Model structure + example object
```

**What AI produced:**
- `orderModel.js` with an in-memory array acting as the database
- `create()`, `findAll()`, `findById()`, `updateStatus()`, `delete()`, `getStats()` methods
- Proper JSDoc comment block at the top describing the order shape

**Where AI helped:** Generated all the CRUD methods correctly. The `getStats()` aggregation for the dashboard was a nice addition AI included without me asking.

**What I fixed:**
- AI didn't include `estimatedDelivery` — I added it (set to 3 days from order creation) since knowing pickup date is critical for a laundry store
- AI only added `createdAt`, I also added `updatedAt` so we track when status changes
- AI's `getStats()` counted revenue from all orders. I corrected it to count only `DELIVERED` orders — unreceived revenue shouldn't appear in the total

---

### Prompt 3 — Create Order API

**Tool:** Antigravity

**Prompt I used:**
```
Build an Express API to create a laundry order.

Requirements:
- Input: customerName, phoneNumber, garments (type, quantity)
- Use predefined price list: Shirt = 10, Pants = 15, Saree = 20
- Calculate totalAmount automatically
- Generate unique orderId
- Default status = RECEIVED

Output: Controller code, route, example request/response
```

**What AI produced:**
- `orderController.js` with `createOrder` function
- `validator.js` with input validation and a price list
- `response.js` with `sendSuccess()` and `sendError()` helpers for consistent response shape
- Correct `uuid` usage for generating order IDs

**Where AI helped:** The validation logic and response helper pattern were solid. Having `sendSuccess()` and `sendError()` as shared utilities kept the codebase consistent without me having to think about it.

**What I fixed:**
- **Price list values were wrong.** AI used Shirt=$10, Pants=$15, Saree=$20 — these are USD prices and make no sense for an Indian dry-cleaning store. I corrected to Shirt=₹50, Pants=₹60, Saree=₹120 and expanded the list to 14 garment types
- AI's validator didn't handle the case where a garment type is not in the price list AND no `pricePerItem` is provided. I added that check with a clear error message pointing the user to provide `pricePerItem` manually

---

### Prompt 4 — Update Status API

**Tool:** Antigravity

**Prompt I used:**
```
Create an API to update order status.

Requirements:
- Input: orderId, new status
- Valid statuses: RECEIVED, PROCESSING, READY, DELIVERED
- Validate status transitions (no skipping DELIVERED directly)

Output: Controller code, validation logic, example request
```

**What AI produced:**
- `updateOrderStatus` controller with status validation
- Transition logic using index comparison (`newIdx - currentIdx`)
- Error messages when invalid transitions are attempted

**Where AI helped:** The core transition logic was correct — comparing positions in the `VALID_STATUSES` array to detect skips and backward moves was the right approach.

**What I fixed:**
- **Wrong HTTP status code.** AI returned `400 Bad Request` for transition violations. I changed this to `422 Unprocessable Entity` — the request is syntactically valid, it's a business rule violation, so 422 is semantically correct
- **Order of operations was wrong.** AI checked the transition before fetching the order, meaning it would try to validate against a non-existent order. I reordered: fetch the order first, return 404 if not found, then validate the transition
- AI gave one generic error message for all transition failures. I split it into two: one for "going backward / same status" and one for "skipping a step" — much clearer for the API consumer

---

### Prompt 5 — Fetch Orders with Filters

**Tool:** Antigravity

**Prompt I used:**
```
Create an API to fetch orders.

Features:
- Get all orders
- Filter by: status, customerName, phoneNumber

Output: Controller code, query filtering logic
```

**What AI produced:**
- `getAllOrders` controller function
- A single combined `?search=` query parameter that matched against name, phone, and garment

**Where AI fell short:** Using one `search` param for everything is fine for a search box but it's not proper REST filtering. Standard APIs use separate params (`?customerName=ravi&status=RECEIVED`).

**What I fixed:**
- Replaced the single `search` param with proper separate query params: `?customerName=`, `?phone=`, `?garmentType=`, `?status=`
- Kept `?search=` as an optional combined shorthand for the frontend search box
- Updated `orderModel.findAll()` to build the DB query conditionally from whichever params are present
- Made all params combinable — you can do `?status=RECEIVED&customerName=ravi&garmentType=shirt` in one request

---

### Prompt 6 — Dashboard API

**Tool:** Antigravity

**Prompt I used:**
```
Create a dashboard API for laundry system.

Return:
- totalOrders
- totalRevenue
- ordersPerStatus (count per status)

Output: Logic, sample JSON response
```

**What AI produced:**
- `getDashboard` controller and `getStats()` model method
- Correct aggregation for all three required fields

**Where AI helped:** The structure matched the requirement exactly. No significant issues.

**What I added:**
- `recentOrders` — the 5 most recent orders — as a bonus field. Useful for the dashboard preview table and costs almost nothing to add
- Clarified that `totalRevenue` should only include `DELIVERED` orders (AI had counted all orders)

---

### Prompt 7 — Error Handling

**Tool:** Antigravity

**Prompt I used:**
```
Improve the APIs with proper error handling.

Include:
- Invalid input handling
- Missing fields
- Order not found
- Clean error responses

Keep it simple.
```

**What AI produced:**
- More specific error messages in each controller
- Consistent use of `sendError()` for all failure paths

**Where AI fell short:** All controllers were synchronous functions with no `try/catch`. If anything threw unexpectedly (like a DB error), the error would be unhandled and crash Express.

**What I fixed:**
- Created `asyncHandler.js` — a wrapper utility that catches any async error and forwards it to Express's global error handler via `next(err)`. This means no `try/catch` needed in every controller
- Added `CastError` detection in the global error handler — when someone passes an invalid MongoDB ObjectId as `:id`, Mongoose throws a `CastError`. Without handling this, it returns a confusing 500. I made it return a clear 400 with "Invalid order ID format"

---

### Prompt 8 — Refactor for Readability

**Tool:** Antigravity

**Prompt I used:**
```
Refactor the code to improve readability and structure.

Rules:
- No over-engineering
- Keep it beginner-friendly
- Add comments
```

**What AI produced:**
- Inline comments throughout `orderModel.js` explaining each method
- Consistent naming and spacing

**Where AI helped:** The comments AI added were genuinely useful and beginner-friendly — not just restating the code but explaining *why* (e.g., "we copy the array so we don't mutate the original").

**What I reviewed:** Comments were accurate and well-placed. No corrections needed.

---

### Prompt 9 — MongoDB Integration

**Tool:** Antigravity

**Prompt I used:**
```
Convert the in-memory storage to MongoDB using Mongoose.

Keep schema simple.
Do not overcomplicate.
```

**What AI produced:**
- `orderSchema.js` with a main schema and embedded garment sub-schema
- Async model methods using `find()`, `findByIdAndUpdate()`, `aggregate()`
- `dotenv` setup for `MONGODB_URI`
- Updated `server.js` to connect before starting

**Where AI helped:** The Mongoose schema with embedded garments was the right design — garments don't exist independently of orders, so embedding is correct MongoDB practice. The `$group` aggregation for `ordersPerStatus` was also correct.

**What I fixed:**
- Mongoose adds `_id` to embedded sub-documents by default. AI didn't set `{ _id: false }` on the garment sub-schema — I added it since garment IDs are unnecessary
- AI's response was leaking `_id` and `__v` fields into API responses. I added a `toJSON` transform to the schema to expose a clean `id` field and remove `_id` and `__v` — keeping the API response shape identical to the in-memory version
- Added `engines: { "node": ">=18.0.0" }` to `package.json` for correct Render deployment behavior

---

### Prompt 10 — Frontend

**Tool:** Antigravity

**Prompt I used:**
```
Create a simple HTML + JS frontend for:
- Create order
- View orders
- Update status

No frameworks. Keep UI minimal.
```

**What AI produced:**
- A full single-page app with sidebar navigation
- Dashboard, Orders list, Create Order form, Price List pages
- Real-time bill preview as garments are added
- Order detail modal with inline status update
- Toast notifications and success overlay
- Dark mode with smooth animations

**Where AI helped:** The frontend was comprehensive — well beyond "minimal" but high quality. The live bill calculation and the status badge system were clean implementations.

**What I checked:** Verified all API calls use the correct endpoints. Confirmed the search/filter params match the updated backend. No functional bugs found.

---

### Prompt 11 — Deployment Guide

**Tool:** Antigravity

**Prompt I used:**
```
Guide me step-by-step to deploy this Node.js app on Render.

Include:
- Setup
- Environment variables
- Common mistakes
```

**What AI produced:**
- Step-by-step Render deployment instructions
- MongoDB Atlas setup walkthrough
- Common mistakes table with fixes

**Where AI helped:** The guide was accurate and practical. The common mistakes table (especially the `0.0.0.0/0` Atlas network access tip and the "free tier sleeps after 15 min" note) was exactly the kind of thing a first-time deployer would get stuck on.

---

## Honest Assessment

### Where AI Genuinely Saved Time
- Generating boilerplate (MVC structure, package.json, middleware setup) — saved ~1 hour
- Writing validation logic and error messages — saved ~30 min
- Mongoose schema design — correct first try, no structural changes needed
- Frontend layout — saved ~3–4 hours of HTML/CSS work

### Where I Had to Think for Myself
- Correcting price list to INR values — AI had no context about the Indian market
- Choosing `422` over `400` for business rule violations — requires HTTP spec knowledge
- Adding `estimatedDelivery` — product thinking, not just coding
- Splitting `?search` into proper separate filter params — API design judgment
- The `asyncHandler` pattern — AI generated try/catch everywhere; the wrapper approach is cleaner
- `recentOrders` in the dashboard — thinking about what's actually useful for the end user

### Biggest AI Mistake
The most impactful error was **revenue calculation including all orders** instead of only delivered ones. If left unfixed, the dashboard would show inflated revenue numbers — reporting money that hasn't been earned yet. This is a real business logic bug that could cause bad decisions. AI didn't ask for clarification on this; it just made an assumption. This is why every AI output needs review.

---

## Conclusion

AI tools made this project possible within the time limit. But AI is a fast first-draft generator, not a final answer machine. Every output needed review. About 30–40% of AI code needed some correction — ranging from minor (wrong HTTP code) to significant (revenue calculation logic, filter param design).

The workflow that worked best:
1. Write a focused, specific prompt with clear output expectations
2. Read the AI output critically before using it
3. Test it — not just "does it run" but "does it do the right thing"
4. Fix what's wrong and note it (this document)

AI is fast. Judgment is still yours.
