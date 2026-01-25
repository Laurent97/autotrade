import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Palette, Globe, Mail, Phone, MapPin, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardSettings() {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState({
    // Business Info
    storeName: '',
    businessType: '',
    storeCategory: '',
    storeTagline: '',
    storeDescription: '',
    yearEstablished: '',
    
    // Store Design
    storeLogo: null as File | null,
    storeLogoPreview: '',
    storeBanner: null as File | null,
    storeBannerPreview: '',
    brandColor: '#3B82F6',
    accentColor: '#8B5CF6',
    
    // Contact Details
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedIn: '',
    
    // Location & Operations
    country: '',
    city: '',
    timezone: '',
    businessHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '09:00', close: '17:00' },
    },
    
    // Legacy fields
    taxId: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userProfile]);

  const loadSettings = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await partnerService.getPartnerSettings(userProfile.id);
      if (error) {
        // If partner profile doesn't exist, just show empty form (don't show error)
        if (!error.includes('Partner profile not found')) {
          throw error;
        }
        // For missing profile, just continue with empty settings
      }
      
      if (data) {
        setSettings({
          storeName: data.store_name || '',
          businessType: data.business_type || '',
          storeCategory: data.store_category || '',
          storeTagline: data.store_tagline || '',
          storeDescription: data.store_description || data.description || '',
          yearEstablished: data.year_established || '',
          storeLogo: null,
          storeLogoPreview: data.logo_url || '',
          storeBanner: null,
          storeBannerPreview: data.banner_url || '',
          brandColor: data.brand_color || '#3B82F6',
          accentColor: data.accent_color || '#8B5CF6',
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          website: data.website || '',
          socialFacebook: data.social_facebook || '',
          socialInstagram: data.social_instagram || '',
          socialLinkedIn: data.social_linkedin || '',
          country: data.country || '',
          city: data.city || '',
          timezone: data.timezone || '',
          businessHours: data.business_hours || {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { open: '09:00', close: '17:00' },
            sunday: { open: '09:00', close: '17:00' },
          },
          taxId: data.tax_id || '',
        });
      }
      // If no data, keep default empty values
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!userProfile?.id) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `partner-assets/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('partner-assets')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(filePath);
      
      if (type === 'logo') {
        setSettings(prev => ({ ...prev, storeLogo: file, storeLogoPreview: publicUrl }));
      } else {
        setSettings(prev => ({ ...prev, storeBanner: file, storeBannerPreview: publicUrl }));
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError('Failed to upload file');
    }
  };

  const handleSave = async () => {
    if (!userProfile?.id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Upload files if they exist
      if (settings.storeLogo) {
        await handleFileUpload(settings.storeLogo, 'logo');
      }
      if (settings.storeBanner) {
        await handleFileUpload(settings.storeBanner, 'banner');
      }
      
      const { error } = await partnerService.updatePartnerSettings(userProfile.id, {
        store_name: settings.storeName,
        business_type: settings.businessType,
        store_category: settings.storeCategory,
        store_tagline: settings.storeTagline,
        store_description: settings.storeDescription,
        year_established: settings.yearEstablished,
        logo_url: settings.storeLogoPreview,
        banner_url: settings.storeBannerPreview,
        brand_color: settings.brandColor,
        accent_color: settings.accentColor,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        website: settings.website,
        social_facebook: settings.socialFacebook,
        social_instagram: settings.socialInstagram,
        social_linkedin: settings.socialLinkedIn,
        country: settings.country,
        city: settings.city,
        timezone: settings.timezone,
        business_hours: settings.businessHours,
        tax_id: settings.taxId,
      });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Store Settings</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {!error && !settings.storeName && !loading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">👋 Welcome to your store settings!</p>
            <p className="text-sm">Fill in your store information below to get started. This will create your partner profile.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  placeholder="Your store name"
                />
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={settings.businessType} onValueChange={(value) => setSettings(prev => ({ ...prev, businessType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Seller</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="storeCategory">Store Category</Label>
                <Select value={settings.storeCategory} onValueChange={(value) => setSettings(prev => ({ ...prev, storeCategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium_auto">Premium Auto Parts</SelectItem>
                    <SelectItem value="performance">Performance Parts</SelectItem>
                    <SelectItem value="accessories">Car Accessories</SelectItem>
                    <SelectItem value="tools">Tools & Equipment</SelectItem>
                    <SelectItem value="care">Car Care Products</SelectItem>
                    <SelectItem value="electronics">Car Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="storeTagline">Store Tagline</Label>
                <Input
                  id="storeTagline"
                  name="storeTagline"
                  value={settings.storeTagline}
                  onChange={handleChange}
                  placeholder="e.g., Premium Auto Parts Since 2010"
                  maxLength={60}
                />
              </div>

              <div>
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  name="storeDescription"
                  value={settings.storeDescription}
                  onChange={handleChange}
                  placeholder="Describe your store, your expertise, and what makes you unique..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="yearEstablished">Year Established</Label>
                <Select value={settings.yearEstablished} onValueChange={(value) => setSettings(prev => ({ ...prev, yearEstablished: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Store Design */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div>
                <Label>Store Logo</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {settings.storeLogoPreview ? (
                    <div className="relative">
                      <img
                        src={settings.storeLogoPreview}
                        alt="Store logo"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => setSettings(prev => ({ ...prev, storeLogoPreview: '', storeLogo: null }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload logo</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setSettings(prev => ({ ...prev, storeLogoPreview: e.target?.result as string, storeLogo: file }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <Label>Store Banner</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {settings.storeBannerPreview ? (
                    <div className="relative">
                      <img
                        src={settings.storeBannerPreview}
                        alt="Store banner"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSettings(prev => ({ ...prev, storeBannerPreview: '', storeBanner: null }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload banner</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setSettings(prev => ({ ...prev, storeBannerPreview: e.target?.result as string, storeBanner: file }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => document.getElementById('banner-upload')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Scheme */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brandColor">Brand Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="brandColor"
                      value={settings.brandColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <Input
                      value={settings.brandColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#8B5CF6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={settings.contactPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={settings.website}
                    onChange={handleChange}
                    placeholder="https://yourstore.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Social Media Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="socialFacebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="socialFacebook"
                      name="socialFacebook"
                      value={settings.socialFacebook}
                      onChange={handleChange}
                      placeholder="facebook.com/yourstore"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="socialInstagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="socialInstagram"
                      name="socialInstagram"
                      value={settings.socialInstagram}
                      onChange={handleChange}
                      placeholder="instagram.com/yourstore"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="socialLinkedIn">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="socialLinkedIn"
                      name="socialLinkedIn"
                      value={settings.socialLinkedIn}
                      onChange={handleChange}
                      placeholder="linkedin.com/company/yourstore"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location & Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="country"
                    name="country"
                    value={settings.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="city">City *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="city"
                    name="city"
                    value={settings.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                name="taxId"
                value={settings.taxId}
                onChange={handleChange}
                placeholder="Your tax identification number"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Required for invoice generation and tax compliance</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {saved && (
            <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
              ✓ Settings saved successfully
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {saving ? 'Saving...' : (settings.storeName ? 'Save Settings' : 'Create Partner Profile')}
          </Button>
        </div>
      </div>
    </div>
  );
}
