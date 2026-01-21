# 🏪 SUB VENDOR API DOCUMENTATION

Sub Vendor can be created by Super Admin directly or by Super Vendor. They receive inventory, set prices within limits, and sell products.

**Base URL:** `http://localhost:8000/api/vendors`

---

## 📦 INVENTORY MANAGEMENT

### 1. Get Sub Vendor Inventory

```bash
curl -X GET "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "675e69b2d0f345678901cdef",
    "name": "VBike Pune Dealership",
    "vendor_type": "sub_vendor",
    "super_vendor": "675d58a1c9f234567890bcde",
    "inventory": [
      {
        "product": {
          "_id": "675c47a2b8e9f123456789ab",
          "name": "VBike Model X",
          "base_price": 85000
        },
        "assigned_stock": 10,
        "sold_stock": 3,
        "available_stock": 7,
        "min_price": 78000,
        "max_price": 90000,
        "custom_price": 82000
      }
    ]
  }
}
```

---

## 🏷️ PRICING

### 2. Set Product Price
Sub vendor sets custom price within allowed limits.

```bash
curl -X PUT "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/set-price" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "custom_price": 82000
  }'
```

**Validation:**
- Price must be within `min_price` and `max_price` limits
- `can_set_custom_price` must be true in pricing_rules

**Response:**
```json
{
  "status": "success",
  "message": "Product price updated successfully",
  "data": {
    "product": "675c47a2b8e9f123456789ab",
    "custom_price": 82000,
    "min_price": 78000,
    "max_price": 90000
  }
}
```

**Error Example:**
```json
{
  "status": "error",
  "message": "Price cannot be below minimum: 78000"
}
```

---

## 💰 SALES

### 3. Sell Product
Sub vendor sells product from their inventory.

```bash
curl -X POST "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/sell" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 2,
    "selling_price": 82000,
    "customer_details": {
      "name": "Rahul Sharma",
      "phone": "+91-9988776655",
      "email": "rahul@example.com",
      "address": "Pune, Maharashtra"
    }
  }'
```

**Inventory Deduction Logic:**
1. Sub Vendor's `available_stock` reduced by 2
2. Sub Vendor's `sold_stock` increased by 2
3. Sub Vendor's `total_business` increased by ₹164,000
4. Sub Vendor's `total_bikes_sold` increased by 2
5. **If under Super Vendor:** Super Vendor's `sub_vendor_business` increased by ₹164,000

**Response:**
```json
{
  "status": "success",
  "message": "Sale completed successfully",
  "sale_details": {
    "product": "VBike Model X",
    "quantity": 2,
    "price_per_unit": 82000,
    "total_amount": 164000,
    "remaining_stock": 5,
    "customer": {
      "name": "Rahul Sharma",
      "phone": "+91-9988776655",
      "email": "rahul@example.com",
      "address": "Pune, Maharashtra"
    }
  }
}
```

**Validations:**
- Product must exist in sub vendor inventory
- Sufficient stock must be available
- If under super vendor, price must be within min/max limits
- Selling price validated against `min_price` and `max_price`

---

## 📊 SALES HISTORY

### 4. Get Sales History

```bash
curl -X GET "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/sales-history"
```

**Response:**
```json
{
  "status": "success",
  "vendor_name": "VBike Pune Dealership",
  "total_business": 328000,
  "total_bikes_sold": 4,
  "sales_data": [
    {
      "product": {
        "_id": "675c47a2b8e9f123456789ab",
        "name": "VBike Model X",
        "base_price": 85000
      },
      "assigned_stock": 10,
      "sold_stock": 4,
      "available_stock": 6,
      "custom_price": 82000
    }
  ]
}
```

---

## 👤 VENDOR MANAGEMENT

### 5. Create Sub Vendor (By Super Admin or Super Vendor)

**By Super Admin (Direct):**
```bash
curl -X POST "http://localhost:8000/api/vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VBike Nashik Dealership",
    "email": "nashik@vbike.com",
    "phone": "+91-9977665544",
    "address_line": "789 MG Road",
    "city": "Nashik",
    "state": "Maharashtra",
    "postal_code": "422001",
    "country": "India",
    "vendor_type": "direct",
    "inventory": []
  }'
```

**By Super Vendor:**
```bash
curl -X POST "http://localhost:8000/api/super-vendors/675d58a1c9f234567890bcde/create-sub-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VBike Nashik Dealership",
    "email": "nashik@vbike.com",
    "phone": "+91-9977665544",
    "address_line": "789 MG Road",
    "city": "Nashik",
    "state": "Maharashtra",
    "postal_code": "422001",
    "lat": 19.9975,
    "lng": 73.7898
  }'
```

