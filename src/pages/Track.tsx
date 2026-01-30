import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Search, MapPin, Zap, CheckCircle, Package, Truck, Clock, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { publicTrackingAPI } from '@/services/tracking-api';
import { TRACKING_STATUSES } from '@/lib/types/tracking';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Track() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('number') || '');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (trackingNumber) {
      handleTrack();
    }
  }, []);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const result = await publicTrackingAPI.getTracking(trackingNumber.trim());
      
      if (result.success && result.data) {
        setTrackingData(result.data);
      } else {
        setTrackingData(null);
        toast.error(result.error || 'Tracking number not found');
      }
    } catch (error) {
      setTrackingData(null);
      toast.error('Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingNumber = async () => {
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

  const getTrackingTimeline = (trackingData: any) => {
    const statusOrder = ['processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(trackingData.status);
    
    return statusOrder.map((status, index) => {
      const statusConfig = TRACKING_STATUSES[status as keyof typeof TRACKING_STATUSES];
      const isCompleted = index < currentStatusIndex;
      const isCurrent = index === currentStatusIndex;
      
      let timestamp = null;
      let description = statusConfig.label;
      let location = null;
      
      // Find actual update if available
      if (trackingData.updates) {
        const update = trackingData.updates.find((u: any) => u.status === status);
        if (update) {
          timestamp = update.timestamp;
          description = update.description || statusConfig.label;
          location = update.location;
        }
      }
      
      // Use created_at for first status if no update found
      if (!timestamp && index === 0) {
        timestamp = trackingData.created_at;
      }
      
      // Use actual_delivery for delivered status
      if (status === 'delivered' && trackingData.actual_delivery) {
        timestamp = trackingData.actual_delivery;
        description = 'Package delivered successfully';
      }
      
      // Generate estimated text for future milestones
      let estimatedText = null;
      if (!isCompleted && !isCurrent) {
        if (trackingData.estimated_delivery) {
          estimatedText = `Estimated by ${format(new Date(trackingData.estimated_delivery), 'MMMM dd, yyyy')}`;
        } else {
          estimatedText = 'Pending';
        }
      }
      
      return {
        status,
        label: statusConfig.label,
        description,
        location,
        timestamp,
        estimatedText,
        completed: isCompleted,
        current: isCurrent
      };
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-gradient-accent rounded-b-2xl text-white pt-12 pb-8 px-4">
          <div className="container-wide max-w-4xl mx-auto">
            <a href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </a>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Track Your Order</h1>
            <p className="text-white/90">Real-time delivery updates</p>
          </div>
        </div>

        <div className="container-wide max-w-4xl mx-auto py-12 px-4">
          {/* Search */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter tracking number (e.g., TRK-123456789)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="pl-12"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </div>
                <Button 
                  onClick={handleTrack}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Package className="w-4 h-4 mr-2 animate-pulse" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {searched && (
            <>
              {trackingData ? (
                <div className="space-y-6">
                  {/* Order Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Order #{trackingData.order_id}
                        </span>
                        {getStatusBadge(trackingData.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-semibold">{trackingData.tracking_number}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyTrackingNumber}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                            <p className="font-semibold">{trackingData.carrier || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Shipping Method</p>
                            <p className="font-semibold capitalize">{trackingData.shipping_method || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                            <p className="font-semibold">
                              {trackingData.estimated_delivery 
                                ? format(new Date(trackingData.estimated_delivery), 'EEEE, MMMM dd, yyyy')
                                : 'Not set'
                              }
                            </p>
                          </div>
                          {trackingData.actual_delivery && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Actual Delivery</p>
                              <p className="font-semibold text-green-600">
                                {format(new Date(trackingData.actual_delivery), 'EEEE, MMMM dd, yyyy')}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Shipped Date</p>
                            <p className="font-semibold">
                              {format(new Date(trackingData.created_at), 'EEEE, MMMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Tracking History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Show automatic tracking milestones based on current status */}
                        {getTrackingTimeline(trackingData).map((milestone, index) => (
                          <div key={milestone.status} className="flex gap-6">
                            <div className="flex flex-col items-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                milestone.completed 
                                  ? 'bg-green-100 text-green-600' 
                                  : milestone.current 
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {milestone.completed ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : milestone.current ? (
                                  <Truck className="w-6 h-6" />
                                ) : (
                                  <Clock className="w-6 h-6" />
                                )}
                              </div>
                              {index < getTrackingTimeline(trackingData).length - 1 && (
                                <div className={`w-0.5 h-16 ${
                                  milestone.completed ? 'bg-green-200' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                            <div className="pb-6 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-bold text-lg ${
                                  milestone.completed ? 'text-green-600' : 
                                  milestone.current ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                  {milestone.label}
                                </h4>
                                {milestone.location && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {milestone.location}
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2">{milestone.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {milestone.timestamp 
                                  ? format(new Date(milestone.timestamp), 'MMMM dd, yyyy at h:mm a')
                                  : milestone.estimatedText
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Show actual tracking updates if they exist */}
                        {trackingData.updates && trackingData.updates.length > 0 && (
                          <>
                            <Separator className="my-6" />
                            <h4 className="font-semibold text-lg mb-4">Detailed Updates</h4>
                            {trackingData.updates.map((update: any, index: number) => (
                              <div key={update.id} className="flex gap-6">
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  {index < (trackingData.updates?.length || 0) - 1 && (
                                    <div className="w-0.5 h-12 bg-border" />
                                  )}
                                </div>
                                <div className="pb-4 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-semibold">{update.status}</h5>
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
                                    {format(new Date(update.timestamp), 'MMMM dd, yyyy at h:mm a')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={copyTrackingNumber}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Tracking Number
                    </Button>
                    <Button
                      onClick={() => {
                        const url = `${window.location.origin}/track?number=${trackingData.tracking_number}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Tracking link copied to clipboard!');
                      }}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Copy Tracking Link
                    </Button>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Tracking Number Not Found</h3>
                    <p className="text-muted-foreground mb-6">
                      We couldn't find any tracking information for "{trackingNumber}"
                    </p>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <h4 className="font-semibold">Possible reasons:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• The tracking number might be incorrect</li>
                        <li>• The order hasn't been shipped yet</li>
                        <li>• The tracking system hasn't been updated</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Help Section */}
          {!searched && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">Where can I find my tracking number?</h3>
                  <p className="text-muted-foreground">
                    Your tracking number is in your shipping confirmation email. It usually starts with "TRK-" and can also be found in your account under "My Orders".
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Why can't I find my order?</h3>
                  <p className="text-muted-foreground">
                    It may take up to 24 hours for your order to appear in our tracking system. Please check your email for the tracking number.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">How often is tracking updated?</h3>
                  <p className="text-muted-foreground">
                    Tracking information updates in real-time as your package moves through our system and with the carrier.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support */}
          <Card className="bg-gradient-accent text-white">
            <CardContent className="text-center p-8">
              <h3 className="text-2xl font-bold mb-4">Need Tracking Help?</h3>
              <p className="mb-6">Can't find your order? Our support team can help locate it.</p>
              <a href="/contact">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Contact Support
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
