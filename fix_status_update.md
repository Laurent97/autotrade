# Fix Order Status Update Issue

## Problem
When admin updates shipping information, the order status is always set to "shipped" regardless of what status is selected in the form.

## Solution
In `src/pages/admin/Orders.tsx`, around line 819, change:

```typescript
status: 'shipped',
```

To:

```typescript
status: logisticsForm.current_status || 'shipped',
```

## Location
File: `src/pages/admin/Orders.tsx`
Function: `saveLogisticsInfo`
Around line 819

## What This Fixes
- Order status will now reflect the actual status selected in the logistics form
- If admin selects "Picked Up", the order will show "Picked Up" instead of "Shipped"
- If no status is selected, it will default to "Shipped"
