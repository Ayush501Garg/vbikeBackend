# Super Vendor API - cURL Commands

Base URL: `http://localhost:8000`

---

## 1. CREATE SUPER VENDOR

```bash
curl -X POST http://localhost:8000/api/super-vendors \
-H "Content-Type: application/json" \
-d "{
  \"super_vendor_id\": \"SV-001\",
  \"company_name\": \"Delhi Bike Hub\",
  \"owner_name\": \"Rajesh Kumar\",
  \"phone\": \"+91 98765 43210\",
  \"email\": \"rajesh@delhihub.com\",
  \"address\": \"Shop No. 123, Connaught Place\",
  \"city\": \"Delhi\",
  \"state\": \"Delhi\",
  \"pincode\": \"110001\",
  \"longitude\": 77.2090,
  \"latitude\": 28.6139,
  \"gst_number\": \"07ABCDE1234F1Z5\",
  \"pan_number\": \"ABCDE1234F\",
  \"bank_account\": \"1234567890\",
  \"ifsc_code\": \"SBIN0001234\",
  \"bank_name\": \"State Bank of India\",
  \"coverage_area\": \"Delhi, Gurgaon, Noida\",
  \"status\": \"active\",
  \"notes\": \"Primary distributor for Delhi NCR\"
}"
```

---

## 2. GET ALL SUPER VENDORS

### Basic
```bash
curl -X GET http://localhost:8000/api/super-vendors
```

### With Filters
```bash
curl -X GET "http://localhost:8000/api/super-vendors?state=Delhi&status=active"
```

### With Search
```bash
curl -X GET "http://localhost:8000/api/super-vendors?search=bike"
```

---

## 3. GET SUPER VENDOR BY ID

```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID
```

**Example:**
```bash
curl -X GET http://localhost:8000/api/super-vendors/679053e1234567890abcdef1
```

---

## 4. UPDATE SUPER VENDOR

```bash
curl -X PUT http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID \
-H "Content-Type: application/json" \
-d "{
  \"company_name\": \"Delhi Bike Hub Updated\",
  \"phone\": \"+91 98765 00000\",
  \"status\": \"active\"
}"
```

---

## 5. DELETE SUPER VENDOR

```bash
curl -X DELETE http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID
```

---

## 6. GET SUPER VENDOR BY STATE

```bash
curl -X GET http://localhost:8000/api/super-vendors/state/Delhi
```

**Other States:**
```bash
curl -X GET http://localhost:8000/api/super-vendors/state/Maharashtra
curl -X GET http://localhost:8000/api/super-vendors/state/Karnataka
```

---

## 7. FIND NEARBY SUPER VENDORS (GEO-LOCATION)

```bash
curl -X GET "http://localhost:8000/api/super-vendors/nearby?longitude=77.2090&latitude=28.6139&maxDistance=50000"
```

**Parameters:**
- `longitude` - Longitude coordinate (required)
- `latitude` - Latitude coordinate (required)
- `maxDistance` - Distance in meters (optional, default: 50000 = 50km)

---

## 8. ASSIGN SUB-VENDORS TO SUPER VENDOR

```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/assign-vendors \
-H "Content-Type: application/json" \
-d "{
  \"vendor_ids\": [\"vendor_id_1\", \"vendor_id_2\", \"vendor_id_3\"]
}"
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/super-vendors/679053e1234567890abcdef1/assign-vendors \
-H "Content-Type: application/json" \
-d "{
  \"vendor_ids\": [\"678901234567890abcdef123\", \"678901234567890abcdef124\"]
}"
```

---

## 9. REMOVE SUB-VENDOR FROM SUPER VENDOR

```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/remove-vendor \
-H "Content-Type: application/json" \
-d "{
  \"vendor_id\": \"vendor_id_to_remove\"
}"
```

---

## 10. RECORD PAYMENT

### Cash Payment
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payments \
-H "Content-Type: application/json" \
-d "{
  \"amount\": 500000,
  \"payment_date\": \"2026-01-21\",
  \"payment_method\": \"cash\",
  \"notes\": \"Cash payment received for January bikes\"
}"
```

### Bank Transfer Payment
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payments \
-H "Content-Type: application/json" \
-d "{
  \"amount\": 2500000,
  \"payment_date\": \"2026-01-21\",
  \"payment_method\": \"bank_transfer\",
  \"payment_reference\": \"NEFT45678912345\",
  \"utr_number\": \"UTR123456789\",
  \"notes\": \"NEFT payment for bikes\"
}"
```

