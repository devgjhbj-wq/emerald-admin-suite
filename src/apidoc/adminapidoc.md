# Admin Side API Documentation

## Base URL

```
https://backend-ledger-0ra6.onrender.com/api
```

## Authentication

All admin endpoints require Bearer token with admin privileges in header:

```
Authorization: Bearer <admin_token>
```

---

## 1. Dashboard

### Get Admin Dashboard

```
GET /admin/dashboard
```

**Response:**

```json
{
  "status": "success",
  "totalUsers": 1000,
  "totalDeposits": 50000.0,
  "activeUsers": 500,
  "newUsersToday": 10
}
```

---

## 2. User Management

### Search User or Account

```
GET /admin/user?mobile=9876543210
```

or

```
GET /admin/user?userId=123456
```

**Response:**

```json
{
  "status": "success",
  "user": {
    "userId": 123456,
    "mobile": "9876543210",
    "vipLevel": "VIP1",
    "admin": false,
    "status": "active"
  },
  "account": {
    "user": 123456,
    "balance": 1000.0,
    "withdrawable": 0,
    "turnover_requirement": 500,
    "totalDeposits": 5000.0,
    "vipLevel": "VIP1",
    "gameMemberCreated": true
  }
}
```

### Update User Status

```
PATCH /admin/user
```

**Body:**

```json
{
  "userId": 123456,
  "status": "suspended"
}
```

**Status values:** `active`, `inactive`, `suspended`

### Update User Bank

```
PUT /admin/user/bind-bank
```

**Body:**

```json
{
  "userId": 123456,
  "bankName": "SBI",
  "bankCode": "SBI",
  "accountNumber": "1234567890",
  "accountHolder": "John Doe"
}
```

---

## 3. Deposits

### Get Deposit Orders

```
GET /admin/deposits?page=1&limit=25&status=pending
```

**Query Params:**
| Param | Description |
|-------|-------------|
| page | Page number |
| limit | Items per page |
| status | pending, approved, rejected |
| userId | Filter by user |

**Response:**

```json
{
  "status": "success",
  "page": 1,
  "limit": 25,
  "total": 100,
  "items": [...]
}
```

### Approve Deposit

```
POST /admin/deposits/approve
```

**Body:**

```json
{
  "orderId": "DEP123456",
  "approved": true
}
```

**Note:** Approving a deposit will add turnover requirement to the user.

---

## 4. Transactions

### Get User Transactions

```
GET /admin/transactions?userId=123456&page=1&limit=25
```

**Query Params:** userId, page, limit, type (DEPOSIT, WITHDRAW, GAME_IN, GAME_OUT)

---

## 5. Withdrawals

### Get Withdrawal Orders

```
GET /admin/withdrawals?userId=123456&page=1&limit=25&status=PENDING
```

or

```
GET /admin/withdrawals?orderId=WD12345617234567890
```

**Description:** Search for withdrawal orders by userId or orderId. Returns paginated results with optional status filtering.

**Query Params:**
| Param | Type | Required | Description |
|-------|------|---------|-------------|
| userId | number | Yes* | User ID (*required if orderId not provided) |
| orderId | string | Yes* | Withdrawal order ID (*required if userId not provided) |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 25, max: 100) |
| status | string | No | Filter by status: PENDING, APPROVED, REJECTED, COMPLETED |

**Response (by userId):**

```json
{
  "status": "success",
  "userId": 123456,
  "page": 1,
  "limit": 25,
  "total": 5,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": 123456,
      "type": "WITHDRAW",
      "amount": 500.0,
      "balanceAfter": 1500.0,
      "status": "PENDING",
      "orderId": "WD12345617234567890",
      "remark": "Withdrawal request",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "bankDetails": {
        "bankName": "SBI",
        "bankCode": "SBI",
        "accountNumber": "1234567890",
        "accountHolder": "John Doe"
      }
    }
  ]
}
```

**Response (by orderId):**

