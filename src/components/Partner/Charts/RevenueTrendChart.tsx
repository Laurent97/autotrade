import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp } from 'lucide-react';

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    revenue: number;
    profit: number;
    orders: number;
  }>;
  chartType: 'profit' | 'revenue' | 'orders';
  onChartTypeChange: (type: 'profit' | 'revenue' | 'orders') => void;
  title?: string;
  description?: string;
  days?: number;
}

export default function RevenueTrendChart({
  data,
  chartType,
  onChartTypeChange,
  title = "Revenue Trend",
  description = "Daily revenue over last 14 days",
  days = 14
}: RevenueTrendChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'profit':
        return 'from-green-500 to-emerald-400';
      case 'revenue':
        return 'from-blue-500 to-cyan-400';
      case 'orders':
        return 'from-purple-500 to-violet-400';
      default:
        return 'from-gray-500 to-gray-400';
    }
  };

  const getDisplayValue = (day: any, type: string) => {
    const value = type === 'profit' ? day.profit : 
                  type === 'revenue' ? day.revenue : day.orders;
    
    if (type === 'orders') {
      return `${value} orders`;
    }
    return formatCurrency(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data && data.length > 0 ? (
            <div className="flex items-end justify-between h-full gap-2">
              {data.slice(-days).map((day, index) => {
                const maxValue = Math.max(
                  ...data.slice(-days).map(d => 
                    chartType === 'profit' ? d.profit : 
                    chartType === 'revenue' ? d.revenue : d.orders
                  )
                );
                const value = chartType === 'profit' ? day.profit : 
                             chartType === 'revenue' ? day.revenue : day.orders;
                const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 2;
                const color = getColorClass(chartType);
                
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="w-full flex flex-col items-center">
                            <div className="text-xs font-medium mb-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {getDisplayValue(day, chartType)}
                            </div>
                            <div 
                              className={`w-full rounded-t-lg bg-gradient-to-t ${color} hover:opacity-90 transition-all duration-300`}
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground mt-2">
                            {new Date(day.date).getDate()}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{new Date(day.date).toLocaleDateString()}</p>
                        <p>Revenue: {formatCurrency(day.revenue)}</p>
                        <p>Profit: {formatCurrency(day.profit)}</p>
                        <p>Orders: {day.orders}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p>No revenue data available</p>
                <p className="text-sm">Complete orders to see revenue trends</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
