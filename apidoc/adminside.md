# Transaction API - Admin Side

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

## Search Transactions

Search the transaction ledger by userId, orderId, or transactionId with optional filters.

```
GET /admin/transactions
```

**Search by user:**

```
GET /admin/transactions?userId=123456&page=1&limit=25
```

**Search by order ID (deposit/withdrawal order):**

```
GET /admin/transactions?orderId=DEP123456
```

**Search by MongoDB transaction ID:**

```
GET /admin/transactions?transactionId=507f1f77bcf86cd799439011
```

**Combined with type and date filters:**

```
GET /admin/transactions?userId=123456&type=DEPOSIT&dateFrom=2026-03-01&dateTo=2026-03-31&page=1&limit=50
```

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | No* | Filter by user ID |
| orderId | string | No* | Search by exact order ID (DEP/WD prefix) |
| transactionId | string | No* | Search by MongoDB _id |
| type | string | No | Filter by transaction type |
| dateFrom | string | No | Start date (YYYY-MM-DD or ISO) |
| dateTo | string | No | End date (YYYY-MM-DD or ISO) |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 25, max: 100) |

*At least one of `userId`, `orderId`, or `transactionId` is required.

**Transaction Types:**

| Type | Description |
|------|-------------|
| `DEPOSIT` | Deposit credit |
| `WITHDRAW` | Withdrawal debit |
| `WITHDRAW_REFUND` | Withdrawal refund |
| `BET` | Bet placement debit |
| `WIN` | Bet win credit |
| `REFUND` | Bet refund |
| `BONUS` | Bonus credit |
| `ADMIN` | Admin adjustment |
| `SIGNUP_BONUS` | Signup bonus |
| `FIRST_DEPOSIT_BONUS` | First deposit bonus |
| `GIFT_CODE` | Gift code redemption |
| `AGENT_COMMISSION` | Agent commission |
| `gameIn` | Transfer to game wallet |
| `gameOut` | Transfer from game wallet |

**Response (by userId):**

```json
{
  "filter": {
    "userId": 123456
  },
  "total": 50,
  "page": 1,
  "limit": 25,
  "items": [
    {
      "userId": 123456,
      "type": "DEPOSIT",
      "amount": 1000.0,
      "charge": 0,
      "balanceAfter": 2000.0,
      "status": "SUCCESS",
      "orderId": "DEP123456",
      "remark": "Deposit via Paysimply",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "updatedAt": "2026-03-19T10:30:00.000Z"
    },
    {
      "userId": 123456,
      "type": "WITHDRAW",
      "amount": 500.0,
      "charge": 0,
      "balanceAfter": 1500.0,
      "status": "PENDING",
      "orderId": "WD1234567890123",
      "remark": "Withdrawal request",
      "createdAt": "2026-03-19T11:00:00.000Z",
      "updatedAt": "2026-03-19T11:00:00.000Z"
    }
  ]
}
```

**Response (by orderId — single result):**

```json
{
  "filter": {
    "orderId": "DEP123456"
  },
  "total": 1,
  "page": 1,
  "limit": 25,
  "items": [
    {
      "userId": 123456,
      "type": "DEPOSIT",
      "amount": 1000.0,
      "charge": 0,
      "balanceAfter": 2000.0,
      "status": "SUCCESS",
      "orderId": "DEP123456",
      "remark": "Deposit via Paysimply",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "updatedAt": "2026-03-19T10:30:00.000Z"
    }
  ]
}
```

**Ledger Fields:**

| Field | Type | Description |
|-------|------|-------------|
| userId | number | User ID |
| type | string | Transaction type |
| amount | number | Transaction amount (+ve credit, -ve debit) |
| charge | number | Fee charged |
| balanceAfter | number | Wallet balance after transaction |
| status | string | PENDING, SUCCESS, FAILED |
| orderId | string | Related order ID (deposit/withdraw orders) |
| remark | string | Free-text note |
| createdAt | datetime | When transaction occurred |
| updatedAt | datetime | Last update timestamp |

---

## Error Responses

### 400 Bad Request

```json
{
  "msg": "Provide userId, orderId, or transactionId"
}
```

### 400 Invalid Transaction ID

```json
{
  "msg": "Invalid transactionId"
}
```

### 400 Invalid Type

```json
{
  "msg": "Invalid type. Must be one of: DEPOSIT, WITHDRAW, ..."
}
```

### 404 Not Found

```json
{
  "msg": "No transactions found"
}
```