### Cheque Payment
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payments \
-H "Content-Type: application/json" \
-d "{
  \"amount\": 1800000,
  \"payment_date\": \"2026-01-21\",
  \"payment_method\": \"cheque\",
  \"cheque_number\": \"CHQ789456\",
  \"notes\": \"Cheque payment\"
}"
```

### Payment with Invoice Link
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payments \
-H "Content-Type: application/json" \
-d "{
  \"amount\": 1130000,
  \"payment_date\": \"2026-01-21\",
  \"payment_method\": \"bank_transfer\",
  \"payment_reference\": \"NEFT999888777\",
  \"invoice_id\": \"INVOICE_ID_HERE\",
  \"notes\": \"Payment for invoice INV-SV-2026-0015\"
}"
```

---

## 11. GET LEDGER

### All Transactions
```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger
```

### With Date Range
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger?startDate=2026-01-01&endDate=2026-01-31"
```

### Filter by Transaction Type
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger?transaction_type=payment"
```

**Transaction Types:** invoice, payment, credit_note, debit_note, adjustment

### Combined Filters
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger?startDate=2026-01-01&endDate=2026-01-31&transaction_type=payment"
```

---

## 12. EXPORT LEDGER TO CSV

```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger/export
```

**Save to file:**
```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger/export -o ledger.json
```

---

## 13. GET PAYMENT STATISTICS

```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payment-stats
```

---

## 14. CREATE INVOICE

### Simple Invoice
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices \
-H "Content-Type: application/json" \
-d "{
  \"items\": [
    {
      \"description\": \"V-Bike Model X - Electric Scooter\",
      \"quantity\": 10,
      \"unit_price\": 50000,
      \"discount\": 5000,
      \"tax_rate\": 18
    },
    {
      \"description\": \"V-Bike Model Y - Premium\",
      \"quantity\": 5,
      \"unit_price\": 75000,
      \"discount\": 0,
      \"tax_rate\": 18
    }
  ],
  \"due_date\": \"2026-02-21\",
  \"discount\": 10000,
  \"terms_and_conditions\": \"Payment due within 30 days\",
  \"notes\": \"Bulk order for January 2026\"
}"
```

### Invoice with Bike Model Reference
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices \
-H "Content-Type: application/json" \
-d "{
  \"items\": [
    {
      \"bike_model\": \"BIKE_MODEL_ID_HERE\",
      \"description\": \"V-Bike Model X\",
      \"quantity\": 20,
      \"unit_price\": 50000,
      \"discount\": 10000,
      \"tax_rate\": 18
    }
  ],
  \"due_date\": \"2026-02-21\",
  \"discount\": 5000,
  \"terms_and_conditions\": \"Payment within 30 days\",
  \"notes\": \"January bulk order\"
}"
```

### Invoice with Product Reference
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices \
-H "Content-Type: application/json" \
-d "{
  \"items\": [
    {
      \"product\": \"PRODUCT_ID_HERE\",
      \"description\": \"Battery Pack 48V\",
      \"quantity\": 50,
      \"unit_price\": 15000,
      \"discount\": 0,
      \"tax_rate\": 18
    }
  ],
  \"due_date\": \"2026-02-21\"
}"
```

---

## 15. GET ALL INVOICES

### All Invoices
```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices
```

### Filter by Status
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices?status=pending"
```

**Status Options:** draft, pending, partially_paid, paid, overdue, cancelled

### Filter by Payment Status
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices?payment_status=unpaid"
```

**Payment Status Options:** unpaid, partially_paid, paid

### Combined Filters
```bash
curl -X GET "http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices?status=pending&payment_status=unpaid"
```

---

## 16. GET SINGLE INVOICE BY ID

```bash
curl -X GET http://localhost:8000/api/super-vendors/invoices/INVOICE_ID
```

---

## 17. UPDATE INVOICE STATUS

```bash
curl -X PUT http://localhost:8000/api/super-vendors/invoices/INVOICE_ID/status \
-H "Content-Type: application/json" \
-d "{
  \"status\": \"paid\"
}"
```

**Status Options:**
- draft
- pending
- partially_paid
- paid
- overdue
- cancelled

