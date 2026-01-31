import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, DollarSign, Store, Star } from 'lucide-react';

interface PerformanceMetricsProps {
  metrics: {
    conversionRate: number;
    avgOrderValue: number;
    storeRating: number;
    commissionRate: number;
  };
  title?: string;
  description?: string;
}

export default function PerformanceMetrics({
  metrics,
  title = "Performance Metrics",
  description = "Key performance indicators"
}: PerformanceMetricsProps) {
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
          <Target className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Conversion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Conversion Rate</span>
              </div>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                {metrics.conversionRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.conversionRate} className="h-2" />
          </div>

          {/* Average Order Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm">Average Order Value</span>
              </div>
              <span className="font-semibold">{formatCurrency(metrics.avgOrderValue)}</span>
            </div>
            <Progress value={(metrics.avgOrderValue / 500) * 100} className="h-2" />
          </div>

          {/* Store Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Store Rating</span>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(metrics.storeRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 font-semibold">{metrics.storeRating.toFixed(1)}</span>
              </div>
            </div>
            <Progress value={(metrics.storeRating / 5) * 100} className="h-2" />
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Commission Rate</span>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600">
                {metrics.commissionRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.commissionRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
