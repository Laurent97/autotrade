import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface StoreVisitsChartProps {
  data: Array<{
    visit_date: string;
    visits: number;
  }>;
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y' | 'all') => void;
  title?: string;
  description?: string;
  days?: number;
}

export default function StoreVisitsChart({
  data,
  timeRange,
  onTimeRangeChange,
  title = "Store Visits Trend",
  description = "Daily visitor engagement over last 14 days",
  days = 14
}: StoreVisitsChartProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data && data.length > 0 ? (
            <div className="flex items-end justify-between h-full gap-3">
              {data.slice(-days).map((day, index) => {
                const maxVisits = Math.max(...data.slice(-days).map(d => d.visits || 0));
                const height = maxVisits > 0 ? (day.visits / maxVisits) * 100 : 2;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <div className="text-xs font-medium mb-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatNumber(day.visits)}
                      </div>
                      <div 
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">
                      {new Date(day.visit_date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p>No visit data available</p>
                <p className="text-sm">Enable visit tracking to see visitor trends</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-lg font-bold text-blue-600">
              {data && data.length > 0 ? formatNumber(data[data.length - 1]?.visits || 0) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <p className="text-lg font-bold text-green-600">
              {data && data.length > 7 ? formatNumber(data.slice(-7).reduce((sum, d) => sum + d.visits, 0)) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <p className="text-lg font-bold text-purple-600">
              {data && data.length > 30 ? formatNumber(data.slice(-30).reduce((sum, d) => sum + d.visits, 0)) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
            <p className="text-lg font-bold text-amber-600">
              {data && data.length > 0 ? formatNumber(data.reduce((sum, d) => sum + d.visits, 0)) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">All Time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