```json
{
  "status": "success",
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": 123456,
      "type": "WITHDRAW",
      "amount": 500.0,
      "balanceAfter": 1500.0,
      "status": "PENDING",
      "orderId": "WD12345617234567890",
      "remark": "Withdrawal request",
      "createdAt": "2026-03-19T10:30:00.000Z",
      "bankDetails": {
        "bankName": "SBI",
        "bankCode": "SBI",
        "accountNumber": "1234567890",
        "accountHolder": "John Doe"
      }
    }
  ]
}
```

**Error Response (no results):**

```json
{
  "status": "failed",
  "msg": "No withdrawal orders found"
}
```

---

## 6. Game - Bet Records

### Create Bet Record (Admin - Simple)

```
POST /admin/bet-record
```

**Description:** Admin-only endpoint to create a bet record for a user with minimal parameters. Turnover is automatically set equal to bet amount.

**Body:**

| Param   | Type   | Required | Description                                      |
| ------- | ------ | -------- | ------------------------------------------------ |
| userId  | number | Yes      | User ID                                          |
| amount  | number | Yes      | Bet amount (positive for win, negative for loss) |
| product | string | No       | Game type (default: SL)                          |
| gameId  | string | No       | Game ID (default: "0")                           |
| site    | string | No       | Provider code (default: JE)                      |
| status  | number | No       | Status (1=valid, default)                        |

**Note:** `bet`, `payout`, and `turnover` are all automatically set to the same value based on `amount`.

**Example:**

```json
{
  "userId": 32545513,
  "amount": 100
}
```

**Response:**

```json
{
  "status": "success",
  "msg": "Bet record created successfully",
  "record": {
    "_id": "...",
    "member": "u32545513",
    "site": "JE",
    "product": "SL",
    "gameId": "0",
    "refNo": "ADM1234567890ABCDEF",
    "bet": 100,
    "payout": 100,
    "turnover": 100,
    "status": 1,
    "betTime": "2026-03-17T10:30:00.000Z",
    "settleTime": "2026-03-17T10:30:00.000Z"
  },
  "withdrawableUpdated": {
    "processed": 1,
    "turnover_requirement": 900,
    "canWithdraw": false
  }
}
```

**Note:**

- Positive amount = win (payout = amount)
- Negative amount = loss (payout = 0)
- Creating bet records will reduce user's turnover requirement

### Create Bet Record (Admin - Detailed)

```
POST /api/game/create-bet
```

**Description:** Admin-only endpoint to create a bet record with full control over all fields. Matches the exact structure of bet records from game provider sync.

**Body:**

| Param      | Type   | Required | Description                                |
| ---------- | ------ | -------- | ------------------------------------------ |
| member     | string | Yes      | Member username (e.g., u32545526)          |
| site       | string | Yes      | Provider code (e.g., JE)                   |
| product    | string | No       | Game type (default: "")                    |
| gameId     | string | No       | Game ID (default: "")                      |
| refNo      | string | No       | Reference number (auto-generated if empty) |
| betTime    | string | No       | Bet time ISO string                        |
| settleTime | string | No       | Settlement time ISO string                 |
| bet        | number | Yes      | Bet amount                                 |
| payout     | number | No       | Payout amount (default: 0)                 |
| status     | number | No       | Status (default: 0)                        |
| userId     | number | No       | User ID for turnover processing            |

**Note:** `turnover` is automatically set equal to `bet`. All fields match the exact structure of game provider bet records. When `userId` is provided, this bet will trigger turnover reduction for that user.

**Example:**

```json
{
  "member": "u32545526",
  "site": "JE",
  "product": "SL",
  "gameId": "51",
  "refNo": "ADM1773889856810BI74RG",
  "betTime": "2026-03-19T03:10:56.810Z",
  "settleTime": "2026-03-19T03:10:56.810Z",
  "bet": 200,
  "payout": 200,
  "status": 1,
  "userId": 32545526
}
```

**Response:**

