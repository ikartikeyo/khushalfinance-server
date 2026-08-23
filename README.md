# Khushal Finance — Backend API (Node.js + Express + MongoDB)

High-performance REST API backend for the **Khushal Finance** loan enquiry, tracking, and financial calculations platform.

---

## 🚀 Quick Start Guide

### 1. Configure MongoDB Connection
Open `backend/.env` and paste your MongoDB Atlas Connection String or Local MongoDB URI:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/khushal_finance?retryWrites=true&w=majority
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Seed Database (Master Loan Products & Initial Setup)
```bash
npm run seed
```
> **Admin Account**: Configured via environment variables or database seeding.

### 4. Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```
The server will start on **http://localhost:5000**.

---

## 📡 API Reference Overview

### 1. Loan Applications (`/api/enquiries`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/enquiries` | Public | Submit full multi-step loan application |
| `GET` | `/api/enquiries/track/:refNumber` | Public | Track application live status |
| `GET` | `/api/enquiries` | Staff / Admin | List enquiries with filters, pagination, search |
| `GET` | `/api/enquiries/:idOrRef` | Staff / Admin | Fetch application details & documents |
| `PATCH` | `/api/enquiries/:id/status` | Staff / Admin | Update lifecycle status with remarks |
| `PATCH` | `/api/enquiries/:id/assign` | Staff / Admin | Assign to loan officer |
| `POST` | `/api/enquiries/:id/notes` | Staff / Admin | Add internal underwriting remarks |
| `GET` | `/api/enquiries/export/csv` | Staff / Admin | Download filtered records as CSV |
| `DELETE` | `/api/enquiries/:id` | Admin | Delete application record |

### 2. Contact & Quick Enquiries (`/api/contacts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/contacts` | Public | Submit quick enquiry from contact page |
| `GET` | `/api/contacts` | Staff / Admin | List all incoming leads |
| `PATCH` | `/api/contacts/:id` | Staff / Admin | Update contact status / notes |

### 3. Loan Products Catalog (`/api/loans`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/loans` | Public | List all active loan types & rates |
| `GET` | `/api/loans/:slug` | Public | Get product details by slug |
| `POST` | `/api/loans` | Admin | Add new loan product |
| `PUT` | `/api/loans/:id` | Admin | Update loan product & rates |
| `DELETE` | `/api/loans/:id` | Admin | Deactivate / Delete loan product |

### 4. Financial Calculations Engine (`/api/calculator`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/calculator/emi` | Public | Calculate EMI & full amortization schedule |
| `POST` | `/api/calculator/eligibility` | Public | Compute borrowing eligibility & FOIR limit |
| `POST` | `/api/calculator/compare` | Public | Compare EMI across multiple tenures |

### 5. Document Management (`/api/documents`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload/:enquiryId` | Public / Staff | Upload borrower KYC & income documents |
| `GET` | `/api/documents/enquiry/:enquiryId` | Staff / Admin | List all uploaded documents for enquiry |
| `GET` | `/api/documents/download/:id` | Public / Staff | Download / view document file |
| `PATCH` | `/api/documents/:id/verify` | Staff / Admin | Verify or Reject document |

### 6. Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Staff / Admin | KPI cards (total loan volume, pending, approved) |
| `GET` | `/api/dashboard/analytics` | Staff / Admin | Status funnel, loan type & CIBIL charts |

### 7. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Admin / Staff login (returns JWT token) |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user profile |
| `POST` | `/api/auth/register` | Admin | Register new loan officer / underwriter |
| `GET` | `/api/auth/users` | Admin | List all staff members |

---

## 🧪 Automated Testing
```bash
npm test
```
Runs automated test suite testing all endpoints against MongoDB.
