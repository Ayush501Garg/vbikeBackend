# Super Vendor (Super Stockist) Management System - API Documentation

## Overview
Complete backend system for managing Super Vendors (Super Stockists) who distribute products to Sub-Vendors within their state. The system includes geo-location based features, payment tracking, ledger management, and invoice generation.

---

## Base URL
```
http://localhost:8000/api/super-vendors
```

---

## Models

### 1. SuperVendor Model
Location: `models/SuperVendor.js`

**Key Features:**
- One super vendor per state (geo-location based)
- Manages multiple sub-vendors in their state
- Tracks direct business and sub-vendor business
- Payment and recovery percentage tracking
- Geo-spatial indexing for location-based queries

### 2. SuperVendorTransaction Model
Location: `models/SuperVendorTransaction.js`

**Transaction Types:**
- `invoice` - Invoice raised
- `payment` - Payment received
- `credit_note` - Credit note issued
- `debit_note` - Debit note issued
- `adjustment` - Manual adjustment

### 3. SuperVendorInvoice Model
Location: `models/SuperVendorInvoice.js`

**Invoice Features:**
- Auto-generated invoice numbers (INV-SV-YYYY-NNNN)
- Support for multiple items (bikes, products)
- GST calculation
- Payment tracking
- Status management (pending, paid, overdue, etc.)

---

## API Endpoints

### 1. SUPER VENDOR CRUD OPERATIONS

#### 1.1 Create New Super Vendor
```http
POST /api/super-vendors
```

**Request Body:**
```json
{
  "super_vendor_id": "SV-002",
  "company_name": "Mumbai Bike Hub",
  "owner_name": "Amit Sharma",
  "phone": "+91 98765 43210",
  "email": "amit@mumbaihub.com",
  "address": "Shop No. 45, Andheri West",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "longitude": 72.8777,
  "latitude": 19.0760,
  "gst_number": "27ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F",
  "bank_account": "1234567890",
  "ifsc_code": "SBIN0001234",
  "bank_name": "State Bank of India",
  "coverage_area": "Mumbai, Thane, Navi Mumbai",
  "status": "active",
  "notes": "Primary distributor for Maharashtra",
  "sub_vendors": ["vendor_id_1", "vendor_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Super Vendor created successfully",
  "data": {
    "_id": "...",
    "super_vendor_id": "SV-002",
    "company_name": "Mumbai Bike Hub",
    ...
  }
}
```

**Validations:**
- ✅ Only one super vendor per state
- ✅ Unique email address
- ✅ Sub-vendors must be in same state
- ✅ Geo-location coordinates stored

---

#### 1.2 Get All Super Vendors
```http
GET /api/super-vendors?state=Delhi&status=active&search=bike
```

**Query Parameters:**
- `state` - Filter by state
- `status` - Filter by status (active/inactive/suspended)
- `search` - Search in company name, owner name, ID, email

**Response:**
```json
{
  "success": true,
  "count": 1,
  "summary": {
    "total_super_vendors": 1,
    "total_sub_vendors": 2,
    "total_business": 10200000,
    "total_collected": 9070000,
    "total_pending": 1130000,
    "avg_recovery": 88.92
  },
  "data": [...]
}
```

---

#### 1.3 Get Super Vendor by ID
```http
GET /api/super-vendors/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "super_vendor_id": "SV-001",
    "company_name": "Delhi Bike Hub",
    "sub_vendors": [
      {
        "_id": "...",
        "name": "Delhi East Bikes",
        "total_business": 2100000,
        "pending_amount": 320000
      }
    ],
    "direct_business": 6350000,
    "total_business": 10200000,
    "recovery_percentage": 88.92,
    ...
  }
}
```

---

#### 1.4 Update Super Vendor
```http
PUT /api/super-vendors/:id
```

**Request Body:** (Same as create, all fields optional)

---

#### 1.5 Delete Super Vendor
```http
DELETE /api/super-vendors/:id
```

**Note:** All sub-vendors will be converted to direct vendors

---

### 2. GEO-LOCATION BASED QUERIES

#### 2.1 Get Super Vendor by State
```http
GET /api/super-vendors/state/:state
```