```json
{
  "status": "success",
  "msg": "Bet record created successfully",
  "record": {
    "_id": "...",
    "member": "u32545526",
    "site": "JE",
    "product": "SL",
    "gameId": "51",
    "refNo": "ADM1773889856810BI74RG",
    "betTime": "2026-03-19T03:10:56.810Z",
    "settleTime": "2026-03-19T03:10:56.810Z",
    "bet": 200,
    "payout": 200,
    "turnover": 200,
    "status": 1
  },
  "turnoverUpdated": {
    "processed": 1,
    "totalReduced": 200,
    "turnover_requirement": 800,
    "batchesRemaining": 1,
    "canWithdraw": false
  }
}
```

### Search Bets by Member

```
GET /game/all-bets?member=u32545543&page=1&limit=50&site=JE
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| member | string | Member username (required, e.g., u123456) |
| page | number | Page number |
| limit | number | Items per page |
| site | string | Provider code (JE, JD, PG, etc.) |
| status | number | 1=valid, 0=running, -1=invalid |
| dateFrom | string | Start date (YYYY-MM-DD) |
| dateTo | string | End date (YYYY-MM-DD) |

**Response:**

```json
{
  "status": "success",
  "member": "u32545543",
  "page": 1,
  "limit": 50,
  "total": 100,
  "summary": {
    "totalBet": 5000.0,
    "totalPayout": 4500.0,
    "totalTurnover": 5000.0,
    "netPnl": -500.0
  },
  "items": [...]
}
```

### Sync Bet Records from Provider

```
POST /game/sync-bets
```

**Description:** Fetches bet records from game provider API and auto-updates turnover.

**Response:**

```json
{
  "status": "success",
  "fetched": 300,
  "inserted": 50,
  "updated": 20,
  "skipped": 230,
  "marked": 300,
  "betCalc": {
    "total": 100,
    "success": 95
  }
}
```

### Move Game Balance to Wallet (Admin)

```
POST /admin/move-game-to-wallet
```

**Description:** Admin endpoint to transfer a user's game balance from game provider to their main wallet. This moves all funds from the specified provider (JE, JD, PG, TU) back to the user's wallet balance.

**Body:**

```json
{
  "userId": 32545513,
  "providerCode": "JE"
}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | Yes | User ID to move balance for |
| providerCode | string | No | Provider code: JE, JD, PG, TU (default: JE) |

**Response (Success):**

```json
{
  "status": "success",
  "msg": "Balance moved from game to wallet",
  "userId": 32545513,
  "providerCode": "JE",
  "moveOut": {
    "amount": 500,
    "referenceId": "GMOUT455132M5ABC1234"
  },
  "walletBalance": 1500
}
```

**Response (No Balance):**

```json
{
  "status": "success",
  "msg": "No balance to move out from game",
  "userId": 32545513,
  "providerCode": "JE",
  "moveOut": {
    "amount": 0
  }
}
```

**Note:** This creates a `gameOut` transaction record in the user's ledger with remark `ADMIN_MOVE_OUT_{providerCode}`.

---

## 7. VIP Configuration

### Get VIP Config

```
GET /admin/vip-config
```

**Response:**

```json
{
  "status": "success",
  "levels": [
    {
      "name": "VIP0",
      "minDeposit": 0,
      "dailyWithdrawLimit": 0,
      "monthlyCheckinBonus": 0,
      "upgradeReward": 0
    },
    {
      "name": "VIP1",
      "minDeposit": 1000,
      "dailyWithdrawLimit": 1000,
      "monthlyCheckinBonus": 50,
      "upgradeReward": 100
    }
  ]
}
```

### Update VIP Config

```
PUT /admin/vip-config
```

**Body:**

```json
{
  "levels": [
    {
      "name": "VIP0",
      "minDeposit": 0,
      "dailyWithdrawLimit": 0,
      "monthlyCheckinBonus": 0,
      "upgradeReward": 0
    }
  ]
}
```

---

## 8. Agent

### Get Agent Stats

```
GET /admin/agent-stats?userId=123456
```

**Response:**

```json
{
  "status": "success",
  "userId": 123456,
  "inviteCode": "ABC123",
  "levels": {
    "level1": {
      "deposit": 10000.0,
      "commission": 100.0,
      "count": 5
    },
    "level2": {
      "deposit": 5000.0,
      "commission": 50.0,
      "count": 10
    },
    "level3": {
      "deposit": 2000.0,
      "commission": 20.0,
      "count": 20
    }
  }
}
```