---

### 6. Get All Sub Vendors

```bash
curl -X GET "http://localhost:8000/api/vendors"
```

---

### 7. Update Sub Vendor

```bash
curl -X PUT "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-9988776600",
    "email": "newemail@vbike.com",
    "status": "active"
  }'
```

---

## 📝 KEY RESPONSIBILITIES

✅ **Inventory:**
- Receives inventory from Super Admin or Super Vendor
- Cannot allocate inventory to others
- Can only sell from available stock

✅ **Pricing:**
- Can set custom price within defined limits (if allowed)
- Must respect `min_price` and `max_price` boundaries
- Pricing rules inherited from Super Vendor

✅ **Sales:**
- Can sell products to customers
- Must have available stock (cannot sell when inventory is zero)
- Sales tracked in own records and Super Vendor's records (if applicable)

✅ **Reports:**
- Can view own sales history
- Can view own inventory status
- Cannot view other vendors' data

---

## 🔄 Inventory Flow for Sub Vendor

### Scenario 1: Sub Vendor under Super Vendor
```
Super Admin → Super Vendor → Sub Vendor
                    ↓
            When Sub Vendor Sells:
            - Deduct from Sub Vendor inventory
            - Update Super Vendor business metrics
```

### Scenario 2: Sub Vendor directly under Super Admin
```
Super Admin → Sub Vendor (Direct)
        ↓
When Sub Vendor Sells:
- Deduct from Sub Vendor inventory
- No Super Vendor involved
```

---

## 🚫 RESTRICTIONS

❌ **Cannot Do:**
- Create other vendors
- Allocate inventory to others
- Modify base prices
- View other vendors' data
- Sell when inventory is zero
- Set price outside min/max limits (if under Super Vendor)

✅ **Can Do:**
- View own inventory
- Set custom prices (if allowed and within limits)
- Sell products from inventory
- View own sales history
- Update own contact details

---

## 💡 PRICING EXAMPLES

### Example 1: Under Super Vendor with Pricing Rules
```json
{
  "base_price": 85000,
  "min_price": 78000,  // Set by Super Vendor
  "max_price": 90000,  // Set by Super Vendor
  "custom_price": 82000  // Set by Sub Vendor (valid)
}
```

**Valid Prices:** ₹78,000 - ₹90,000  
**Custom Price:** ₹82,000 ✅

---

### Example 2: Direct Sub Vendor (No Super Vendor)
```json
{
  "base_price": 85000,
  "min_price": 76500,  // Set by Super Admin (10% discount)
  "max_price": 93500,  // Set by Super Admin (10% markup)
  "custom_price": 85000  // Sub Vendor uses base price
}
```

---

## 🔒 Authentication

All sub vendor routes should be protected with authentication middleware:

```javascript
router.use(protect);
router.use(authorize('vendor', 'admin', 'super_admin'));
```

---

## 📋 Complete Sale Workflow

### Step 1: Check Inventory
```bash
curl -X GET "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef"
```

### Step 2: Set Custom Price (if allowed)
```bash
curl -X PUT "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/set-price" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "custom_price": 82000
  }'
```

### Step 3: Sell Product
```bash
curl -X POST "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/sell" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 1,
    "selling_price": 82000,
    "customer_details": {
      "name": "Customer Name",
      "phone": "+91-9876543210"
    }
  }'
```

### Step 4: View Sales History
```bash
curl -X GET "http://localhost:8000/api/vendors/675e69b2d0f345678901cdef/sales-history"
```

---

## ⚠️ CRITICAL RULES

1. **Inventory Zero = Cannot Sell**
   - Sub vendor MUST have available stock
   - System blocks sale if `available_stock = 0`

2. **Price Validation**
   - If under Super Vendor: Must respect min/max limits
   - System validates price on every sale
   - Invalid price = Sale rejected

3. **Stock Deduction**
   - When Sub Vendor sells:
     - Sub Vendor's `available_stock` decreases
     - Sub Vendor's `sold_stock` increases
   - If under Super Vendor:
     - Super Vendor's `sub_vendor_business` increases
     - Inventory already deducted when transferred from Super Vendor

4. **No Direct Warehouse Access**
   - Sub Vendor cannot receive from main warehouse
   - Must receive via Super Admin or Super Vendor allocation
