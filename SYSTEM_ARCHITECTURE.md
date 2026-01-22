# 📊 SYSTEM ARCHITECTURE & DATA FLOW

## 🏗️ HIERARCHICAL STRUCTURE

```
┌─────────────────────────────────────────────┐
│           SUPER ADMIN                       │
│  (Complete System Control)                  │
│                                             │
│  • Main Warehouse Inventory                 │
│  • Set Base Prices                          │
│  • Manage All Vendors                       │
│  • View All Reports                         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────────┐   ┌──────────────────┐
│  SUPER VENDOR    │   │  SUB VENDOR      │
│ (Regional)       │   │ (Direct by Admin)│
│                  │   │                  │
│ • Regional Stock │   │ • Own Stock Only │
│ • Pricing Rules  │   │ • Sell Only      │
│ • Manage SubVend │   │ • Set Prices     │
│ • Sales Report   │   │ • View History   │
└──────────┬───────┘   └──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ SUB VENDOR   │
    │ (Under SV)   │
    │              │
    │ • Allocated  │
    │   Stock Only │
    │ • Sell Only  │
    │ • Limited    │
    │   Pricing    │
    └──────────────┘
```

---

## 💰 PAYMENT FLOW

```
Sub Vendor Receives Stock
           │
           ▼
Sub Vendor Sells Product
    (Deduct inventory)
           │
           ▼
Revenue Added to:
 • Sub Vendor's total_business
 • Super Vendor's sub_vendor_business (if under SV)
           │
           ▼
Payment Status:
 pending_amount = total_business - amount_received
           │
           ▼
Super Admin Records Payment
 pending_amount decreases
           │
           ▼
Account Ledger Updated
```

---

## 📦 INVENTORY FLOW

```
SUPER ADMIN Main Warehouse
(stock_quantity in Product)
           │
    ┌──────┴────────┐
    │               │
    ▼               ▼
Allocate to    Allocate to
Super Vendor   Sub Vendor
    │               │
    ▼               │
Super Vendor    Sub Vendor
Inventory       (Direct)
    │
    ├─► Super Vendor Sells
    │   (Deduct from SV)
    │
    └─► Allocate to
        Sub Vendor
        │
        ▼
    Sub Vendor
    Inventory
    │
    ▼
    Sub Vendor Sells
    (Deduct from SV 
     + update metrics)
```

---

## 📊 SUB VENDOR ACCOUNT MANAGEMENT

```
┌─────────────────────────────────────────────┐
│     SUB VENDOR ACCOUNT                      │
│                                             │
│  Basic Info:                                │
│  • Name, Email, Phone                       │
│  • Address, City, State                     │
│  • Associated Super Vendor (if any)         │
│  • Account Status (active/inactive/suspended)
└─────────────────────────────────────────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
 INVENTORY  BUSINESS  ACCOUNT
 TRACKING   METRICS   LEDGER
    │         │         │
    ▼         ▼         ▼
 • Assigned  • Total    • All
   Stock     Business   Transactions
 • Available • Bikes    • Debit/Credit
   Stock     Sold       • Balance
 • Sold      • Pending  • Payment
   Stock     Amount     History
 • Inventory • Payment  • Invoice
   Value     Rate       Records
             • Rating
```

---

## 🔄 SUPER ADMIN WORKFLOW FOR MANAGING SUB VENDORS

```
START
  │
  ▼
┌──────────────────────────────┐
│ View All Sub Vendors         │ ──► GET /sub-vendors
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Select a Vendor              │
└──────────────────────────────┘
  │
  ├─────────────────────────────────────────┐
  │                                         │
  ▼                                         ▼
CHECK DETAILS              CHECK PAYMENTS
  │                          │
  ▼                          ▼
GET /sub-vendors/:id      GET /sub-vendors/:id/payments
  │                          │
  Show:                       Show:
  • Info                      • Payment History
  • Inventory                 • Pending Amount
  • Metrics                   • Status
  │                           │
  ▼                           ▼
  IF NEEDS                    IF PAYMENT
  ALLOCATION:                 RECEIVED:
  Update in                   │
  Super Vendor's              ▼
  Transfer API            POST /record-payment
  │                          │
  ▼                          ▼
├─────────────────────────────┤
│                             │
▼                             ▼
CHECK LEDGER          CHECK TRANSACTIONS
  │                     │
  ▼                     ▼
GET /ledger         GET /transactions
  │                     │
  Show:                 Show:
  • All entries        • Sales records
  • Dates              • Stock levels
  • Amounts            • Revenue
  │                     │
  ├─────────────────────┤
  │
  ▼
┌──────────────────────────────┐
│ VIEW INVOICES & REPORT       │
└──────────────────────────────┘
  │
  ├──────────────────┬──────────────────┐
  │                  │                  │
  ▼                  ▼                  ▼
GET /invoices    GET /report    UPDATE STATUS
  │               │              │
  Show:           Show:          If needed:
  • Bills         • Performance  • Active
  • Amounts       • Sales Rate   • Inactive
  • Status        • Best Product • Suspended
  │               │              │
  └───────────────┴──────────────┘
          │
          ▼
        END
```

---

## 💳 PAYMENT MANAGEMENT PROCESS

