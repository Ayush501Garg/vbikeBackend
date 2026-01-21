# 🏢 SUPER VENDOR API DOCUMENTATION

Super Vendor is created by Super Admin and manages inventory, sub-vendors, pricing, and sales within their region/state.

**Base URL:** `http://localhost:8000/api/super-vendors`

---

## 🏪 SUPER VENDOR MANAGEMENT

### 1. Create Super Vendor (By Super Admin)
Only Super Admin can create Super Vendors.

```bash
curl -X POST "http://localhost:8000/api/super-vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "super_vendor_id": "SV-MH-001",
    "company_name": "VBike Maharashtra",
    "owner_name": "Amit Sharma",
    "phone": "+91-9876543210",
    "email": "amit.sharma@vbike-mh.com",
    "address": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "gst_number": "27AAAAA0000A1Z5",
    "pan_number": "AAAAA0000A",
    "bank_account": "1234567890",
    "ifsc_code": "HDFC0000123",
    "bank_name": "HDFC Bank",
    "longitude": 72.8777,
    "latitude": 19.0760,
    "status": "active"
  }'
```

---

### 2. Get All Super Vendors

```bash
curl -X GET "http://localhost:8000/api/super-vendors"
```

---

### 3. Get Super Vendor By ID

```bash
curl -X GET "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde"
```

---

### 4. Update Super Vendor

```bash
curl -X PUT "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-9876543211",
    "email": "newemail@vbike-mh.com"
  }'
```

---

### 5. Get Super Vendor Dashboard

```bash
curl -X GET "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/dashboard"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company_name": "VBike Maharashtra",
    "state": "Maharashtra",
    "total_sub_vendors": 8,
    "direct_business": 4500000,
    "direct_bikes_sold": 45,
    "sub_vendor_business": 12000000,
    "sub_vendor_bikes_sold": 120,
    "total_business": 16500000
  }
}
```

---

## 👥 SUB-VENDOR MANAGEMENT

### 6. Create Sub Vendor Under Super Vendor
Super Vendor creates a new sub vendor under their management.

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/create-sub-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VBike Pune Dealership",
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

---

### 7. Assign Existing Sub Vendors

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/assign-vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_ids": ["675e69b2d0f345678901cdef"]
  }'
```

---

### 8. Remove Sub Vendor

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/remove-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "675e69b2d0f345678901cdef"
  }'
```

---

## 🏷️ PRICING MANAGEMENT

### 9. Set Product Pricing
Set discount/markup % or custom price for products.

```bash
curl -X PUT "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/inventory/675c47a2b8e9f123456789ab/pricing" \
  -H "Content-Type: application/json" \
  -d '{
    "discount_percentage": 8,
    "custom_price": 78200
  }'
```

---

### 10. Update Pricing Rules for Sub Vendors

```bash
curl -X PUT "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/pricing-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "discount_percentage": 5,
    "can_set_custom_price": true,
    "min_margin_percentage": 3,
    "max_discount_percentage": 10
  }'
```

---

## 💰 SALES

### 11. Super Vendor Sells Product

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/sell" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 3,
    "selling_price": 78200,
    "customer_details": {
      "name": "Priya Deshmukh",
      "phone": "+91-9123456789"
    }
  }'
```

---

## 📦 INVENTORY MANAGEMENT

### 12. Get Super Vendor Inventory

```bash
curl -X GET "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/inventory"
```

---

### 13. Transfer Inventory to Sub Vendor

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/sub-vendors/675e69b2d0f345678901cdef/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 10
  }'
```

---

### 14. Get Sub Vendor Inventory

```bash
curl -X GET "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/sub-vendors/675e69b2d0f345678901cdef/inventory"
```

---

## 💳 PAYMENTS & INVOICES

### 15. Record Payment

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "payment_type": "credit",
    "payment_method": "bank_transfer",
    "reference_number": "TXN123456"
  }'
```

---

### 16. Get Ledger

```bash
curl -X GET "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/ledger?startDate=2024-01-01&endDate=2024-12-31"
```

---

### 17. Create Invoice

```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-2024-001",
    "amount": 234600,
    "due_date": "2024-02-15",
    "items": [{
      "description": "VBike Model X",
      "quantity": 3,
      "price": 78200
    }]
  }'
```

---

## 📝 RESPONSIBILITIES

✅ Receives inventory from Super Admin  
✅ Can sell products directly  
✅ Creates and manages sub vendors  
✅ Transfers inventory to sub vendors  
✅ Sets pricing for products  
✅ Defines pricing rules for sub vendors  
✅ Views sales reports

---

## 🔄 Inventory Flow

```
Super Admin → Super Vendor
    ├── Super Vendor Sells (deduct from super vendor)
    └── Transfer to Sub Vendor → Sub Vendor Sells (deduct from super vendor)
```

1. Replace `SUPER_VENDOR_ID` with actual MongoDB ObjectId
2. Replace `INVOICE_ID` with actual invoice MongoDB ObjectId
3. Replace `TRANSACTION_ID` with actual transaction MongoDB ObjectId
4. Replace `BIKE_MODEL_ID` and `PRODUCT_ID` with actual IDs from your database
5. Replace `vendor_id_1`, `vendor_id_2` with actual vendor IDs

---

## SAVE RESPONSE TO FILE

```bash
# Save response
curl -X GET http://localhost:8000/api/super-vendors > response.json

# Pretty print
curl -X GET http://localhost:8000/api/super-vendors | json_pp
```

---

## WITH AUTHENTICATION (If Enabled)

Add authorization header:
```bash
curl -X GET http://localhost:8000/api/super-vendors \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

Happy Testing! 🚀