### Get Agent Config

```
GET /admin/agent-config
```

### Update Agent Config

```
PUT /admin/agent-config
```

---

## 9. Logs

### Get Server Logs

```
GET /admin/logs?page=1&limit=50
```

---

## 10. Turnover Management

### Get Turnover Config

```
GET /admin/turnover-config
```

**Response:**

```json
{
  "status": "success",
  "configs": [
    {
      "_id": "...",
      "type": "DEPOSIT",
      "multiplier": 1,
      "description": "Deposit turnover requirement",
      "active": true
    },
    {
      "type": "VIP_BONUS",
      "multiplier": 1,
      "description": "VIP Bonus turnover requirement",
      "active": true
    },
    {
      "type": "MONTHLY_BONUS",
      "multiplier": 1,
      "description": "Monthly check-in bonus",
      "active": true
    },
    {
      "type": "UPGRADE_BONUS",
      "multiplier": 1,
      "description": "VIP upgrade bonus",
      "active": true
    },
    {
      "type": "ADMIN_BONUS",
      "multiplier": 1,
      "description": "Admin added bonus",
      "active": true
    },
    {
      "type": "REFERRAL_BONUS",
      "multiplier": 1,
      "description": "Referral bonus",
      "active": true
    },
    {
      "type": "PROMOTION",
      "multiplier": 1,
      "description": "Promotion bonus",
      "active": true
    }
  ]
}
```

### Update Turnover Config

```
PUT /admin/turnover-config
```

**Body:**

```json
{
  "type": "DEPOSIT",
  "multiplier": 2,
  "active": true,
  "description": "Deposit requires 2x turnover"
}
```

**Transaction Types:**

| Type                 | Description                        |
| -------------------- | ---------------------------------- |
| DEPOSIT              | Deposit turnover requirement       |
| SIGNUP_BONUS         | Signup bonus turnover             |
| FIRST_DEPOSIT_BONUS  | First deposit bonus turnover      |
| VIP_BONUS            | VIP Bonus turnover requirement    |
| MONTHLY_BONUS         | Monthly check-in bonus            |
| UPGRADE_BONUS        | VIP upgrade bonus                 |
| ADMIN_BONUS          | Admin added bonus                 |
| REFERRAL_BONUS       | Referral bonus                    |
| PROMOTION            | Promotion bonus                   |

### Get User Turnover Status

```
GET /admin/turnover-status?userId=123456
```

**Response:**

```json
{
  "status": "success",
  "turnover_requirement": 500,
  "total_turnover_completed": 1500,
  "progress": 75,
  "canWithdraw": false,
  "batches": [
    {
      "type": "DEPOSIT",
      "amount": 1000,
      "multiplier": 1,
      "required": 1000,
      "completed": 1000,
      "remaining": 0,
      "createdAt": "2026-03-17T10:00:00.000Z",
      "lastCalcAt": "2026-03-17T10:05:00.000Z"
    },
    {
      "type": "DEPOSIT",
      "amount": 500,
      "multiplier": 1,
      "required": 500,
      "completed": 0,
      "remaining": 500,
      "createdAt": "2026-03-18T10:00:00.000Z",
      "lastCalcAt": "2026-03-18T10:00:00.000Z"
    }
  ]
}
```

### Clear User Turnover (Admin)

```
POST /admin/turnover/clear
```

**Body:**

```json
{
  "userId": 123456,
  "reason": "Customer service resolution"
}
```

**Response:**

```json
{
  "status": "success",
  "cleared": true,
  "userId": 123456
}
```

### Add Turnover to User (Admin)

```
POST /admin/turnover/add
```

**Body:**

```json
{
  "userId": 123456,
  "amount": 1000,
  "type": "ADMIN_BONUS",
  "sourceRef": "PROMO123"
}
```

**Response:**