**Example:**
```http
GET /api/super-vendors/state/Delhi
```

---

#### 2.2 Find Nearby Super Vendors
```http
GET /api/super-vendors/nearby?longitude=77.2090&latitude=28.6139&maxDistance=50000
```

**Query Parameters:**
- `longitude` - Longitude coordinate (required)
- `latitude` - Latitude coordinate (required)
- `maxDistance` - Maximum distance in meters (default: 50000 = 50km)

**Use Cases:**
- Find super vendors near a customer location
- Assign vendors to nearest super vendor
- Distribution planning

---

### 3. SUB-VENDOR MANAGEMENT

#### 3.1 Assign Sub-Vendors to Super Vendor
```http
POST /api/super-vendors/:id/assign-vendors
```

**Request Body:**
```json
{
  "vendor_ids": ["vendor_id_1", "vendor_id_2", "vendor_id_3"]
}
```

**Features:**
- ✅ Validates vendors are in same state as super vendor
- ✅ Automatically updates vendor records
- ✅ Recalculates super vendor metrics
- ✅ Prevents duplicates

---

#### 3.2 Remove Sub-Vendor from Super Vendor
```http
POST /api/super-vendors/:id/remove-vendor
```

**Request Body:**
```json
{
  "vendor_id": "vendor_id_1"
}
```

**Features:**
- ✅ Converts vendor back to direct vendor
- ✅ Recalculates super vendor metrics

---

### 4. PAYMENT & LEDGER MANAGEMENT

#### 4.1 Record Payment
```http
POST /api/super-vendors/:id/payments
```

**Request Body:**
```json
{
  "amount": 2500000,
  "payment_date": "2026-01-20",
  "payment_method": "bank_transfer",
  "payment_reference": "NEFT45678912345",
  "utr_number": "UTR123456789",
  "cheque_number": "",
  "notes": "Payment for January bikes",
  "invoice_id": "invoice_id_optional"
}
```

**Payment Methods:**
- `cash`
- `bank_transfer`
- `cheque`
- `upi`
- `neft_rtgs`
- `other`

**Features:**
- ✅ Auto-generates transaction reference
- ✅ Updates super vendor balance
- ✅ Links to invoice if provided
- ✅ Calculates recovery percentage

---

#### 4.2 Get Ledger
```http
GET /api/super-vendors/:id/ledger?startDate=2026-01-01&endDate=2026-01-31&transaction_type=payment
```

