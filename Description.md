# Planning Center — Project Architecture & Technologies

## Project Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Frontend)                    │
│  React 18 + Vite + React Router v6 (http://localhost:5173)      │
├─────────────────────────────────────────────────────────────────┤
│                      NETWORK LAYER                              │
│  HTTP/REST API + JWT Bearer Tokens + CORS                       │
├─────────────────────────────────────────────────────────────────┤
│                    SERVER LAYER (Backend)                       │
│  Express.js + Middleware Stack (http://localhost:4000)          │
│  ├── Auth Middleware (JWT validation + token blacklist)         │
│  ├── Error Handler (centralized error management)               │
│  ├── CORS Handler                                               │
│  └── Route Handlers (/api/auth, /api/events, etc.)              │
├─────────────────────────────────────────────────────────────────┤
│                  DATA ACCESS LAYER                              │
│  Prisma ORM (schema-driven, auto-migrations)                    │
├─────────────────────────────────────────────────────────────────┤
│                   PERSISTENCE LAYER                             │
│  ├── PostgreSQL (relational data)                               │
│  ├── Redis (optional, token blacklist cache)                    │
│  └── Nodemailer (SMTP email service)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User Registration/Login
   └─> Hash password (bcryptjs) → Store in PostgreSQL
   
2. Token Generation
   └─> JWT signed with JWT_SECRET → Sent to client
   
3. Protected Request
   ├─> Client sends: Authorization: Bearer <token>
   ├─> Server: Verify JWT signature
   ├─> Server: Check Redis blacklist (if logout)
   └─> Server: Extract user info from token payload
   
4. Token Revocation (Logout)
   └─> Add token to Redis blacklist (TTL = expiration time)
```

### Data Flow

```
Frontend (React)
   ↓ (HTTP/JSON)
API Service Layer (auth.service.js, event.service.js, etc.)
   ↓ (Token injection via http.js)
Express Router (POST /api/auth/login, GET /api/events, etc.)
   ↓
Middleware (requireAuth, requireRole, errorHandler)
   ↓
Route Handler (business logic)
   ↓
Prisma Client (ORM)
   ↓
PostgreSQL Database
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI component library | 18.3.1 |
| **Vite** | Module bundler & dev server | 7.3.6 |
| **React Router** | Client-side routing | 6.26.0 |
| **Chart.js** | Data visualization (dashboards) | 4.5.1 |
| **QRCode** | QR code generation (tickets) | 1.5.4 |
| **jsPDF** | PDF generation (invoices, reports) | 4.2.1 |
| **html2canvas** | HTML to image conversion | 1.4.1 |

### Backend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Express.js** | Web framework & HTTP server | 4.19.2 |
| **Prisma** | ORM for database access | 7.8.0 |
| **PostgreSQL** | Relational database | (external) |
| **bcryptjs** | Password hashing & verification | 2.4.3 |
| **jsonwebtoken** | JWT token creation & validation | 9.0.2 |
| **ioredis** | Redis client (optional) | 5.4.1 |
| **Nodemailer** | Email sending (SMTP) | 9.0.3 |
| **uuid** | Unique identifier generation | 14.0.1 |
| **dotenv** | Environment variable loading | 16.4.5 |
| **CORS** | Cross-Origin Resource Sharing | 2.8.5 |
| **nodemon** | Dev server auto-reload | 3.1.4 |

### DevOps & Deployment

| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization (optional) |
| **Railway** | Backend hosting & PostgreSQL provision |
| **Vercel** | Frontend hosting & CDN |
| **GitHub** | Version control & CI/CD trigger |
| **Prisma Migrations** | Database schema versioning |

---

## Component Architecture

### Frontend Component Structure

```
src/
├── pages/
│   ├── HomePage/
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── EventsPage/
│   ├── EventDetailPage/
│   ├── EventRegistrationPage/
│   ├── TicketPage/
│   ├── AttendeeDashboard/
│   ├── OrganizerDashboard/
│   ├── AdminDashboard/
│   └── SuperAdminDashboard/
│
├── context/
│   └── AuthContext.jsx          # Global auth state (user, role, syncSession, logout)
│
├── services/
│   ├── api.js                   # Axios base client
│   ├── http.js                  # Axios wrapper (auto-token injection)
│   ├── auth.service.js          # Login, register, verify email
│   ├── event.service.js         # CRUD events
│   ├── registration.service.js  # Event registrations
│   ├── ticket.service.js        # Ticket operations
│   ├── refund.service.js        # Refund requests
│   ├── testimonial.service.js   # Reviews
│   └── user.service.js          # User management
│
├── hooks/
│   ├── useAuth.js               # Access AuthContext
│   ├── useBodyScrollLock.js     # Lock/unlock body scroll
│   ├── useEscapeKey.js          # Listen for ESC key
│   ├── useScrollListener.js     # Track scroll position
│   └── useToast.js              # Toast notifications
│
├── config/
│   ├── api.config.js            # API base URL
│   └── env.js                   # Environment variables
│
├── utils/
│   ├── formatters.js            # Date, currency formatting
│   ├── validators.js            # Email, phone validation
│   └── constants.js             # App-wide constants
│
└── components/
    └── layout/                  # Navbar, sidebar, footer
```

### Backend Route Structure

```
src/routes/
├── auth.js
│   ├── POST   /login
│   ├── POST   /register
│   ├── POST   /verify-email
│   ├── POST   /resend-otp
│   ├── POST   /forgot-password
│   ├── POST   /reset-password
│   └── POST   /logout
│
├── events.js
│   ├── GET    /                 # List all published events
│   ├── POST   /                 # Create event (Organizer+)
│   ├── GET    /:id              # Event detail
│   ├── PUT    /:id              # Update event
│   └── DELETE /:id              # Delete event
│
├── registrations.js
│   ├── POST   /                 # Register for event
│   └── GET    /me               # My registrations
│
├── tickets.js
│   ├── GET    /:code            # Get ticket by unique code
│   ├── POST   /                 # Generate ticket
│   └── PATCH  /:code            # Cancel/confirm ticket
│
├── refunds.js
│   ├── POST   /                 # Request refund
│   ├── GET    /                 # List refunds
│   └── PATCH  /:id              # Update refund status (Admin)
│
├── testimonials.js
│   ├── GET    /                 # List testimonials
│   └── POST   /                 # Submit testimonial
│
└── users.js
    ├── GET    /                 # List users (Admin)
    ├── POST   /                 # Create user (Admin)
    ├── PUT    /:id              # Update user (Admin)
    └── DELETE /:id              # Delete user (Admin)
```

### Backend Middleware Stack

```
app.use(cors())                          # CORS handler
    ↓
app.use(express.json())                  # JSON parser
    ↓
app.get("/api/health")                   # Health check
    ↓
app.use("/api/auth", authRoutes)         # No auth required
app.use("/api/events", eventRoutes)      # Public read, auth for write
app.use("/api/registrations", requireAuth, registrationRoutes)  # Auth required
app.use("/api/tickets", ticketRoutes)    # Public read by code
app.use("/api/refunds", requireAuth, refundRoutes)             # Auth required
app.use("/api/testimonials", testimonialRoutes)                # Public read, auth for post
app.use("/api/users", requireAuth, requireRole("Admin", "Supervisor"), userRoutes)
    ↓
app.use(errorHandler)                    # Centralized error handler
```

### Core Models

**User**
- Roles: Supervisor, Admin, Organizer, Attendee
- Status: active, suspended
- OTP fields for email/password verification
- RBAC determines API access

**Event**
- Organizer (User ID)
- Capacity, pricing, publication status
- Category, image, published date
- 1-to-many with Ticket, Testimonial

**Ticket**
- Unique ticketCode (UUID)
- Status: confirmed, cancelled, pending
- Links User + Event
- 1-to-1 with Refund

**Refund**
- References Ticket by ticketCode
- Status: pending, approved, rejected
- Reason, details, resolved timestamp

**Testimonial**
- Rating (1-5 stars)
- Links User + Event (optional event)

---

## Abbreviation Dictionary

| Abbreviation | Full Form | Context |
|--------------|-----------|---------|
| **ERMS** | Event Registration Management System | Project codename |
| **ORM** | Object-Relational Mapping | Prisma handles SQL queries as objects |
| **JWT** | JSON Web Token | Stateless auth token format |
| **CORS** | Cross-Origin Resource Sharing | Browser security policy for API calls |
| **SMTP** | Simple Mail Transfer Protocol | Email sending protocol (Gmail, Outlook, etc.) |
| **OTP** | One-Time Password | 6-digit code for email verification |
| **RBAC** | Role-Based Access Control | Auth based on user.role (Admin, Organizer, etc.) |
| **UUID** | Universally Unique Identifier | ticketCode format (e.g., 550e8400-e29b-41d4-a716-446655440000) |
| **SPA** | Single Page Application | React frontend (no full page reloads) |
| **REST** | Representational State Transfer | API design pattern (HTTP methods: GET, POST, PUT, DELETE) |
| **API** | Application Programming Interface | Backend endpoints (/api/auth, /api/events, etc.) |
| **DB** | Database | PostgreSQL (relational) or Redis (cache) |
| **CLI** | Command Line Interface | Terminal commands (npm, prisma, git, etc.) |
| **ENV** | Environment Variables | .env file (DATABASE_URL, JWT_SECRET, etc.) |
| **CDN** | Content Delivery Network | Vercel's global edge network for frontend |
| **CI/CD** | Continuous Integration/Continuous Deployment | Automated tests & deploy on GitHub push |
| **PaaS** | Platform as a Service | Railway (backend hosting), Vercel (frontend hosting) |
| **MFA** | Multi-Factor Authentication | Not yet implemented (future: SMS/TOTP) |
| **XSS** | Cross-Site Scripting | Security vulnerability (mitigated by React escaping) |
| **CSRF** | Cross-Site Request Forgery | Security vulnerability (mitigated by SameSite cookies) |
| **SSL/TLS** | Secure Sockets Layer / Transport Layer Security | HTTPS encryption (Railway & Vercel handle automatically) |
| **Bcrypt** | Blowfish Cipher | Password hashing algorithm (bcryptjs library) |
| **Redis** | Remote Dictionary Server | In-memory cache for token blacklist |
| **Nodemailer** | Node Mail Transport | SMTP email client |
| **Prisma** | Prisma Data Platform | Database toolkit & ORM |
| **Vite** | French for "quick" | Frontend build tool (faster than Webpack) |
| **React Router** | React Routing Library | Client-side navigation (SPA routing) |
| **Chart.js** | Charting Library | Data visualization for dashboards |
| **QR Code** | Quick Response Code | Scannable code for ticket verification |
| **jsPDF** | JavaScript PDF Generation | Generate PDFs in browser |
| **html2canvas** | HTML to Canvas | Convert HTML to image/PDF |
| **Middleware** | Interceptor Functions | Express functions that process requests (auth, errors, etc.) |
| **Payload** | Data Content | JWT payload or request/response body |
| **Hook** | Reusable Logic | React Hooks (useState, useContext, custom hooks) |
| **Context** | Global State | React Context API (AuthContext for user/role) |
| **Service** | API Client Layer | Abstraction for HTTP calls (auth.service.js, etc.) |
| **Endpoint** | API Route | Individual route like POST /api/auth/login |
| **Query String** | URL Parameters | ?page=1&limit=10 in GET requests |
| **Path Parameter** | URL Segment | /api/events/:id where :id is dynamic |
| **Status Code** | HTTP Response Code | 200 OK, 401 Unauthorized, 500 Error, etc. |
| **Blacklist** | Token Revocation List | Redis set of logged-out JWTs |
| **Schema** | Database Structure | Prisma schema.prisma file defines tables |
| **Migration** | Schema Change | Versioned database updates (prisma/migrations/) |
| **Seed** | Initial Data | prisma/seed.js populates sample data |
| **Build** | Compiled Output | `npm run build` creates optimized production files |
| **Bundle** | Packaged Code | Minified JS, CSS, HTML sent to browser |
| **Tree Shaking** | Unused Code Removal | Vite removes unused imports during build |
| **Hot Module Replacement (HMR)** | Live Code Update | Dev server hot-reloads changes without full refresh |
| **Monorepo** | Multiple Packages | backend/ and frontend/ in one repo |

---

## Key Design Principles

### Security
- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ JWTs signed with strong secret
- ✅ Token blacklist on logout (Redis)
- ✅ CORS whitelist to prevent unauthorized origins
- ✅ Role-based access control (RBAC)
- ⚠️ TODO: Add HTTPS enforcing, CSRF protection, rate limiting

### Performance
- ✅ Vite for fast frontend bundling (HMR in dev)
- ✅ Prisma auto-generates optimized queries
- ✅ Redis for caching (optional)
- ✅ Vercel CDN for static assets
- ⚠️ TODO: Add database indexes, API caching, pagination

### Scalability
- ✅ Stateless JWT auth (no server session storage)
- ✅ Horizontal scaling possible (Railway, Vercel)
- ✅ Separable backend/frontend (different deployments)
- ⚠️ TODO: Add load balancing, database replication

### Maintainability
- ✅ Service layer abstraction (api.js, http.js, *.service.js)
- ✅ Middleware pattern for cross-cutting concerns
- ✅ Prisma for schema-driven development
- ✅ Environment variables for config
- ✅ Centralized error handling
