# Koorm — Clothing E-Commerce Web App

A full-stack e-commerce app for clothing, built with **React (Vite + Tailwind CSS)**, **Node.js/Express**, and **MySQL**. Checkout uses **Cash on Delivery only** — no payment gateway integration.

## Features

- Browse products by category (Men, Women, Kids, Footwear, Accessories) with search, sort, and price filters
- Product detail pages with image gallery, size/quantity selection, ratings & reviews
- Cart, wishlist, and Cash-on-Delivery checkout
- User accounts: register/login (JWT), order history, order cancellation
- Admin panel: dashboard stats, product CRUD, order status management — separate login with shared database storage (see below)
- Clean, responsive UI inspired by Andamen / Myntra / Neemans

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express, JWT auth, bcrypt
- **Database:** MySQL (raw SQL via `mysql2`)

## Project Structure

```
koorm_cloths/
├── server/     # Express API + MySQL
└── client/     # React frontend
```

## Setup

### 1. Database

Koorm uses one MySQL database for customer, catalog, order, and admin data. Admin authentication still uses a separate JWT secret and login path:

```bash
mysql -u root -p < server/schema.sql        # koorm_db: users, products, orders, etc.
mysql -u root -p < server/admin_schema.sql  # koorm_db: admins table
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env    # edit DB_PASSWORD, JWT_SECRET, ADMIN_JWT_SECRET, etc.
npm run seed             # provisions admin@koorm.com; finish setup from /admin/login
npm run dev               # starts API on http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev               # starts app on http://localhost:5173
```

### 4. Login

- **Customer:** register a new account from the UI (`/register`, `/login`).
- **Admin:** separate login at `/admin/login` (also linked in the footer). `npm run seed` provisions the configured admin email; the first login emails an OTP and asks you to set the admin password. Admin sessions are stored independently in the browser (`koorm_admin` in localStorage) from customer sessions (`koorm_user`), so you can be logged in as both at once in the same browser.

## Notes

- Checkout only supports Cash on Delivery; no payment gateway is integrated.
- Admin and customer identities remain logically separate in `koorm_db.users` and `koorm_db.admins`, with separate JWT secrets (`JWT_SECRET` / `ADMIN_JWT_SECRET`) and auth middleware (`protect` / `protectAdmin` in `server/middleware/auth.js`). A customer token is rejected by every `/api/admin/*` route and an admin token is rejected by every customer route.
- Product images for the Linen/Textured Shirt line are real product photography, served from `client/public/images/products/`. Other seed products still use placeholder URLs (picsum.photos) — swap in real photography via the admin panel.
- Free shipping is applied automatically on orders ≥ ₹1999 (configurable in `server/controllers/orderController.js`).
