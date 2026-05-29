# Deposit API - Admin Side

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

## Get Deposit Orders

**Get all orders with filters (supports userId or mobile):**

```
GET /admin/deposits?page=1&limit=50&status=PENDING&dateFrom=2026-03-01&dateTo=2026-03-20
```

**Get orders by user:**

```
GET /admin/deposits?userId=123456&page=1&limit=50
```

**Get orders by mobile:**

```
GET /admin/deposits?mobile=3333333333&page=1&limit=50
```

**Get single order:**

```
GET /admin/deposits?orderId=ODR1234567890123456
```

### Query Params

| Param | Type | Required | Description |
|-------|------|---------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50, max: 100) |
| status | string | No | Filter: PENDING, SUCCESS, FAILED, REFUNDED, EXPIRED |
| userId | number | No | Filter by user ID |
| mobile | string | No | Filter by 10-digit mobile number |
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
      "orderId": "ODR1234567890123456",
      "userId": 123456,
      "amount": 1000.0,
      "currency": "INR",
      "status": "PENDING",
      "gatewayOrderNo": "gw123456",
      "channelName": "SimplyPay",
      "note": "Deposit request",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "updatedAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}

**Note:** `_id` and `paymentLinks` are excluded from list responses.

### Deposit Status Values

| Status | Description |
|--------|-------------|
| PENDING | Deposit initiated, awaiting payment confirmation |
| SUCCESS | Payment received and credited to user wallet |
| FAILED | Payment failed or rejected |
| REFUNDED | Amount refunded to user |
| EXPIRED | Payment link expired |

---

## Approve Deposit Order

```
POST /admin/deposits/approve
```

**Body:**

```json
{
  "orderId": "ODR1234567890123456"
}
```

**Response:**

```json
{
  "msg": "Deposit approved",
  "orderId": "ODR1234567890123456",
  "userId": 123456,
  "amount": 1000.0,
  "status": "SUCCESS",
  "firstDepositBonus": 0
}
```

---

## Deposit Channel Config

### Get All Channels

```
GET /admin/deposit-config
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "channel": "simplypay",
      "name": "SimplyPay",
      "isActive": true,
      "minAmount": 100,
      "maxAmount": 100000,
      "exchangeRate": 1,
      "sortOrder": 0,
      "description": "UPI / Bank Transfer"
    },
    {
      "channel": "gspayusdt",
      "name": "USDT",
      "isActive": true,
      "minAmount": 1,
      "maxAmount": 1000,
      "exchangeRate": 90,
      "sortOrder": 2,
      "description": "USDT (Tether)"
    }
  ]
}
```

### Update a Channel

```
PUT /admin/deposit-config/:channel
```

**Body (all fields optional):**

```json
{
  "isActive": false,
  "minAmount": 500,
  "maxAmount": 100000
}
```

| Param | Type | Description |
|-------|------|-------------|
| isActive | boolean | Enable/disable the channel |
| minAmount | number | Minimum deposit amount |
| maxAmount | number | Maximum deposit amount |
| exchangeRate | number | Exchange rate (e.g., 90 for USDT → INR) |
| name | string | Display name |
| description | string | Channel description |
| sortOrder | number | Display order |

**Response:**

```json
{
  "status": "success",
  "data": {
    "channel": "simplypay",
    "name": "SimplyPay",
    "isActive": false,
    "minAmount": 500,
    "maxAmount": 100000,
    "sortOrder": 0,
    "description": "UPI / Bank Transfer",
    "createdAt": "2026-05-29T12:41:09.804Z",
    "updatedAt": "2026-05-29T12:41:09.804Z"
  }
}
```