```
┌────────────────────────────┐
│ Sub Vendor Makes a Sale    │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Money Recorded as:         │
│ • total_business +         │
│ • pending_amount +         │
└────────────────────────────┘
          │
          ▼
   Notification Sent
   "Payment Pending"
          │
          ▼
  Sub Vendor Pays
   (cheque/transfer)
          │
          ▼
┌────────────────────────────┐
│ Super Admin Records:       │
│ POST /record-payment       │
│ • Amount                   │
│ • Method                   │
│ • Reference                │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ pending_amount Reduced by  │
│ Amount Paid                │
│                            │
│ pending_amount = pending - │
│ (amount_paid)              │
└────────────────────────────┘
          │
          ▼
   Ledger & Report Updated
          │
          ▼
    Payment Marked Complete
```

---

## 📋 ACCOUNT LEDGER STRUCTURE

```
┌──────────────────────────────────────────────────┐
│                   LEDGER                         │
├──────────────────────────────────────────────────┤
│ Date | Type | Description | Debit | Credit | Balance
├──────────────────────────────────────────────────┤
│ 2025 | Account Created | - | 0 | 0 | 0
│ 2025 | Sales (18 bikes) | 1,500,000 | 0 | 1,500,000
│ 2025 | Pending Payment | 0 | 150,000 | 1,350,000
│ 2025 | Payment Recorded | 0 | 150,000 | 1,350,000
└──────────────────────────────────────────────────┘

DEBIT = Money owed to vendor (from their sales)
CREDIT = Money paid by vendor
BALANCE = Current outstanding amount
```

---

## 🎯 QUICK ENDPOINT REFERENCE

```
SUB VENDOR MANAGEMENT ENDPOINTS:

1. Get All
   GET /api/super-admin/sub-vendors

2. Get by State
   GET /api/super-admin/sub-vendors/state/{state}

3. Get Details
   GET /api/super-admin/sub-vendors/{id}

4. Update Status
   PUT /api/super-admin/sub-vendors/{id}/status

5. Get Ledger
   GET /api/super-admin/sub-vendors/{id}/ledger

6. Get Payments
   GET /api/super-admin/sub-vendors/{id}/payments

7. Record Payment
   POST /api/super-admin/sub-vendors/{id}/record-payment

8. Get Transactions
   GET /api/super-admin/sub-vendors/{id}/transactions

9. Get Invoices
   GET /api/super-admin/sub-vendors/{id}/invoices

10. Get Report
    GET /api/super-admin/sub-vendors/{id}/report
```

---

## 📊 DATA RELATIONSHIPS

```
Product
  ├─ base_price (set by Super Admin)
  └─ stock_quantity (main warehouse)
         │
         ├─► Super Vendor Inventory
         │    ├─ product_id
         │    ├─ assigned_stock
         │    ├─ available_stock
         │    ├─ sold_stock
         │    └─ custom_price
         │         │
         │         └─► Sub Vendor Inventory
         │              ├─ product_id
         │              ├─ assigned_stock
         │              ├─ available_stock
         │              ├─ sold_stock
         │              ├─ min_price
         │              ├─ max_price
         │              └─ custom_price
         │
         └─► Vendor Inventory (Direct)
              ├─ product_id
              ├─ assigned_stock
              ├─ available_stock
              ├─ sold_stock
              └─ custom_price

Vendor (Sub Vendor)
  ├─ Basic Info
  ├─ Inventory Array ──► Sales Tracking
  ├─ total_business ────► Revenue
  ├─ total_bikes_sold ──► Units Sold
  ├─ pending_amount ────► Outstanding Payment
  ├─ Pricing Rules
  └─ Status ────────────► active/inactive/suspended
         │
         ├─► Ledger Entries
         ├─► Payment Records
         ├─► Transaction History
         └─► Invoice Records
```

---

## 🔐 SECURITY LEVELS

```
Routes:
┌─────────────────────────────┐
│ ALL SUPER ADMIN ROUTES      │
│ require: protect (auth)     │
│ authorize('super_admin')    │
└─────────────────────────────┘

Fields: Super Admin Visibility:
┌─────────────────────────────┐
│ ✅ All Vendor Data         │
│ ✅ All Financial Data      │
│ ✅ All Inventory Data      │
│ ✅ Payment Records         │
│ ✅ Ledger Entries          │
│ ✅ Invoice Data            │
│ ✅ Personal Information    │
│ ✅ Business Metrics        │
└─────────────────────────────┘
```

---

## 📈 METRICS CALCULATION

```
From Database:
total_business = Sum of all sales revenue
total_bikes_sold = Count of all bikes sold
pending_amount = Money not yet received
rating = Average rating (0-5)

Calculated:
├─ received_amount = total_business - pending_amount
├─ payment_rate = (received_amount / total_business) × 100%
├─ average_per_sale = total_business / total_bikes_sold
├─ inventory_value = Σ(available_stock × price)
└─ sales_value = Σ(sold_stock × price)
```

---

## 🎯 COMMON DATA ACCESS PATTERNS

```
Pattern 1: Check Payment Status
Query → pending_amount field
Compare with → total_business field
Calculate → (pending / total) × 100%

Pattern 2: Monitor Inventory
Query → available_stock for each product
Sum → total_assigned_stock
Calculate → Turnover rate

Pattern 3: Performance Analysis
Query → total_bikes_sold
Query → total_business
Query → rating
Result → Performance score

Pattern 4: Audit Trail
Query → ledger entries
Sort by → date
Filter by → type (sales, payment, etc.)
```
