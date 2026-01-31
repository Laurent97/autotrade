import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';

interface MonthlyEarningsChartProps {
  data: Array<{
    month: string;
    monthName: string;
    earnings: number;
    orderCount: number;
  }>;
  title?: string;
  description?: string;
  months?: number;
}

export default function MonthlyEarningsChart({
  data,
  title = "Monthly Earnings",
  description = "Monthly earnings overview",
  months = 12
}: MonthlyEarningsChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data && data.length > 0 ? (
            <div className="flex items-end justify-between h-full gap-3">
              {data.slice(-months).map((month, index) => {
                const maxEarning = Math.max(...data.slice(-months).map(m => m.earnings || 0));
                const height = maxEarning > 0 ? ((month.earnings || 0) / maxEarning) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                    <div className="w-full flex flex-col items-center">
                      <div className="text-xs font-medium mb-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatCurrency(month.earnings || 0)}
                      </div>
                      <div 
                        className="w-full rounded-t-lg bg-gradient-to-t from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 transition-all duration-300 relative group"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {month.monthName || 'Unknown'}: {formatCurrency(month.earnings || 0)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">
                      {month.monthName ? month.monthName.split(' ')[0] : 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p>No earnings data available</p>
                <p className="text-sm">Start earning to see your growth chart</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3">
            <div className="text-lg font-bold text-green-600">
              {data && data.length > 0 ? formatCurrency(data.reduce((sum, m) => sum + (m.earnings || 0), 0)) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
          <div className="text-center p-3">
            <div className="text-lg font-bold text-blue-600">
              {data && data.length > 0 ? formatCurrency(data.reduce((sum, m) => sum + (m.earnings || 0), 0) / data.length) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">Monthly Average</p>
          </div>
          <div className="text-center p-3">
            <div className="text-lg font-bold text-purple-600">
              {data && data.length > 0 ? formatCurrency(Math.max(...data.map(m => m.earnings || 0))) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">Best Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
