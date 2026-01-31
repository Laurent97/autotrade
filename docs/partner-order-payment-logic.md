# Partner Order Payment Logic Specification

## Overview

This document outlines the payment logic for partner orders in the AutoTradeHub system, ensuring proper financial flow between partners, customers, and the platform.

## Business Logic

### Core Principle
When an admin assigns an order to a partner using inventory from that partner's catalog, the partner pays the **base cost price** of the product, not the retail selling price.

### Payment Flow

#### 1. Order Assignment (Partner Pays Platform)
- **Trigger**: Admin assigns order to partner
- **Payment Amount**: Product base cost price
- **Direction**: Partner → Platform
- **Timing**: At order assignment

#### 2. Order Completion (Platform Pays Partner)
- **Trigger**: Order marked as completed/delivered
- **Payment Amount**: Full selling price (base price + partner markup)
- **Direction**: Platform → Partner
- **Timing**: After successful delivery

#### 3. Customer Payment
- **Trigger**: Order placement
- **Payment Amount**: Full selling price
- **Direction**: Customer → Platform
- **Timing**: At order placement

## Financial Example

### Scenario
- **Base Cost Price**: $100
- **Partner Markup**: 20%
- **Selling Price**: $120

### Transaction Flow

| Step | Action | Amount | Direction |
|------|--------|--------|-----------|
| 1 | Customer places order | $120 | Customer → Platform |
| 2 | Admin assigns order to partner | $100 | Partner → Platform |
| 3 | Order completed & delivered | $120 | Platform → Partner |
| 4 | Partner profit retained | $20 | Partner (retained) |

### Net Result
- **Platform**: Receives $120, pays $100, keeps $20 (platform fee)
- **Partner**: Pays $100, receives $120, retains $20 (profit)
- **Customer**: Pays $120 (selling price)

## Implementation Requirements

### Database Schema Updates

#### Partner Products Table
```sql
ALTER TABLE partner_products ADD COLUMN base_cost_price DECIMAL(10,2) NOT NULL;
ALTER TABLE partner_products ADD COLUMN selling_price DECIMAL(10,2) NOT NULL;
ALTER TABLE partner_products ADD COLUMN markup_percentage DECIMAL(5,2) DEFAULT 0;
```

#### Orders Table
```sql
ALTER TABLE orders ADD COLUMN base_cost_total DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN partner_payment_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN partner_payout_amount DECIMAL(10,2);
```

#### Partner Transactions Table
```sql
CREATE TABLE partner_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id),
  order_id UUID REFERENCES orders(id),
  transaction_type ENUM('payment', 'payout', 'refund'),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  notes TEXT
);
```

### Business Logic Implementation

#### Order Assignment Process
```typescript
async function assignOrderToPartner(orderId: string, partnerId: string) {
  // 1. Calculate base cost total
  const orderItems = await getOrderItems(orderId);
  let baseCostTotal = 0;
  
  for (const item of orderItems) {
    const product = await getPartnerProduct(item.product_id);
    baseCostTotal += product.base_cost_price * item.quantity;
  }
  
  // 2. Create partner payment transaction
  await createPartnerTransaction({
    partner_id: partnerId,
    order_id: orderId,
    transaction_type: 'payment',
    amount: baseCostTotal,
    status: 'pending'
  });
  
  // 3. Update order record
  await updateOrder(orderId, {
    partner_id: partnerId,
    base_cost_total: baseCostTotal,
    partner_payment_amount: baseCostTotal,
    status: 'assigned'
  });
  
  // 4. Process partner payment (deduct from wallet)
  await processPartnerPayment(partnerId, baseCostTotal, orderId);
}
```

