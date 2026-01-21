import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { partnerService } from '@/lib/supabase/partner-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, Info } from 'lucide-react';

const PartnerRegister = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    country: '',
    city: '',
    taxId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to register as a partner');
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to register as a partner.',
        variant: 'destructive',
      });
      navigate('/auth?redirect=/partner/register');
      return;
    }

    // Validation
    if (!formData.storeName.trim()) {
      setError('Store name is required');
      return;
    }

    if (!formData.storeSlug.trim()) {
      setError('Store URL is required');
      return;
    }

    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    setLoading(true);

    try {
      // Format store slug
      const formattedSlug = formData.storeSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { error: registrationError } = await partnerService.register({
        user_id: user.id,
        store_name: formData.storeName.trim(),
        store_slug: formattedSlug,
        description: formData.description.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        tax_id: formData.taxId.trim(),
      });

      if (registrationError) {
        throw registrationError;
      }

      toast({
        title: 'Application submitted!',
        description: 'Your partner application is pending approval. We will review it within 48 hours.',
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/partner/pending');
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);

      // User-friendly error messages
      let errorMessage = err.message || 'Registration failed. Please try again.';

      if (errorMessage.includes('foreign key')) {
        errorMessage = 'Account sync failed. Please try logging out and back in.';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'You are already registered as a partner.';
      } else if (errorMessage.includes('URL is already taken')) {
        errorMessage = 'Store URL is already taken. Please choose a different one.';
      }

      setError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate store slug from store name
  const handleStoreNameChange = (value: string) => {
    setFormData({
      ...formData,
      storeName: value,
      storeSlug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container-wide max-w-3xl px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Become a Partner
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Sell cars and parts through our drop-shipping platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Partner Application</CardTitle>
                  <CardDescription>
                    Fill out the form below to apply as a drop-shipping partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Store Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Store Information</h3>

                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name *</Label>
                        <Input
                          id="storeName"
                          type="text"
                          required
                          placeholder="My Auto Store"
                          value={formData.storeName}
                          onChange={(e) => handleStoreNameChange(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeSlug">Store URL Slug *</Label>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            store.yoursite.com/
                          </span>
                          <Input
                            id="storeSlug"
                            type="text"
                            required
                            placeholder="my-auto-store"
                            value={formData.storeSlug}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase();
                              // Allow only lowercase letters, numbers, and hyphens
                              const cleaned = value.replace(/[^a-z0-9-]/g, '');
                              setFormData({
                                ...formData,
                                storeSlug: cleaned,
                              });
                            }}
                            title="Lowercase letters, numbers, and hyphens only"
                            className="flex-1 min-w-0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Letters, numbers, and hyphens only. No spaces or special characters.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Store Description</Label>
                        <textarea
                          id="description"
                          className="w-full min-h-[100px] p-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow resize-none"
                          placeholder="Tell us about your store..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Contact Information</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Contact Email *</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            required
                            placeholder="contact@example.com"
                            value={formData.contactEmail}
                            onChange={(e) =>
                              setFormData({ ...formData, contactEmail: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={formData.contactPhone}
                            onChange={(e) =>
                              setFormData({ ...formData, contactPhone: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            type="text"
                            placeholder="United States"
                            value={formData.country}
                            onChange={(e) =>
                              setFormData({ ...formData, country: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="New York"
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                        <Input
                          id="taxId"
                          type="text"
                          placeholder="Optional"
                          value={formData.taxId}
                          onChange={(e) =>
                            setFormData({ ...formData, taxId: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Partner Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">Submit Application</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Fill out the form and submit your partner application
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">Review Process</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Our team reviews and approves within 48 hours
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">Access Dashboard</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Select products from our catalog to sell
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium">Start Selling</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Set your own prices and start earning
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        We handle shipping and logistics. You get paid when customers receive
                        their orders.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PartnerRegister;
