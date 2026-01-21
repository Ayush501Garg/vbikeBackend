# 🔐 SUPER ADMIN API DOCUMENTATION

Super Admin has complete system control and manages the main inventory, all vendors, products, and pricing.

**Base URL:** `http://localhost:8000/api/super-admin`

---

## 📦 INVENTORY MANAGEMENT

### 1. Get Main Inventory
Get all products in Super Admin's main warehouse inventory.

```bash
curl -X GET "http://localhost:8000/api/super-admin/inventory"
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total_stock": 5000,
  "total_value": 15000000,
  "data": [
    {
      "_id": "product_id",
      "name": "VBike Model X",
      "model": "X-2024",
      "base_price": 85000,
      "price": 85000,
      "stock_quantity": 500,
      "category_id": "electric_bike"
    }
  ]
}
```

---

### 2. Add Stock to Main Inventory
Super Admin receives stock from warehouse/manufacturer.

```bash
curl -X POST "http://localhost:8000/api/super-admin/inventory/add-stock" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Added 100 units to main inventory",
  "data": {
    "product": "VBike Model X",
    "new_stock": 600
  }
}
```

---

## 🎯 ALLOCATION TO VENDORS

### 3. Allocate Inventory to Super Vendor
Allocate stock from main inventory to a Super Vendor.

```bash
curl -X POST "http://localhost:8000/api/super-admin/allocate/super-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "superVendorId": "675d58a1c9f234567890bcde",
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 50,
    "discount_percentage": 5,
    "markup_percentage": 0
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Allocated 50 units to Super Vendor successfully",
  "remaining_main_stock": 550,
  "super_vendor_inventory": [
    {
      "product": {
        "_id": "675c47a2b8e9f123456789ab",
        "name": "VBike Model X",
        "base_price": 85000
      },
      "assigned_stock": 50,
      "sold_stock": 0,
      "available_stock": 50,
      "discount_percentage": 5,
      "markup_percentage": 0
    }
  ]
}
```

---

### 4. Allocate Inventory Directly to Sub Vendor
Super Admin can allocate inventory directly to any sub vendor (bypassing Super Vendor).

```bash
curl -X POST "http://localhost:8000/api/super-admin/allocate/sub-vendor" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "675e69b2d0f345678901cdef",
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 20,
    "min_price": 80000,
    "max_price": 90000,
    "custom_price": 85000
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Allocated 20 units to Sub Vendor directly",
  "remaining_main_stock": 530,
  "sub_vendor_inventory": [
    {
      "product": {
        "_id": "675c47a2b8e9f123456789ab",
        "name": "VBike Model X",
        "base_price": 85000
      },
      "assigned_stock": 20,
      "sold_stock": 0,
      "available_stock": 20,
      "min_price": 80000,
      "max_price": 90000,
      "custom_price": 85000
    }
  ]
}
```

---

## 💰 SALES

### 5. Super Admin Sells Product Directly
Super Admin can sell products directly from main inventory.

```bash
curl -X POST "http://localhost:8000/api/super-admin/sell" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "675c47a2b8e9f123456789ab",
    "quantity": 2,
    "selling_price": 85000,
    "customer_details": {
      "name": "Rajesh Kumar",
      "phone": "+91-9876543210",
      "email": "rajesh@example.com",
      "address": "Mumbai, Maharashtra"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Sale completed successfully",
  "sale_details": {
    "product": "VBike Model X",
    "quantity": 2,
    "price_per_unit": 85000,
    "total_amount": 170000,
    "remaining_stock": 528,
    "customer": {
      "name": "Rajesh Kumar",
      "phone": "+91-9876543210",
      "email": "rajesh@example.com",
      "address": "Mumbai, Maharashtra"
    }
  }
}
```

---

## 📊 REPORTS & ANALYTICS

### 6. Get All Vendors Report
View all Super Vendors and Sub Vendors with their inventory and sales data.

```bash
curl -X GET "http://localhost:8000/api/super-admin/vendors/all"
```

**Response:**
```json
{
  "success": true,
  "super_vendors": {
    "count": 5,
    "data": [
      {
        "_id": "675d58a1c9f234567890bcde",
        "company_name": "VBike Maharashtra",
        "state": "Maharashtra",
        "total_business": 5000000,
        "direct_bikes_sold": 45,
        "sub_vendor_bikes_sold": 120,
        "inventory": [...],
        "sub_vendors": [...]
      }
    ]
  },
  "sub_vendors": {
    "count": 25,
    "data": [...]
  }
}
```

---

### 7. Get Inventory Report Across All Levels
Comprehensive inventory report showing distribution across all levels.

```bash
curl -X GET "http://localhost:8000/api/super-admin/reports/inventory"
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "product": {
        "id": "675c47a2b8e9f123456789ab",
        "name": "VBike Model X",
        "model": "X-2024",
        "base_price": 85000
      },
      "main_inventory": 528,
      "super_vendor_stock": {
        "total_assigned": 200,
        "total_available": 150,
        "total_sold": 50
      },
      "sub_vendor_stock": {
        "total_assigned": 300,
        "total_available": 180,
        "total_sold": 120
      }
    }
  ]
}
```

---

## 🏷️ PRODUCT MANAGEMENT

### 8. Update Product Base Price
Super Admin sets the base price (MRP) for products.

```bash
curl -X PUT "http://localhost:8000/api/super-admin/products/675c47a2b8e9f123456789ab/base-price" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price": 90000
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Base price updated successfully",
  "data": {
    "product": "VBike Model X",
    "old_price": 85000,
    "new_base_price": 90000
  }
}
```

---

## 📝 KEY RESPONSIBILITIES

✅ **Inventory Control:**
- Main inventory always with Super Admin
- Can allocate to Super Vendors or Sub Vendors directly
- Can sell products directly

✅ **Vendor Management:**
- Create and manage Super Vendors
- Create and manage Sub Vendors (direct or under Super Vendor)
- View all vendor reports

✅ **Pricing Authority:**
- Set base price (MRP) for all products
- Control pricing policies across the system

✅ **Complete Visibility:**
- Access all inventory reports
- View all sales data
- Monitor all vendor activities

---

## 🔒 Authentication
All Super Admin routes should be protected with authentication middleware:

```javascript
router.use(protect);
router.use(authorize('super_admin'));
```

---

## 🎯 Inventory Flow Summary

```
Main Warehouse (Super Admin)
    ├── Allocate → Super Vendor
    │       ├── Super Vendor Sells
    │       └── Allocate → Sub Vendor → Sub Vendor Sells
    │
    ├── Allocate → Sub Vendor (Direct) → Sub Vendor Sells
    │
    └── Super Admin Sells (Direct)
```