#### Order Completion Process
```typescript
async function completePartnerOrder(orderId: string) {
  const order = await getOrder(orderId);
  
  // 1. Calculate partner payout (full selling price)
  const partnerPayoutAmount = order.total_amount;
  
  // 2. Create partner payout transaction
  await createPartnerTransaction({
    partner_id: order.partner_id,
    order_id: orderId,
    transaction_type: 'payout',
    amount: partnerPayoutAmount,
    status: 'pending'
  });
  
  // 3. Update order record
  await updateOrder(orderId, {
    partner_payout_amount: partnerPayoutAmount,
    status: 'completed'
  });
  
  // 4. Process partner payout (credit to wallet)
  await processPartnerPayout(order.partner_id, partnerPayoutAmount, orderId);
}
```

#### Partner Profit Calculation
```typescript
function calculatePartnerProfit(order: Order): number {
  return order.partner_payout_amount - order.partner_payment_amount;
}

function calculatePlatformFee(order: Order): number {
  return order.total_amount - order.partner_payout_amount;
}
```

## API Endpoints

### Order Assignment
```
POST /api/admin/orders/{orderId}/assign
{
  "partner_id": "uuid",
  "notes": "optional"
}
```

### Order Completion
```
POST /api/admin/orders/{orderId}/complete
{
  "delivery_confirmation": true,
  "notes": "optional"
}
```

### Partner Transaction History
```
GET /api/partner/transactions
Query Parameters:
- type: payment|payout|refund
- status: pending|completed|failed
- date_from: ISO date
- date_to: ISO date
```

## Financial Reporting

### Partner Profit Report
```sql
SELECT 
  p.store_name,
  COUNT(o.id) as total_orders,
  SUM(o.partner_payment_amount) as total_payments,
  SUM(o.partner_payout_amount) as total_payouts,
  SUM(o.partner_payout_amount - o.partner_payment_amount) as total_profit,
  AVG(o.partner_payout_amount - o.partner_payment_amount) as avg_profit_per_order
FROM orders o
JOIN partner_profiles p ON o.partner_id = p.id
WHERE o.status = 'completed'
  AND o.created_at BETWEEN ? AND ?
GROUP BY p.id, p.store_name;
```

### Platform Revenue Report
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  SUM(partner_payout_amount) as total_partner_payouts,
  SUM(total_amount - partner_payout_amount) as platform_revenue
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

## Edge Cases & Validation

### Validation Rules
1. Partner must have sufficient wallet balance for payment
2. Base cost price must be less than selling price
3. Markup percentage must be reasonable (0-50%)
4. Partner can only be assigned if product is in their inventory

### Error Handling
- Insufficient balance: Block assignment, notify partner
- Invalid pricing: Recalculate or block assignment
- Payment failure: Retry mechanism, admin notification
- Payout failure: Manual review, support ticket

### Refund Logic
- Customer refund: Platform refunds customer, deducts from partner's next payout
- Partner refund: Platform refunds partner's payment amount
- Partial refunds: Proportional calculation based on items

## Compliance & Audit

### Audit Trail
- All financial transactions logged with timestamps
- User action tracking for assignments and completions
- Payment gateway integration logs
- Wallet balance change history

### Compliance Requirements
- Financial records retention (7 years)
- Tax reporting documentation
- Anti-money laundering checks
- Dispute resolution procedures

## Testing Scenarios

### Test Cases
1. **Normal Flow**: Complete order assignment → completion → payout
2. **Insufficient Balance**: Partner lacks funds for assignment
3. **Multiple Items**: Order with products from different partners
4. **Partial Refund**: Customer cancels some items
5. **Price Changes**: Product prices updated between assignment and completion
6. **Partner Commission**: Different commission rates for different partners

### Performance Considerations
- Database indexing on transaction tables
- Batch processing for bulk payouts
- Caching for frequently accessed pricing data
- Queue system for payment processing

## Monitoring & Alerts

### Key Metrics
- Average order assignment time
- Payment success rate
- Payout processing time
- Partner profit margins
- Platform revenue per order

### Alert Conditions
- Payment failures > 5% in 24 hours
- Payout delays > 48 hours
- Unusual profit margin fluctuations
- High refund rates by partner

---

**Version**: 1.0  
**Last Updated**: 2026-01-31  
**Author**: AutoTradeHub Development Team  
**Status**: Ready for Implementation
