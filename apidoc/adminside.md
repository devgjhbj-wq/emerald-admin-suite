# Withdrawal API - Admin Side

## Base URL

```
https://backend-ledger-0ra6.onrender.com/api
```

## Authentication

All admin endpoints require Bearer token with admin privileges:

```
Authorization: Bearer <admin_token>
```

---

## Get Withdrawal Orders

**Get all orders with filters:**

```
GET /admin/withdrawals?page=1&limit=50&status=PENDING&dateFrom=2026-03-01&dateTo=2026-03-20
```

**Get orders by user:**

```
GET /admin/withdrawals?userId=123456&page=1&limit=50
```

**Get single order:**

```
GET /admin/withdrawals?orderId=WD1234567890123456
```

### Query Params

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |
| status | string | No | Filter: PENDING, AUDITING, SUCCESS, FAILED, CANCELLED |
| userId | number | No | Filter by user ID |
| dateFrom | string | No | Start date (YYYY-MM-DD) |
| dateTo | string | No | End date (YYYY-MM-DD) |
| orderId | string | No | Get single order by ID |

### Response (paginated)

```json
{
  "status": "success",
  "total": 150,
  "page": 1,
  "limit": 50,
  "items": [
    {
      "orderId": "WD1234567890123456",
      "userId": 123456,
      "amount": 500.0,
      "charge": 23.5,
      "currency": "INR",
      "status": "PENDING",
      "paymentMethod": "UPI",
      "paymentDetails": {
        "upiId": "user@paytm",
        "accountNo": "",
        "ifsc": "",
        "bankName": "",
        "rplId": "",
        "holderName": "John Doe"
      },
      "channelName": "SimplyPay",
      "note": "Withdrawal request",
      "gatewayResponse": null,
      "createdAt": "2026-03-19T10:30:00.000Z",
      "updatedAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

### Payment Types

| Type | Gateway | Identifier |
|------|---------|-----------|
| **UPI** | SimplyPay | `paymentDetails.upiId` (e.g., user@paytm) |
| **BANK** | SimplyPay | `paymentDetails.accountNo` + `ifsc` |
| **UPAY** | Upay | `paymentDetails.rplId` |

### Withdrawal Status Values

| Status | Description |
|--------|-------------|
| PENDING | Withdrawal requested, awaiting admin approval |
| AUDITING | Admin approved, payout order created with gateway |
| SUCCESS | Payout completed successfully |
| FAILED | Payout failed (amount refunded automatically — charge was never deducted) |
| CANCELLED | Payout cancelled/refunded (full amount returned — no charge to refund) |

---

## Withdrawal Config

### Get Config

```
GET /admin/withdrawal-config
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "key": "default",
    "perDayLimit": 3,
    "limits": {
      "BANK": { "min": 110, "max": 50000 },
      "UPI": { "min": 300, "max": 15000 },
      "UPAY": { "min": 300, "max": 50000 }
    }
  }
}
```

### Update Config

```
PUT /admin/withdrawal-config
```

**Body (partial update — only send fields to change):**

```json
{
  "perDayLimit": 5,
  "limits": {
    "UPI": { "max": 20000 },
    "BANK": { "min": 200, "max": 100000 }
  }
}
```

**Response:** Returns the updated config document.

---

## Approve Withdrawal Order

```
POST /admin/withdrawals/approve
```

**Body:**

```json
{
  "orderId": "WD1234567890123456",
  "chargeFrom": "user"
}
```

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| orderId | string | Yes | Withdrawal order ID |
| chargeFrom | string | Yes | `"user"` or `"platform"` — who bears the 3.5% + ₹6 charge |

### Charge Behavior

| chargeFrom | User Wallet Deducted | Gateway Payout | Charge Recorded |
|-----------|---------------------|----------------|-----------------|
| `"user"` | Full amount (e.g., ₹500) | Amount - charge (e.g., ₹476.50) | Yes (on order) |
| `"platform"` | Full amount (e.g., ₹500) | Full amount (e.g., ₹500) | No (0) |

### Gateway Routing

The approval automatically routes to the correct payout gateway based on `paymentMethod`:

| Payment Method | Gateway | Details Sent |
|----------------|---------|-------------|
| **UPI** | SimplyPay | `payoutType: "UPI"`, `vpa: upiId`, `name`, `email`, `mobile` |
| **BANK** | SimplyPay | `payoutType: "IFSC"`, `ifsc`, `account`, `name`, `email`, `mobile` |
| **UPAY** | Upay | `rplId` as payout address |

**Response (chargeFrom = "user"):**

```json
{
  "status": "success",
  "msg": "Withdrawal approved and payout order created",
  "orderId": "WD1234567890123456",
  "userId": 123456,
  "amount": 500.0,
  "charge": 23.5,
  "payoutAmount": 476.5,
  "chargeFrom": "user",
  "gatewayOrderNo": "dc07e03f03b94e8a9f29702863d35fd5",
  "gatewayResponse": null,
  "status": "AUDITING"
}
```

**Response (chargeFrom = "platform"):**

```json
{
  "status": "success",
  "msg": "Withdrawal approved and payout order created",
  "orderId": "WD1234567890123456",
  "userId": 123456,
  "amount": 500.0,
  "charge": 0,
  "payoutAmount": 500.0,
  "chargeFrom": "platform",
  "gatewayOrderNo": "UPAY_ORDER_CODE",
  "gatewayResponse": null,
  "status": "AUDITING"
}
```

**Error (gateway failure):** The exact gateway error message is saved to `gatewayResponse` on the order and returned in the response. `chargeFrom` and `charge` are reset to allow re-approval.

```json
{
  "status": "failed",
  "msg": "Payout gateway error: Insufficient balance",
  "orderId": "WD1234567890123456",
  "gatewayError": "Payout gateway error: Insufficient balance"
}
```

**Error (already processed — race condition protection):**

```json
{
  "status": "failed",
  "msg": "Cannot approve: order is in AUDITING status",
  "currentStatus": "AUDITING"
}
```

> ⚡ **Optimization:** The approve endpoint now uses **atomic optimistic locking** (`findOneAndUpdate` with status filter). If two admins click "approve" simultaneously on the same order, only one succeeds — the second receives HTTP `409` with the current status. This prevents double-payouts.

---

## Cancel Withdrawal Order

```
POST /admin/withdrawals/cancel
```

Cancels a withdrawal (PENDING or AUDITING) and refunds the full amount to user wallet (no charge was deducted). The cancelled order no longer counts toward the user's daily 3-withdrawal limit, freeing a slot for a new request. The `note` is saved on the order and visible to the user in their withdrawal history.

> ⚡ **Optimizations:** 
> - **Atomic optimistic locking** prevents race conditions if two admins cancel the same order simultaneously (returns HTTP `409`).
> - **MongoDB transaction** wraps the refund (balance update + ledger entry) for data consistency — if the process crashes mid-refund, the entire operation rolls back.

**Body:**

```json
{
  "orderId": "WD1234567890123456",
  "note": "Customer requested cancellation via support"
}
```

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| orderId | string | Yes | Withdrawal order ID |
| note | string | No | Custom cancellation reason (default: "Cancelled by admin") |

**Response:**

```json
{
  "status": "success",
  "msg": "Withdrawal cancelled and refunded",
  "orderId": "WD1234567890123456",
  "userId": 123456,
  "amount": 500.0,
  "charge": 0,
  "refundAmount": 500.0,
  "note": "Customer requested cancellation via support"
}
```

---

## User Payment Methods (Admin)

### List User Payment Methods

```
GET /admin/user/payment-methods?userId=123456
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "...",
      "userId": 123456,
      "type": "UPI",
      "upiId": "user@paytm",
      "holderName": "John Doe",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

### Update User Payment Method

```
PUT /admin/user/payment-methods/:id
```

**Body:**

```json
{
  "upiId": "newuser@paytm",
  "holderName": "John Updated",
  "isDefault": true,
  "isActive": false
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "userId": 123456,
    "type": "UPI",
    "upiId": "newuser@paytm",
    "holderName": "John Updated",
    "isDefault": true,
    "isActive": false
  }
}
```

### Update User Bank Account (Legacy)

```
PUT /admin/user/bind-bank
```

**Body:**

```json
{
  "userId": 123456,
  "bankName": "SBI",
  "bankCode": "SBIN",
  "accountNumber": "1234567890",
  "accountHolder": "John Doe"
}
```