**Examples:**
```bash
# Mark as cancelled
curl -X PUT http://localhost:8000/api/super-vendors/invoices/INVOICE_ID/status \
-H "Content-Type: application/json" \
-d "{\"status\": \"cancelled\"}"

# Mark as overdue
curl -X PUT http://localhost:8000/api/super-vendors/invoices/INVOICE_ID/status \
-H "Content-Type: application/json" \
-d "{\"status\": \"overdue\"}"
```

---

## 18. DELETE TRANSACTION

```bash
curl -X DELETE http://localhost:8000/api/super-vendors/transactions/TRANSACTION_ID
```

---

## 19. GET SUPER VENDOR DASHBOARD

```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/dashboard
```

---

## COMPLETE WORKFLOW EXAMPLE

### Step 1: Create Super Vendor for Delhi
```bash
curl -X POST http://localhost:8000/api/super-vendors \
-H "Content-Type: application/json" \
-d "{
  \"super_vendor_id\": \"SV-001\",
  \"company_name\": \"Delhi Bike Hub\",
  \"owner_name\": \"Rajesh Kumar\",
  \"phone\": \"+91 98765 43210\",
  \"email\": \"rajesh@delhihub.com\",
  \"address\": \"Shop No. 123, Connaught Place\",
  \"city\": \"Delhi\",
  \"state\": \"Delhi\",
  \"pincode\": \"110001\",
  \"longitude\": 77.2090,
  \"latitude\": 28.6139,
  \"gst_number\": \"07ABCDE1234F1Z5\",
  \"pan_number\": \"ABCDE1234F\",
  \"status\": \"active\"
}"
```

### Step 2: Assign Sub-Vendors (Replace IDs)
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/assign-vendors \
-H "Content-Type: application/json" \
-d "{
  \"vendor_ids\": [\"vendor_id_1\", \"vendor_id_2\"]
}"
```

### Step 3: Create Invoice
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/invoices \
-H "Content-Type: application/json" \
-d "{
  \"items\": [
    {
      \"description\": \"V-Bike Model X\",
      \"quantity\": 20,
      \"unit_price\": 50000,
      \"discount\": 10000,
      \"tax_rate\": 18
    }
  ],
  \"due_date\": \"2026-02-21\",
  \"discount\": 5000
}"
```

### Step 4: Record Payment
```bash
curl -X POST http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/payments \
-H "Content-Type: application/json" \
-d "{
  \"amount\": 500000,
  \"payment_date\": \"2026-01-21\",
  \"payment_method\": \"bank_transfer\",
  \"payment_reference\": \"NEFT123456789\",
  \"notes\": \"Partial payment\"
}"
```

### Step 5: Check Ledger
```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/ledger
```

### Step 6: View Dashboard
```bash
curl -X GET http://localhost:8000/api/super-vendors/SUPER_VENDOR_ID/dashboard
```

---

## TESTING WITH POSTMAN

Import these cURL commands directly into Postman:
1. Open Postman
2. Click "Import" button
3. Select "Raw text"
4. Paste any cURL command
5. Click "Continue"

---

## WINDOWS PowerShell Format

If using Windows PowerShell, use this format:

```powershell
$body = @{
    super_vendor_id = "SV-001"
    company_name = "Delhi Bike Hub"
    owner_name = "Rajesh Kumar"
    email = "rajesh@delhihub.com"
    state = "Delhi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/super-vendors" -Method Post -Body $body -ContentType "application/json"
```

---

## QUICK TEST COMMANDS

### 1. Test Server
```bash
curl http://localhost:8000
```

### 2. Create First Super Vendor
```bash
curl -X POST http://localhost:8000/api/super-vendors \
-H "Content-Type: application/json" \
-d "{\"super_vendor_id\":\"SV-001\",\"company_name\":\"Test Hub\",\"owner_name\":\"Test Owner\",\"phone\":\"+91 9876543210\",\"email\":\"test@test.com\",\"address\":\"Test Address\",\"city\":\"Delhi\",\"state\":\"Delhi\",\"pincode\":\"110001\",\"longitude\":77.2090,\"latitude\":28.6139,\"status\":\"active\"}"
```

### 3. Get All
```bash
curl http://localhost:8000/api/super-vendors
```

---

## ERROR RESPONSES

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

**Error Response (400/404/500):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## NOTES

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
