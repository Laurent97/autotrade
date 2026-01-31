import React from 'react';

// Metric items for the stats bar
const METRIC_ITEMS = [
  { key: 'totalOrders', label: 'Total Orders', color: 'blue' },
  { key: 'walletBalance', label: 'Available Balance', color: 'green', isCurrency: true },
  { key: 'commissionRate', label: 'Commission Rate', color: 'purple', isPercentage: true },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', color: 'amber', isCurrency: true },
  { key: 'storeRating', label: 'Store Rating', color: 'orange', isFixed: 1 },
  { key: 'activeProducts', label: 'Active Products', color: 'teal' }
];

interface StatsGridProps {
  stats: {
    totalOrders: number;
    walletBalance: number;
    commissionRate: number;
    monthlyRevenue: number;
    storeRating: number;
    activeProducts: number;
    conversionRate?: number; // Optional for future use
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400',
    orange: 'text-orange-600 dark:text-orange-400',
    teal: 'text-teal-600 dark:text-teal-400'
  };

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {METRIC_ITEMS.map((item) => {
            const value = stats[item.key as keyof typeof stats];
            let displayValue;
            
            if (item.isCurrency) {
              displayValue = `$${(value as number).toLocaleString()}`;
            } else if (item.isPercentage) {
              displayValue = `${(value as number).toFixed(1)}%`;
            } else if (item.isFixed) {
              displayValue = (value as number).toFixed(item.isFixed);
            } else {
              displayValue = value.toString();
            }

            return (
              <div key={item.key} className="text-center">
                <div className={`text-2xl font-bold ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                  {displayValue}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