```json
{
  "status": "success",
  "batchId": "...",
  "type": "ADMIN_BONUS",
  "amount": 1000,
  "multiplier": 1,
  "required": 1000,
  "totalTurnover": 2000
}
```

---

## 11. Turnover System Overview

### How Turnover Works

The turnover-based withdrawable system:

1. **User Deposits** → Adds to `turnover_requirement` (amount × multiplier)
2. **VIP Bonuses** → Adds to `turnover_requirement` (bonus × multiplier)
3. **Bet Records** → Reduces `turnover_requirement` (based on bet amount)
4. **Withdrawal** → Only allowed when `turnover_requirement == 0`

### Bonus Wager Requirements (1x Multiplier)

| Bonus Type          | Amount | Wager Required | Description |
| ------------------- | ------ | --------------- | ----------- |
| Signup Bonus        | ₹26    | ₹26             | One-time bonus on registration |
| First Deposit Bonus | ₹20-₹7500 | Bonus Amount | Milestone-based bonus on first deposit |

**Formula:** `Wager Required = Bonus Amount × Multiplier` (default: 1x)

**Examples:**
- Signup ₹26 bonus → Bet ₹26 to unlock
- First deposit ₹500 → Bonus ₹100 → Bet ₹100 to unlock
- First deposit ₹1000 → Bonus ₹250 → Bet ₹250 to unlock

### Batch-Based Calculation

Each deposit/bonus creates a separate batch with its own timestamp:

- Only bets settled AFTER the batch's `createdAt` are counted for that batch
- Old bets before deposit are NOT counted for new turnover
- Each batch tracks its own completion status via `lastCalcAt`

### Key Concepts

| Term                     | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| turnover_requirement     | **Remaining amount** user must bet before withdrawal (absolute value) |
| turnover_progress        | **Percentage complete** (0-100%) - how much of turnover user has done |
| total_turnover_completed | Total turnover ever completed (cumulative)                            |
| turnover_batches         | Individual deposit/bonus entries tracking progress                    |
| batch.createdAt          | Timestamp when batch was created (only bets AFTER this count)         |
| batch.lastCalcAt         | Last time this batch was processed                                    |
| multiplier               | Configurable per transaction type (default: 1x)                       |
| canWithdraw              | true only when turnover_requirement = 0                               |

### Scheduler Configuration

| Environment Variable      | Default | Description                          |
| ------------------------- | ------- | ------------------------------------ |
| BET_SYNC_INTERVAL_MINUTES | 1       | How often to sync bets from provider |
| TURNOVER_INTERVAL_MINUTES | 1       | How often to calculate turnover      |

Set to 10 minutes for production:

```
BET_SYNC_INTERVAL_MINUTES=10
TURNOVER_INTERVAL_MINUTES=10
```

### Example Scenario

| Action             | Time  | Batch                     | Bet Considered?     |
| ------------------ | ----- | ------------------------- | ------------------- |
| User bets 200      | 10:00 | Old batch                 | NO                  |
| User deposits 1000 | 10:30 | New batch (1000 required) | -                   |
| User bets 500      | 10:35 | New batch                 | YES (counts)        |
| User bets 500      | 10:40 | New batch                 | YES (counts, done!) |

### Account Fields

```json
{
  "balance": 1000.0,
  "withdrawable": 0,
  "turnover_requirement": 500,
  "total_turnover_completed": 1500,
  "turnover_batches": [...],
  "lastTurnoverCalcAt": "2026-03-17T10:00:00.000Z"
}
```

### Admin Actions

1. **Set multipliers** via `/admin/turnover-config`
2. **View status** via `/admin/turnover-status`
3. **Clear turnover** via `/admin/turnover/clear` (for customer support)
4. **Add turnover** via `/admin/turnover/add` (for promotions)

---

## Common Error Responses

### 403 Forbidden

```json
{
  "status": "failed",
  "msg": "Admins only"
}
```

### 400 Bad Request

```json
{
  "status": "failed",
  "msg": "Invalid parameters"
}
```

### 500 Internal Server Error

```json
{
  "status": "failed",
  "msg": "Error message here"
}
```
