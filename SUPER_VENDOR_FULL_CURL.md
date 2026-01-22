# 🏢 Super Vendor API – Complete cURL Guide

Base URL: http://localhost:8000/api/super-vendors

Auth (if enabled): add `-H "Authorization: Bearer YOUR_JWT_TOKEN"`

---
## CRUD & Lookup
1) Create super vendor (by Super Admin)
```bash
curl -X POST "http://localhost:8000/api/super-vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "super_vendor_id": "SV-MH-001",
    "company_name": "VBike Maharashtra",
    "owner_name": "Amit Sharma",
    "phone": "+91-9876543210",
    "email": "amit@vbike.com",
    "address": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "gst_number": "27AAAAA0000A1Z5",
    "pan_number": "AAAAA0000A",
    "bank_account": "1234567890",
    "ifsc_code": "HDFC0000123",
    "bank_name": "HDFC"
  }'
```
2) Get all super vendors
```bash
curl -X GET "http://localhost:8000/api/super-vendors"
```
3) Get by ID
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID"
```
4) Update super vendor
```bash
curl -X PUT "http://localhost:8000/api/super-vendors/SV_ID" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91-9876543211"}'
```
5) Delete super vendor
```bash
curl -X DELETE "http://localhost:8000/api/super-vendors/SV_ID"
```
6) Get by state
```bash
curl -X GET "http://localhost:8000/api/super-vendors/state/Maharashtra"
```
7) Find nearby (geo)
```bash
curl -X GET "http://localhost:8000/api/super-vendors/nearby?lat=19.0760&lng=72.8777&radius=50"
```
8) Dashboard stats
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/dashboard"
```

---
## Sub Vendor Management (by Super Vendor)
9) Create sub vendor under super vendor
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/create-sub-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VBike Pune",
    "email": "pune@vbike.com",
    "phone": "+91-9988776655",
    "address_line": "456 FC Road",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411004",
    "lat": 18.5204,
    "lng": 73.8567
  }'
```
10) Assign existing sub vendors
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/assign-vendors" \
  -H "Content-Type: application/json" \
  -d '{"vendor_ids": ["VENDOR_ID"]}'
```
11) Remove sub vendor
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/remove-vendor" \
  -H "Content-Type: application/json" \
  -d '{"vendor_id": "VENDOR_ID"}'
```

---
## Inventory & Pricing
12) Assign inventory to super vendor (from HQ)
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/inventory/assign" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 50}
'
```
13) View super vendor inventory
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/inventory"
```
14) Transfer inventory to sub vendor
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/sub-vendors/VENDOR_ID/inventory" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 10}'
```
15) Get a sub vendor's inventory (under this super vendor)
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/sub-vendors/VENDOR_ID/inventory"
```
16) Set pricing for a product (discount/markup/custom)
```bash
curl -X PUT "http://localhost:8000/api/super-vendors/SV_ID/inventory/PRODUCT_ID/pricing" \
  -H "Content-Type: application/json" \
  -d '{"discount_percentage": 8, "markup_percentage": 0, "custom_price": 78200}'
```
17) Update default pricing rules for sub vendors
```bash
curl -X PUT "http://localhost:8000/api/super-vendors/SV_ID/pricing-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "discount_percentage": 5,
    "markup_percentage": 0,
    "can_set_custom_price": true,
    "min_margin_percentage": 3,
    "max_discount_percentage": 10
  }'
```

---
## Sales
18) Super vendor sells directly
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/sell" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 3,
    "selling_price": 78200,
    "customer_details": {"name": "Priya", "phone": "+91-9123456789"}
  }'
```

---
## Payments, Ledger, Transactions
19) Record payment
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/payments" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500000, "payment_type": "credit", "payment_method": "bank_transfer", "reference_number": "TXN123456"}'
```
20) Ledger (with optional date filters)
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/ledger?startDate=2024-01-01&endDate=2024-12-31"
```
21) Export ledger CSV
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/ledger/export" -o ledger.csv
```
22) Payment statistics
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/payment-stats"
```
23) Delete transaction
```bash
curl -X DELETE "http://localhost:8000/api/super-vendors/transactions/TRANSACTION_ID"
```

---
## Invoices
24) Create invoice
```bash
curl -X POST "http://localhost:8000/api/super-vendors/SV_ID/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-2024-001",
    "amount": 234600,
    "due_date": "2024-02-15",
    "items": [{"description": "VBike Model X", "quantity": 3, "price": 78200}]
  }'
```
25) Get all invoices
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SV_ID/invoices"
```
26) Get single invoice
```bash
curl -X GET "http://localhost:8000/api/super-vendors/invoices/INVOICE_ID"
```
27) Update invoice status
```bash
curl -X PUT "http://localhost:8000/api/super-vendors/invoices/INVOICE_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
```

---
## Placeholders
- SV_ID: super vendor ObjectId
- VENDOR_ID: sub vendor ObjectId
- PRODUCT_ID: product ObjectId
- TRANSACTION_ID: payment/ledger transaction ObjectId
- INVOICE_ID: invoice ObjectId

---
## Notes
- Inventory never goes negative; validations on transfers and sales.
- Pricing rules enforce min margins/discount limits for sub vendors.
- Use auth middleware in production for all routes.
