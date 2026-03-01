# 🏢 TES Property System Backend - MySQL Express API

A professional REST API backend for the **TES Property System**, powered by **Express + MySQL**. Handles authentication, property listings, user management, inquiries, calendar events, and activity logging — ready to pair with the [SIAnewFINALfixed](https://github.com/HansLagmay/SIAnewFINALfixed) React frontend.

---

## 🎯 Overview

This repository contains the **backend-only** service for TES Property System. It exposes a JSON REST API consumed by the React frontend.

Key highlights:
- **MySQL (`TESdb`)** as the relational database via `mysql2`
- **JWT authentication** with role-based access (Admin / Agent)
- **bcryptjs** password hashing
- **multer** image upload handling
- **helmet** + **express-rate-limit** for hardened security
- Schema creation and seed scripts for instant DB setup
- Drop-in compatible with the SIAnewFINALfixed React frontend

---

## 🚀 Fullstack Quick Start

This repository is a **fullstack monorepo** — run both the React frontend and Express+MySQL backend with a single command.

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Steps

1. **Clone and install**
   ```bash
   git clone https://github.com/HansLagmay/siaFINALwithbackend-database.git
   cd siaFINALwithbackend-database
   npm run install:all
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env — set DB_PASSWORD and JWT_SECRET
   ```

3. **Set up database**
   ```bash
   npm run db:schema   # Creates all tables in TESdb
   npm run db:seed     # Inserts demo users and sample data
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```
   - 🌐 Frontend: **http://localhost:5173**
   - 🔌 Backend API: **http://localhost:3000/api**

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@tesproperty.com | admin123 |
| **Agent** | maria@tesproperty.com | agent123 |
| **Agent** | juan@tesproperty.com | agent123 |

> 💡 The Login page has **Quick Demo Login** buttons — just click to auto-fill credentials!

---

## ✅ Features

- 🔐 **JWT Authentication** — 30-day session tokens, role-based guards (Admin / Agent)
- 🔒 **Password Hashing** — bcryptjs with 10 salt rounds
- 🛡️ **Security Headers** — helmet middleware on all responses
- 🚦 **Rate Limiting** — brute-force protection via express-rate-limit
- 🏠 **Property Management** — full CRUD with draft/publish workflow and image upload
- 👥 **User Management** — admin CRUD for agents and admins
- 📬 **Inquiries** — public submission, admin/agent resolution workflow
- 📅 **Calendar Events** — viewing schedule management
- 📋 **Activity Log** — audit trail of all state-changing actions
- 🗃️ **Database Utilities** — admin endpoints to inspect raw table data
- 🖼️ **Image Upload** — multer with 5 MB limit, stored under `server/uploads/properties/`
- ⚙️ **Schema & Seed Scripts** — one-command database bootstrapping

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.18+ | REST API framework |
| **mysql2** | 3.6+ | MySQL driver & connection pool |
| **jsonwebtoken** | 9.0+ | JWT authentication |
| **bcryptjs** | 2.4+ | Password hashing |
| **multer** | 2.0+ | Multipart file upload |
| **helmet** | 7.0+ | HTTP security headers |
| **express-rate-limit** | 6.7+ | Request rate limiting |
| **dotenv** | 16.0+ | Environment variable loading |
| **cors** | 2.8+ | Cross-origin resource sharing |
| **uuid** | 9.0+ | Unique ID generation |

### Dev Tooling
| Technology | Version | Purpose |
|------------|---------|---------|
| **nodemon** | 3.0+ | Auto-reload on file changes |

### Database
| Technology | Purpose |
|------------|---------|
| **MySQL 8+** | Relational data storage (`TESdb`) |

---

## 📦 Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9+
- **MySQL** 8.0+ running locally (or a remote instance)
- **Git**

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/HansLagmay/siaFINALwithbackend-database.git
cd siaFINALwithbackend-database
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials and a strong JWT secret:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=TESdb

# JWT
JWT_SECRET=change_this_to_a_long_random_secret_minimum_32_chars
JWT_EXPIRES_IN=30d
```

### 4. Create the Database Schema
```bash
npm run db:schema
```

### 5. Seed Sample Data
```bash
npm run db:seed
```

### 6. Start the Server
```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The API is now available at **`http://localhost:3000/api`**.

---

## 🗄️ Database Setup

The `TESdb` MySQL database is created and populated with two commands:

| Command | Script | What it does |
|---------|--------|--------------|
| `npm run db:schema` | `scripts/createSchema.js` | Creates all tables (users, properties, inquiries, calendar_events, activity_log) |
| `npm run db:seed` | `scripts/seedDatabase.js` | Inserts default admin/agent accounts and sample property data |

### Tables Created
```
TESdb
├── users                  # Admin and agent accounts
├── properties             # Property listings
├── inquiries              # Customer inquiries
├── calendar_events        # Viewing schedule entries
└── activity_log           # Audit trail of all actions
```

> ⚠️ Running `db:schema` on an existing database is safe — tables are created with `CREATE TABLE IF NOT EXISTS`.

### Connecting to the Frontend

In the SIAnewFINALfixed frontend project set:
```env
VITE_API_URL=http://localhost:3000/api
```

The Vite dev server defaults to `http://localhost:5173`, which is already allowed by the backend CORS configuration.

---

## 🔑 Default Credentials

> ⚠️ Change all default passwords before any public/production deployment.

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@tesproperty.com` | `admin123` | Full access — all features |
| **Agent** | `maria@tesproperty.com` | `agent123` | Inquiries, calendar, properties |
| **Agent** | `juan@tesproperty.com` | `agent123` | Inquiries, calendar, properties |

All passwords are **hashed with bcryptjs** — plain-text values are never stored in the database.

---

## 📋 Scripts

```bash
# Start server in development mode (auto-reload)
npm run dev

# Start server in production mode
npm start

# Create all MySQL tables in TESdb
npm run db:schema

# Seed default users and sample properties
npm run db:seed
```

---

## 🔌 API Endpoints

All routes are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/login` | Login, returns JWT token | ❌ |

### Health Check
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Server heartbeat | ❌ |

### Properties
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/properties` | List all properties (paginated) | ❌ |
| GET | `/api/properties/:id` | Get single property | ❌ |
| POST | `/api/properties` | Create property | ✅ Admin |
| POST | `/api/properties/draft` | Create draft property | ✅ Agent |
| POST | `/api/properties/upload` | Upload property images | ✅ Admin |
| PUT | `/api/properties/:id` | Update property | ✅ Admin |
| DELETE | `/api/properties/:id` | Delete property | ✅ Admin |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | List all users | ✅ Admin |
| POST | `/api/users` | Create user | ✅ Admin |
| PUT | `/api/users/:id` | Update user | ✅ Admin |
| DELETE | `/api/users/:id` | Delete user | ✅ Admin |

### Inquiries
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/inquiries` | List inquiries | ✅ Admin / Agent |
| POST | `/api/inquiries` | Submit inquiry | ❌ |
| PUT | `/api/inquiries/:id` | Update inquiry status | ✅ Admin / Agent |
| DELETE | `/api/inquiries/:id` | Delete inquiry | ✅ Admin |

### Calendar
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/calendar` | List calendar events | ✅ Admin / Agent |
| POST | `/api/calendar` | Create event | ✅ Admin / Agent |
| PUT | `/api/calendar/:id` | Update event | ✅ Admin / Agent |
| DELETE | `/api/calendar/:id` | Delete event | ✅ Admin / Agent |

### Activity Log
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/activity-log` | View audit log | ✅ Admin |

### Database Utilities
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/database` | Inspect raw table data | ✅ Admin |

---

## 🌄 Uploads

Property images are stored in `server/uploads/properties/` and served as static files.

### Serve an uploaded image
```
GET /uploads/properties/<filename>
```

### Upload images for a property (Admin only)
```
POST /api/properties/upload
Content-Type: multipart/form-data
Field name: images
```

- **Max file size**: 5 MB per image
- **Accepted formats**: JPEG, PNG, WebP
- **Storage path**: `server/uploads/properties/`

---

## 📁 Repository Structure

```
siaFINALwithbackend-database/
├── .env.example                # Environment variable template
├── .gitignore
├── package.json                # Dependencies & npm scripts
├── README.md                   # This file
├── scripts/
│   ├── createSchema.js         # Creates all MySQL tables (npm run db:schema)
│   └── seedDatabase.js         # Seeds users and sample data (npm run db:seed)
└── server/
    ├── index.js                # Express app entry point
    ├── db.js                   # MySQL connection pool (mysql2)
    ├── middleware/
    │   ├── auth.js             # JWT authentication & role guards
    │   ├── rateLimiter.js      # express-rate-limit configurations
    │   ├── sanitize.js         # Input sanitization
    │   ├── upload.js           # multer configuration
    │   └── logger.js           # Activity log helper
    ├── routes/
    │   ├── auth.js             # POST /api/login
    │   ├── users.js            # /api/users
    │   ├── properties.js       # /api/properties
    │   ├── inquiries.js        # /api/inquiries
    │   ├── calendar.js         # /api/calendar
    │   ├── activity-log.js     # /api/activity-log
    │   └── database.js         # /api/database (admin utilities)
    └── uploads/
        └── properties/         # Uploaded property images
```

---

## 🔒 Security

### Implemented Security Measures
- **JWT Tokens** — 30-day signed tokens; all protected routes verify the `Authorization: Bearer <token>` header
- **Password Hashing** — bcryptjs with 10 salt rounds; plain-text passwords are never persisted
- **Helmet** — sets secure HTTP headers on every response (X-Frame-Options, Content-Security-Policy, etc.)
- **Rate Limiting** — express-rate-limit blocks repeated requests to prevent brute-force attacks
- **CORS** — restricted to `CORS_ORIGIN` value in `.env`; defaults to `http://localhost:5173`
- **Input Sanitization** — middleware strips/escapes dangerous input before it reaches route handlers
- **Role Guards** — Admin-only and Agent-accessible routes enforced at middleware level
- **Environment Secrets** — `JWT_SECRET` and DB credentials loaded from `.env`; never committed to source control

### Production Recommendations
- Set `NODE_ENV=production`
- Use a randomly generated `JWT_SECRET` of at least 64 characters
- Run MySQL with a dedicated user that has minimal privileges on `TESdb` only
- Serve behind a reverse proxy (nginx) with HTTPS
- Change all default seeded passwords immediately after first login

---

## 🚨 Common Issues

### Cannot connect to MySQL
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Make sure MySQL is running: `sudo service mysql start` (Linux) or start MySQL from MAMP/WAMP
- Verify `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` in `.env`

### Unknown database 'TESdb'
```
Error: Unknown database 'TESdb'
```
- Run `npm run db:schema` to create the database and all tables

### JWT errors / 401 Unauthorized
- Ensure `JWT_SECRET` in `.env` is set and has not changed since tokens were issued
- Check that the `Authorization: Bearer <token>` header is included in requests

### Port already in use
```
Error: listen EADDRINUSE :::3000
```
- Change `PORT` in `.env` to a free port, e.g. `3001`
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill`

### Image upload fails
- Confirm `server/uploads/properties/` directory exists (created automatically on first run)
- Ensure the file is under 5 MB and is a valid image type (JPEG, PNG, WebP)

---

## 🗓️ Update Log

| Version | Date | Changes |
|---------|------|---------|
| **1.0.0** | 2026-01-20 | Initial release — Express + MySQL backend with JWT auth, full CRUD, image upload, seed scripts |

---

## 🤝 Contributions

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support

- **GitHub Issues**: [Report a bug](https://github.com/HansLagmay/siaFINALwithbackend-database/issues)
- **Discussions**: [Ask questions](https://github.com/HansLagmay/siaFINALwithbackend-database/discussions)

---

**Version:** 1.0.0  
**Last Updated:** January 20, 2026  
**Maintained by:** HansLagmay

---

⭐ **Star this repo if it saved you time!**

🎓 **Perfect for:**
- Learning Node.js + MySQL REST API development
- Backend integration with React/Vite frontends
- Portfolio projects demonstrating JWT auth and relational databases
- Understanding Express middleware architecture
