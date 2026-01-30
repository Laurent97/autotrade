import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, MapPin, CheckCircle, Clock, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { TrackingWithUpdates } from '@/lib/types/tracking';
import { TRACKING_STATUSES } from '@/lib/types/tracking';
import { toast } from 'sonner';

interface OrderTrackingBadgeProps {
  tracking: TrackingWithUpdates | null;
  orderId: string;
  orderData?: any; // Add orderData prop for fallback
  compact?: boolean; // Add compact prop for grid view
}

export default function OrderTrackingBadge({ tracking, orderId, orderData, compact = false }: OrderTrackingBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Check for shipping info in orderData as fallback
  const hasOrderShipping = orderData?.shipping_tracking_number || orderData?.shipping_provider;
  
  // Use tracking data first, then fall back to order shipping info
  const trackingNumber = tracking?.tracking_number || orderData?.shipping_tracking_number;
  const provider = tracking?.carrier || orderData?.shipping_provider;
  const status = tracking?.status || orderData?.shipping_status;

  const copyTrackingNumber = async (trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      toast.success('Tracking number copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy tracking number');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TRACKING_STATUSES[status as keyof typeof TRACKING_STATUSES];
    if (!statusConfig) {
      return <Badge variant="secondary">{status}</Badge>;
    }

    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colorMap[statusConfig.color as keyof typeof colorMap]}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-3 h-3" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-3 h-3" />;
      default:
        return <Package className="w-3 h-3" />;
    }
  };

  if (!trackingNumber && !hasOrderShipping) {
    return (
      <Badge variant="outline" className="text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        No Tracking
      </Badge>
    );
  }

  // Compact mode for grid view
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {trackingNumber && (
          <Badge variant="outline" className="text-xs font-mono">
            {trackingNumber}
          </Badge>
        )}
        
        {(provider || status) && (
          <div className="flex items-center gap-2">
            {status && (
              <Badge className={`text-xs ${getStatusBadge(status).props.className}`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  {status}
                </span>
              </Badge>
            )}
            {provider && (
              <span className="text-xs text-muted-foreground">
                via {provider}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {status && getStatusBadge(status)}
        {trackingNumber && (
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Truck className="w-3 h-3 mr-1" />
                View Tracking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Tracking Details - {trackingNumber}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Tracking Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shipment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-semibold">{trackingNumber}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTrackingNumber(trackingNumber!)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                        <p className="font-semibold">{provider || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Shipping Method</p>
                        <p className="font-semibold capitalize">{tracking?.shipping_method || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                        {status && getStatusBadge(status)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                        <p className="font-semibold">
                          {tracking?.estimated_delivery 
                            ? format(new Date(tracking.estimated_delivery), 'MMM dd, yyyy')
                            : 'Not set'
                          }
                        </p>
                      </div>
                      {tracking?.actual_delivery && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Actual Delivery</p>
                          <p className="font-semibold">
                            {format(new Date(tracking.actual_delivery), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Tracking History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tracking?.updates?.map((update, index) => (
                        <div key={update.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {update.status === 'delivered' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Truck className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            {index < (tracking?.updates?.length || 0) - 1 && (
                              <div className="w-0.5 h-16 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{update.status}</h4>
                              {update.location && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {update.location}
                                </span>
                              )}
                            </div>
                            {update.description && (
                              <p className="text-sm text-muted-foreground mb-1">{update.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(update.timestamp), 'MMM dd, yyyy at h:mm a')}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tracking updates available yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => copyTrackingNumber(trackingNumber!)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Tracking
                  </Button>
                  <Button
                    onClick={() => {
                      const url = `/track?number=${trackingNumber}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Track Package
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