**Query Parameters:**
- `startDate` - Filter from date
- `endDate` - Filter to date
- `transaction_type` - Filter by type (invoice/payment/credit_note/debit_note)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "summary": {
    "total_invoices": 3,
    "total_payments": 7,
    "total_invoice_amount": 11300000,
    "total_payment_amount": 9070000,
    "current_balance": 1130000
  },
  "data": [
    {
      "_id": "...",
      "transaction_date": "2026-01-15",
      "transaction_type": "invoice",
      "reference_number": "INV-SV-2026-0015",
      "amount": 1130000,
      "balance_after": 1130000,
      "status": "pending"
    },
    ...
  ]
}
```

---

#### 4.3 Export Ledger to CSV
```http
GET /api/super-vendors/:id/ledger/export
```

**Response:**
```json
{
  "success": true,
  "message": "Ledger data ready for export",
  "data": [
    ["Date", "Transaction Type", "Reference", "Payment Method", "Amount", "Balance", "Status"],
    ["15 Jan 2026", "invoice", "INV-SV-2026-0015", "-", "₹11,30,000", "₹11,30,000", "pending"],
    ...
  ],
  "super_vendor": {
    "company_name": "Delhi Bike Hub",
    "super_vendor_id": "SV-001"
  }
}
```

---

#### 4.4 Get Payment Statistics
```http
GET /api/super-vendors/:id/payment-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_payments": 25,
    "total_amount": 9070000,
    "by_payment_method": {
      "bank_transfer": {
        "count": 15,
        "total_amount": 6000000
      },
      "cash": {
        "count": 5,
        "total_amount": 2000000
      },
      "cheque": {
        "count": 5,
        "total_amount": 1070000
      }
    },
    "monthly_trends": [
      {
        "_id": { "year": 2026, "month": 1 },
        "total_amount": 9070000,
        "count": 25
      }
    ],
    "super_vendor_summary": {
      "company_name": "Delhi Bike Hub",
      "total_business": 10200000,
      "total_collected": 9070000,
      "total_pending": 1130000,
      "recovery_percentage": 88.92
    }
  }
}
```

---

### 5. INVOICE MANAGEMENT

#### 5.1 Create Invoice
```http
POST /api/super-vendors/:id/invoices
```

**Request Body:**
```json
{
  "items": [
    {
      "bike_model": "bike_model_id",
      "description": "V-Bike Model X - Electric Scooter",
      "quantity": 10,
      "unit_price": 50000,
      "discount": 5000,
      "tax_rate": 18
    },
    {
      "product": "product_id",
      "description": "Battery Pack 48V",
      "quantity": 20,
      "unit_price": 15000,
      "discount": 0,
      "tax_rate": 18
    }
  ],
  "due_date": "2026-02-15",
  "discount": 10000,
  "terms_and_conditions": "Payment due within 30 days",
  "notes": "Bulk order for January 2026"
}
```

**Features:**
- ✅ Auto-generates invoice number (INV-SV-2026-NNNN)
- ✅ Automatic GST calculation (18% default)
- ✅ Item-level and invoice-level discounts
- ✅ Updates super vendor business metrics
- ✅ Creates transaction entry

---

#### 5.2 Get All Invoices
```http
GET /api/super-vendors/:id/invoices?status=pending&payment_status=unpaid
```

**Query Parameters:**
- `status` - draft/pending/partially_paid/paid/overdue/cancelled
- `payment_status` - unpaid/partially_paid/paid

**Response:**
```json
{
  "success": true,
  "count": 2,
  "summary": {
    "total_invoices": 2,
    "total_amount": 4300000,
    "total_paid": 2500000,
    "total_pending": 1800000,
    "paid_invoices": 0,
    "pending_invoices": 1,
    "partially_paid_invoices": 1,
    "overdue_invoices": 0
  },
  "data": [...]
}
```

---

#### 5.3 Get Single Invoice
```http
GET /api/super-vendors/invoices/:invoice_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "invoice_number": "INV-SV-2026-0015",
    "super_vendor": {...},
    "invoice_date": "2026-01-15",
    "due_date": "2026-02-15",
    "items": [
      {
        "bike_model": {...},
        "quantity": 10,
        "unit_price": 50000,
        "discount": 5000,
        "tax_rate": 18,
        "tax_amount": 81000,
        "total_amount": 531000
      }
    ],
    "subtotal": 500000,
    "discount": 10000,
    "tax_amount": 88200,
    "total_amount": 1130000,
    "paid_amount": 0,
    "balance_due": 1130000,
    "status": "pending",
    "payment_status": "unpaid",
    "payments": []
  }
}
```

---

#### 5.4 Update Invoice Status
```http
PUT /api/super-vendors/invoices/:invoice_id/status
```

**Request Body:**
```json
{
  "status": "cancelled"
}
```

**Allowed Statuses:**
- draft
- pending
- partially_paid
- paid
- overdue
- cancelled

---

### 6. DASHBOARD & ANALYTICS

#### 6.1 Get Super Vendor Dashboard
```http
GET /api/super-vendors/:id/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "super_vendor": {...},
    "metrics": {
      "total_sub_vendors": 2,
      "direct_business": 6350000,
      "sub_vendor_business": 3850000,
      "total_business": 10200000,
      "total_collected": 9070000,
      "total_pending": 1130000,
      "recovery_percentage": 88.92
    },
    "recent_transactions": [
      {
        "transaction_date": "2026-01-15",
        "transaction_type": "invoice",
        "amount": 1130000,
        ...
      }
    ],
    "pending_invoices": [
      {
        "invoice_number": "INV-SV-2026-0015",
        "total_amount": 1130000,
        "balance_due": 1130000,
        ...
      }
    ],
    "sub_vendors_summary": [
      {
        "name": "Delhi East Bikes",
        "total_business": 2100000,
        "pending_amount": 320000,
        ...
      }
    ]
  }
}
```

---

### 7. TRANSACTION MANAGEMENT

#### 7.1 Delete Transaction
```http
DELETE /api/super-vendors/transactions/:transaction_id
```

**Features:**
- ✅ If payment: Reverses amounts in super vendor
- ✅ If payment: Updates linked invoice
- ✅ Recalculates recovery percentage

---

## Key Features & Business Logic

### 1. State-Based Management
- ✅ Only ONE super vendor per state (enforced at database level)
- ✅ Sub-vendors must be in same state as their super vendor
- ✅ Automatic state validation during assignment

### 2. Geo-Location Features
- ✅ 2dsphere indexing for location-based queries
- ✅ Find nearby super vendors within radius
- ✅ Distance-based vendor assignment

### 3. Automatic Calculations
- ✅ Auto-calculates recovery percentage
- ✅ Auto-updates balance after payments
- ✅ Auto-calculates GST and totals
- ✅ Auto-generates invoice and reference numbers

### 4. Metrics Tracking
- ✅ Direct business (super vendor's own sales)
- ✅ Sub-vendor business (total from all sub-vendors)
- ✅ Total collected vs pending
- ✅ Recovery percentage
- ✅ Number of bikes sold

### 5. Sub-Vendor Management
- ✅ Assign/remove sub-vendors dynamically
- ✅ Auto-recalculates metrics on changes
- ✅ Converts to direct vendor on super vendor deletion

---

## Usage Examples

### Example 1: Create Super Vendor for Maharashtra
```javascript
POST /api/super-vendors
{
  "super_vendor_id": "SV-002",
  "company_name": "Mumbai Bike Hub",
  "owner_name": "Amit Sharma",
  "email": "amit@mumbaihub.com",
  "state": "Maharashtra",
  "longitude": 72.8777,
  "latitude": 19.0760,
  ...
}
```

### Example 2: Assign Vendors to Super Vendor
```javascript
POST /api/super-vendors/super_vendor_id/assign-vendors
{
  "vendor_ids": ["vendor_1", "vendor_2", "vendor_3"]
}
```

### Example 3: Record Payment
```javascript
POST /api/super-vendors/super_vendor_id/payments
{
  "amount": 2500000,
  "payment_date": "2026-01-20",
  "payment_method": "bank_transfer",
  "payment_reference": "NEFT45678912345"
}
```

### Example 4: Create Invoice
```javascript
POST /api/super-vendors/super_vendor_id/invoices
{
  "items": [
    {
      "bike_model": "bike_model_id",
      "description": "V-Bike Model X",
      "quantity": 10,
      "unit_price": 50000,
      "tax_rate": 18
    }
  ],
  "due_date": "2026-02-15"
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Server Error

---

## Database Indexes

For optimal performance, the following indexes are created:

**SuperVendor:**
- `location: 2dsphere` (geo-spatial queries)
- `state, status` (state-based filtering)
- `super_vendor_id` (unique identifier)

**SuperVendorTransaction:**
- `super_vendor, transaction_date` (ledger queries)
- `reference_number` (transaction lookup)
- `status` (filtering)

**SuperVendorInvoice:**
- `super_vendor, invoice_date` (invoice queries)
- `invoice_number` (unique identifier)
- `status, payment_status` (filtering)

---

## Authentication & Authorization

Currently, routes are set up but authentication middleware is commented out in routes file. To enable:

```javascript
router.use(protect);
router.use(authorize('admin', 'super_admin'));
```

---

## Integration with Existing Vendor System

The `Vendor` model has been updated with:
- `super_vendor` - Reference to SuperVendor
- `vendor_type` - 'direct' or 'sub_vendor'
- `total_business` - Business metrics
- `pending_amount` - Pending payments

This allows seamless integration between super vendors and sub-vendors.

---

## Next Steps & Enhancements

1. **PDF Generation** - Generate invoice PDFs
2. **Email Notifications** - Send invoices and payment confirmations
3. **SMS Alerts** - Payment reminders
4. **Analytics Dashboard** - Advanced reporting
5. **Mobile App Integration** - Mobile-friendly APIs
6. **Bulk Operations** - Import/export via CSV
7. **Audit Logs** - Track all changes

---

## Support

For questions or issues, please contact the development team.
