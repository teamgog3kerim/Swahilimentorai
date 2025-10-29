# Admin Payment Verification Guide

## Overview

The Binance Pay payment system uses **manual verification** to ensure payment security. When a user submits a payment, the subscription is created with "pending" status and requires admin approval before activating premium access.

## Payment Wallet Details

- **Network**: Tron (TRC20)
- **Currency**: USDT
- **Wallet Address**: `TCdeZjG39zU9SjtoLwfXmcedJhnXyNd8zB`
- **Subscription Price**: 90 USDT/month

## Payment Flow

1. **User scans QR code** and sends 90 USDT via Binance Pay (TRC20 network)
2. **User submits transaction ID** through the app's subscription page
3. **System creates pending subscription** with status="pending"
4. **Admin verifies payment** (manual process - see below)
5. **Admin activates subscription** by updating database records

## How to Verify Payments

### Step 1: Check Pending Subscriptions

Connect to your PostgreSQL database and run:

```sql
SELECT 
  s.id,
  s."transactionId",
  s.amount,
  s.currency,
  s.status,
  s."createdAt",
  u.username,
  u.email,
  u."isPremium"
FROM subscriptions s
JOIN users u ON s."userId" = u.id
WHERE s.status = 'pending'
ORDER BY s."createdAt" DESC;
```

### Step 2: Verify Transaction on Blockchain

1. Go to [Tronscan](https://tronscan.org/)
2. Search for the transaction ID from the query above
3. Verify:
   - Transaction amount is 90 USDT
   - Destination address is: `TCdeZjG39zU9SjtoLwfXmcedJhnXyNd8zB`
   - Transaction status is "Success"
   - Transaction is on TRC20 network

### Step 3: Activate Subscription

Once verified, run these SQL commands (replace `<subscription_id>` and `<user_id>` with actual values):

```sql
-- Begin transaction
BEGIN;

-- Update subscription status to active
UPDATE subscriptions 
SET status = 'active'
WHERE id = '<subscription_id>';

-- Update user premium status
UPDATE users 
SET 
  "isPremium" = true,
  "subscriptionEndsAt" = (
    SELECT "endDate" 
    FROM subscriptions 
    WHERE id = '<subscription_id>'
  )
WHERE id = '<user_id>';

-- Commit transaction
COMMIT;
```

### Step 4: Verify Activation

Check that the user now has premium access:

```sql
SELECT 
  username,
  email,
  "isPremium",
  "subscriptionEndsAt"
FROM users
WHERE id = '<user_id>';
```

## Rejecting Fraudulent Payments

If a payment is fraudulent or cannot be verified:

```sql
-- Update subscription status to rejected
UPDATE subscriptions 
SET status = 'rejected'
WHERE id = '<subscription_id>';
```

The user will need to contact support or submit a new payment.

## Security Features

The system includes several security measures:

1. **Pending-only creation**: Subscriptions start as "pending", not "active"
2. **No auto-activation**: User premium status is NOT updated until admin approval
3. **Duplicate prevention**: Same transaction ID cannot be submitted twice
4. **Active subscription check**: Users with active subscriptions cannot resubmit
5. **Transaction ID validation**: Minimum 10 characters required

## Common Issues

### Issue: User submitted wrong transaction ID

**Solution**: Contact user for correct transaction ID, then update:

```sql
UPDATE subscriptions 
SET "transactionId" = '<correct_transaction_id>'
WHERE id = '<subscription_id>';
```

### Issue: Transaction not found on blockchain

**Possible causes**:
- User entered wrong transaction ID
- Transaction is still pending (wait 5-10 minutes)
- User sent to wrong address
- User sent wrong amount

**Action**: Reject the subscription and contact user

## Future Enhancements

For production, consider:

1. **Admin dashboard**: Build a web interface for payment verification
2. **Automated verification**: Integrate Tron API to auto-verify transactions
3. **Email notifications**: Alert admins when new payments are submitted
4. **Rate limiting**: Prevent spam submissions
5. **Enhanced validation**: Enforce 64-character hex format for TRC20 transaction IDs
6. **Audit logging**: Track all payment status changes with timestamps

## Support

If you need help with payment verification, check:
- Tronscan blockchain explorer: https://tronscan.org/
- Binance Pay support: https://www.binance.com/en/support
- Database schema: See `shared/schema.ts` for table structures
