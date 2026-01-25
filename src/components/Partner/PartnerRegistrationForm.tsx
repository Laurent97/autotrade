import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Mail, Phone, MapPin, Gift, CheckCircle, AlertCircle, FileText, Globe,
  Upload, Image as ImageIcon, X, ChevronRight, ChevronLeft, Building, User,
  Shield, DollarSign, TrendingUp, Users, Award, Sparkles, Lock, Eye, EyeOff,
  Calendar, Clock, CreditCard, Package, Truck, Headphones, MessageSquare,
  FileCheck, Download, Search, Loader2, Camera, Palette, Layout, Wand2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import StoreIdBadge from '@/components/ui/StoreIdBadge';

// Wizard Steps
const WIZARD_STEPS = [
  { id: 1, title: 'Business Info', icon: Store, description: 'Basic store details' },
  { id: 2, title: 'Store Design', icon: Palette, description: 'Branding & visuals' },
  { id: 3, title: 'Contact Details', icon: User, description: 'Contact information' },
  { id: 4, title: 'Invitation Code', icon: Gift, description: 'Referral entry' },
  { id: 5, title: 'Review & Submit', icon: FileCheck, description: 'Final verification' }
];

// Business Types
const BUSINESS_TYPES = [
  { value: 'individual', label: 'Individual/Sole Proprietor', icon: User },
  { value: 'partnership', label: 'Partnership', icon: Users },
  { value: 'llc', label: 'LLC (Limited Liability Company)', icon: Building },
  { value: 'corporation', label: 'Corporation', icon: Building },
  { value: 'nonprofit', label: 'Non-Profit Organization', icon: Award }
];

// Store Categories
const STORE_CATEGORIES = [
  { value: 'premium_auto', label: 'Premium Auto Parts', color: 'dark:bg-blue-900/30 dark:text-blue-300 bg-blue-100 text-blue-800' },
  { value: 'performance', label: 'Performance Parts', color: 'dark:bg-red-900/30 dark:text-red-300 bg-red-100 text-red-800' },
  { value: 'accessories', label: 'Car Accessories', color: 'dark:bg-purple-900/30 dark:text-purple-300 bg-purple-100 text-purple-800' },
  { value: 'tools', label: 'Tools & Equipment', color: 'dark:bg-amber-900/30 dark:text-amber-300 bg-amber-100 text-amber-800' },
  { value: 'care', label: 'Car Care Products', color: 'dark:bg-emerald-900/30 dark:text-emerald-300 bg-emerald-100 text-emerald-800' },
  { value: 'electronics', label: 'Car Electronics', color: 'dark:bg-indigo-900/30 dark:text-indigo-300 bg-indigo-100 text-indigo-800' }
];

interface FormData {
  // Step 1: Business Info
  storeName: string;
  businessType: string;
  storeCategory: string;
  storeTagline: string;
  storeDescription: string;
  yearEstablished: string;
  
  // Step 2: Store Design
  storeLogo: File | null;
  storeLogoPreview: string;
  storeBanner: File | null;
  storeBannerPreview: string;
  brandColor: string;
  accentColor: string;
  
  // Step 3: Contact Details
  contactEmail: string;
  contactPhone: string;
  website: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedIn: string;
  
  // Step 4: Location & Operations
  country: string;
  city: string;
  timezone: string;
  businessHours: {
    monday: { open: string; close: string; };
    tuesday: { open: string; close: string; };
    wednesday: { open: string; close: string; };
    thursday: { open: string; close: string; };
    friday: { open: string; close: string; };
    saturday: { open: string; close: string; };
    sunday: { open: string; close: string; };
  };
  
  // Step 5: Invitation
  invitationCode: string;
  
  // Step 6: Terms
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToCommission: boolean;
  receiveUpdates: boolean;
}

const PartnerRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const fileInputBannerRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedStoreId, setGeneratedStoreId] = useState('');
  const [invitationValidation, setInvitationValidation] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState({ logo: 0, banner: 0 });
  const [uploadedFiles, setUploadedFiles] = useState<{ logo?: string; banner?: string }>({});
  
  const [formData, setFormData] = useState<FormData>({
    // Step 1
    storeName: '',
    businessType: '',
    storeCategory: '',
    storeTagline: '',
    storeDescription: '',
    yearEstablished: new Date().getFullYear().toString(),
    
    // Step 2
    storeLogo: null,
    storeLogoPreview: '',
    storeBanner: null,
    storeBannerPreview: '',
    brandColor: '#3B82F6', // Blue
    accentColor: '#10B981', // Green
    
    // Step 3
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedIn: '',
    
    // Step 4
    country: '',
    city: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    businessHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: { open: '', close: '' }
    },
    
    // Step 5
    invitationCode: '',
    
    // Step 6
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToCommission: false,
    receiveUpdates: true
  });

  // Validate invitation code
  useEffect(() => {
    const validateInvitationCode = async () => {
      if (!formData.invitationCode.trim() || formData.invitationCode.length < 5) {
        setInvitationValidation(null);
        return;
      }

      try {
        setInvitationValidation({ loading: true });
        
        const { data, error } = await supabase
          .from('partner_profiles')
          .select('store_id, store_name, store_logo, referral_bonus_active')
          .or(`store_id.eq.${formData.invitationCode},referral_code.eq.${formData.invitationCode},invitation_code.eq.${formData.invitationCode}`)
          .eq('partner_status', 'approved')
          .eq('is_active', true)
          .single();

        if (error || !data) {
          // Check for specific error codes to provide better messages
          if (error?.code === 'PGRST116') {
            setInvitationValidation({
              valid: false,
              error: 'Invitation code not found. Please check the code or contact support.'
            });
          } else if (error?.code === 'PGRST301') {
            setInvitationValidation({
              valid: false,
              error: 'Multiple codes found. Please contact support for assistance.'
            });
          } else {
            setInvitationValidation({
              valid: false,
              error: 'Invalid or inactive invitation code. Please check the code or contact your referrer.'
            });
          }
          return;
        }

        setInvitationValidation({
          valid: true,
          referrerName: data.store_name,
          referrerId: data.store_id,
          referrerLogo: data.store_logo,
          hasBonus: data.referral_bonus_active,
          benefits: ['Welcome bonus', 'Priority support', 'Lower commission for first 3 months']
        });
      } catch (err) {
        setInvitationValidation({
          valid: false,
          error: 'Error validating code'
        });
      }
    };

    const timeoutId = setTimeout(() => {
      validateInvitationCode();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.invitationCode]);

  // Handle file uploads
  const handleFileUpload = (type: 'logo' | 'banner', file: File) => {
    if (!file) return;

    // Validate file size (logo: 2MB, banner: 5MB)
    const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`${type === 'logo' ? 'Logo' : 'Banner'} size should be less than ${type === 'logo' ? '2MB' : '5MB'}`);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WebP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(prev => ({ ...prev, [type]: 10 }));
    };
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 90) + 10;
        setUploadProgress(prev => ({ ...prev, [type]: progress }));
      }
    };
    reader.onloadend = () => {
      setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      setTimeout(() => setUploadProgress(prev => ({ ...prev, [type]: 0 })), 1000);
    };
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'storeLogo' : 'storeBanner']: file,
        [type === 'logo' ? 'storeLogoPreview' : 'storeBannerPreview']: previewUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'logo' | 'banner') => {
    setFormData(prev => ({
      ...prev,
      [type === 'logo' ? 'storeLogo' : 'storeBanner']: null,
      [type === 'logo' ? 'storeLogoPreview' : 'storeBannerPreview']: ''
    }));
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      if (validateStep(currentStep)) {
        setCurrentStep(prev => prev + 1);
        setError('');
        window.scrollTo(0, 0);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step);
      setError('');
      window.scrollTo(0, 0);
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1: // Business Info
        if (!formData.storeName.trim()) errors.push('Store name is required');
        if (!formData.businessType) errors.push('Business type is required');
        if (!formData.storeCategory) errors.push('Store category is required');
        if (!formData.storeDescription.trim()) errors.push('Store description is required');
        break;
        
      case 2: // Store Design
        if (!formData.storeLogo) errors.push('Store logo is required');
        if (!formData.storeBanner) errors.push('Store banner is required');
        break;
        
      case 3: // Contact Details
        if (!formData.contactEmail.trim()) errors.push('Contact email is required');
        if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) errors.push('Valid email is required');
        if (!formData.contactPhone.trim()) errors.push('Contact phone is required');
        if (!formData.country.trim()) errors.push('Country is required');
        if (!formData.city.trim()) errors.push('City is required');
        break;
        
      case 4: // Invitation Code
        if (!formData.invitationCode.trim()) errors.push('Invitation code is required');
        if (!invitationValidation?.valid) errors.push('Valid invitation code is required');
        break;
        
      case 5: // Review & Submit
        if (!formData.agreeToTerms) errors.push('You must agree to the terms');
        if (!formData.agreeToPrivacy) errors.push('You must agree to the privacy policy');
        if (!formData.agreeToCommission) errors.push('You must agree to the commission structure');
        break;
    }

    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Check for existing partner
      const { data: existingPartner } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPartner) throw new Error('Partner account already exists');

      // Upload files to Supabase Storage
      const uploadFile = async (file: File, path: string): Promise<string> => {
        const { data, error } = await supabase.storage
          .from('partner-assets')
          .upload(`${path}/${Date.now()}-${file.name}`, file);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('partner-assets')
          .getPublicUrl(data.path);

        return publicUrl;
      };

      let logoUrl = '', bannerUrl = '';
      
      if (formData.storeLogo) {
        logoUrl = await uploadFile(formData.storeLogo, 'logos');
      }
      if (formData.storeBanner) {
        bannerUrl = await uploadFile(formData.storeBanner, 'banners');
      }

      // Create partner profile
      const { data: partner, error: partnerError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: user.id,
          store_name: formData.storeName,
          store_slug: formData.storeName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
          store_tagline: formData.storeTagline,
          store_description: formData.storeDescription,
          business_type: formData.businessType,
          store_category: formData.storeCategory,
          year_established: parseInt(formData.yearEstablished),
          
          // Design assets
          store_logo: logoUrl,
          store_banner: bannerUrl,
          brand_color: formData.brandColor,
          accent_color: formData.accentColor,
          
          // Contact info
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          website: formData.website,
          social_facebook: formData.socialFacebook,
          social_instagram: formData.socialInstagram,
          social_linkedin: formData.socialLinkedIn,
          
          // Location
          country: formData.country,
          city: formData.city,
          timezone: formData.timezone,
          business_hours: formData.businessHours,
          
          // Invitation
          referred_by: invitationValidation?.referrerId,
          invitation_code_used: formData.invitationCode,
          
          // Status
          status: 'pending_review',
          is_active: false,
          partner_status: 'pending',
          
          // Default values
          commission_rate: 15,
          rating: 0,
          total_sales: 0,
          total_earnings: 0,
          customer_count: 0,
          product_count: 0,
          
          // Settings
          settings: {
            notifications: true,
            auto_relist: true,
            low_stock_alerts: true,
            email_notifications: formData.receiveUpdates
          }
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Update user role
      await supabase
        .from('users')
        .update({ 
          user_type: 'partner',
          partner_status: 'pending'
        })
        .eq('id', user.id);

      // Create referral benefit
      if (invitationValidation?.valid && invitationValidation.referrerId) {
        try {
          await supabase
            .from('referral_benefits')
            .insert({
              referrer_id: invitationValidation.referrerId,
              referred_id: partner.id,
              benefit_type: 'welcome_bonus',
              benefit_amount: 50,
              benefit_details: {
                commission_discount: 5,
                discount_months: 3,
                priority_support: true
              },
              status: 'pending'
            });
        } catch (referralError) {
          console.error('Referral benefit error:', referralError);
        }
      }

      // Send notification to admins
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'New Partner Application',
          message: `${formData.storeName} has applied for partnership`,
          type: 'admin',
          priority: 'medium',
          metadata: {
            store_name: formData.storeName,
            category: formData.storeCategory,
            referrer: invitationValidation?.referrerName
          }
        });

      setGeneratedStoreId(partner.store_id || '');
      setSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Business Information
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900">Business Information</h2>
        <p className="dark:text-gray-300 text-gray-600">Tell us about your store</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({...formData, storeName: e.target.value})}
              className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., AutoZone Pro"
            />
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">This will be your store's public name</p>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Business Type *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({...formData, businessType: type.value})}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    formData.businessType === type.value
                      ? 'dark:border-blue-500 dark:bg-blue-900/20 dark:ring-blue-900/30 border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                      : 'dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.businessType === type.value 
                        ? 'dark:bg-blue-800/40 bg-blue-100' 
                        : 'dark:bg-gray-700 bg-gray-100'
                    }`}>
                      <type.icon className="w-5 h-5 dark:text-gray-300" />
                    </div>
                    <span className="font-medium dark:text-gray-200">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Store Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STORE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({...formData, storeCategory: cat.value})}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    formData.storeCategory === cat.value
                      ? 'dark:ring-blue-500/50 dark:border-blue-500 ring-2 ring-blue-500 border-blue-500'
                      : 'dark:border-gray-700 dark:hover:border-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                    {cat.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Store Tagline
            </label>
            <input
              type="text"
              value={formData.storeTagline}
              onChange={(e) => setFormData({...formData, storeTagline: e.target.value})}
              className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Premium Auto Parts Since 2010"
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs dark:text-gray-400 text-gray-500">Catchy phrase for your store</p>
              <span className="text-xs dark:text-gray-500 text-gray-400">{formData.storeTagline.length}/60</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Store Description *
            </label>
            <textarea
              value={formData.storeDescription}
              onChange={(e) => setFormData({...formData, storeDescription: e.target.value})}
              rows={6}
              className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your store, your expertise, and what makes you unique..."
            />
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">Tell customers about your store (200-500 characters)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Year Established
            </label>
            <select
              value={formData.yearEstablished}
              onChange={(e) => setFormData({...formData, yearEstablished: e.target.value})}
              className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 2: Store Design
  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
          <Palette className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900">Store Design</h2>
        <p className="dark:text-gray-300 text-gray-600">Customize your store's appearance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo Upload */}
        <div className="space-y-6">
          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              ref={fileInputLogoRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
              className="hidden"
              accept="image/*"
            />
            
            {formData.storeLogoPreview ? (
              <div className="relative">
                <img
                  src={formData.storeLogoPreview}
                  alt="Logo preview"
                  className="w-48 h-48 mx-auto rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => removeFile('logo')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploadProgress.logo > 0 && uploadProgress.logo < 100 && (
                  <div className="mt-4">
                    <div className="h-2 dark:bg-gray-700 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress.logo}%` }}
                      />
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">Uploading...</p>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="cursor-pointer"
                onClick={() => fileInputLogoRef.current?.click()}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 dark:bg-gray-700 bg-gray-100 rounded-full mb-4">
                  <Upload className="w-8 h-8 dark:text-gray-400 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">
                  Upload Store Logo
                </h3>
                <p className="dark:text-gray-400 text-gray-600 mb-4">
                  PNG, JPG, SVG or WebP • Max 2MB
                </p>
                <button
                  type="button"
                  className="px-6 py-2 dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Choose File
                </button>
                <p className="text-xs dark:text-gray-500 text-gray-500 mt-4">
                  Recommended: 512×512px, transparent background
                </p>
              </div>
            )}
          </div>

          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold dark:text-white text-gray-900 mb-4">Color Scheme</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Brand Color</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({...formData, brandColor: e.target.value})}
                      className="w-16 h-16 cursor-pointer rounded-lg border-0"
                    />
                    <div className="absolute inset-0 rounded-lg dark:ring-gray-600 ring-2 ring-gray-200 pointer-events-none" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200 text-gray-900">Primary Color</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500">Used for buttons, links, and highlights</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Accent Color</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                      className="w-16 h-16 cursor-pointer rounded-lg border-0"
                    />
                    <div className="absolute inset-0 rounded-lg dark:ring-gray-600 ring-2 ring-gray-200 pointer-events-none" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200 text-gray-900">Secondary Color</p>
                    <p className="text-xs dark:text-gray-400 text-gray-500">Used for badges, alerts, and accents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div className="space-y-6">
          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              ref={fileInputBannerRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload('banner', e.target.files[0])}
              className="hidden"
              accept="image/*"
            />
            
            {formData.storeBannerPreview ? (
              <div className="relative">
                <img
                  src={formData.storeBannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removeFile('banner')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploadProgress.banner > 0 && uploadProgress.banner < 100 && (
                  <div className="mt-4">
                    <div className="h-2 dark:bg-gray-700 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress.banner}%` }}
                      />
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">Uploading...</p>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="cursor-pointer"
                onClick={() => fileInputBannerRef.current?.click()}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 dark:bg-gray-700 bg-gray-100 rounded-full mb-4">
                  <ImageIcon className="w-8 h-8 dark:text-gray-400 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">
                  Upload Store Banner
                </h3>
                <p className="dark:text-gray-400 text-gray-600 mb-4">
                  PNG or JPG • Max 5MB • 1920×400px recommended
                </p>
                <button
                  type="button"
                  className="px-6 py-2 dark:bg-gray-700 dark:hover:bg-gray-600 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Choose File
                </button>
              </div>
            )}
          </div>

          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold dark:text-white text-gray-900 mb-4">Preview</h3>
            <div className="dark:border-gray-700 border border-gray-200 rounded-xl overflow-hidden">
              {/* Banner Preview */}
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {formData.storeBannerPreview ? (
                  <img
                    src={formData.storeBannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Store Banner</p>
                    </div>
                  </div>
                )}
                
                {/* Logo Overlay Preview */}
                <div className="absolute -bottom-6 left-6">
                  <div className="w-16 h-16 dark:bg-gray-800 dark:border-gray-700 bg-white rounded-xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                    {formData.storeLogoPreview ? (
                      <img
                        src={formData.storeLogoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Store className="w-8 h-8 dark:text-gray-400 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Store Info Preview */}
              <div className="p-6 pt-8 dark:bg-gray-800">
                <h4 className="text-xl font-bold dark:text-white text-gray-900 mb-1">
                  {formData.storeName || "Your Store Name"}
                </h4>
                <p className="dark:text-gray-400 text-gray-600 mb-4">
                  {formData.storeTagline || "Your store tagline will appear here"}
                </p>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 dark:bg-blue-900/30 dark:text-blue-300 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {formData.storeCategory ? 
                      STORE_CATEGORIES.find(c => c.value === formData.storeCategory)?.label 
                      : "Category"
                    }
                  </span>
                  <span className="px-3 py-1 dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    ⭐ 4.8 (124 reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 3: Contact Details
  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900">Contact Details</h2>
        <p className="dark:text-gray-300 text-gray-600">How customers can reach you</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Contact Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-gray-500 text-gray-400" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">For business communications</p>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Contact Phone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-gray-500 text-gray-400" />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-gray-500 text-gray-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourstore.com"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-4">
              Social Media Links (Optional)
            </label>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                  f
                </div>
                <input
                  type="text"
                  value={formData.socialFacebook}
                  onChange={(e) => setFormData({...formData, socialFacebook: e.target.value})}
                  className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="facebook.com/yourstore"
                />
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600">
                  @
                </div>
                <input
                  type="text"
                  value={formData.socialInstagram}
                  onChange={(e) => setFormData({...formData, socialInstagram: e.target.value})}
                  className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="instagram.com/yourstore"
                />
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-700">
                  in
                </div>
                <input
                  type="text"
                  value={formData.socialLinkedIn}
                  onChange={(e) => setFormData({...formData, socialLinkedIn: e.target.value})}
                  className="pl-10 w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="linkedin.com/company/yourstore"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold dark:text-gray-200 text-gray-900 mb-2">
              Location *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Country"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 4: Invitation Code
  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900">Invitation Code</h2>
        <p className="dark:text-gray-300 text-gray-600">Join through an existing partner</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Referrer Info */}
        {invitationValidation?.valid && (
          <div className="dark:bg-gray-800 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  {invitationValidation.referrerLogo ? (
                    <img 
                      src={invitationValidation.referrerLogo} 
                      alt={invitationValidation.referrerName}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900">
                    Invited by {invitationValidation.referrerName}
                  </h3>
                  <span className="px-3 py-1 dark:bg-green-900/30 dark:text-green-300 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Verified Partner
                  </span>
                </div>
                <p className="dark:text-gray-400 text-gray-600 mb-4">
                  You're joining through an approved AutoVault partner
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {invitationValidation.benefits?.map((benefit: string, index: number) => (
                    <div key={index} className="dark:bg-gray-700/50 dark:border-gray-600 bg-white border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium dark:text-gray-200 text-gray-900">{benefit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Code Input */}
        <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">
            Enter Invitation Code *
          </h3>
          <p className="dark:text-gray-400 text-gray-600 mb-6">
            You need an invitation code from an existing partner to join
          </p>
          
          <div className="relative mb-6">
            <Gift className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 dark:text-gray-500 text-gray-400" />
            <input
              type="text"
              value={formData.invitationCode}
              onChange={(e) => setFormData({...formData, invitationCode: e.target.value.toUpperCase()})}
              className="pl-12 w-full px-4 py-4 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., AV1234567"
              maxLength={9}
            />
          </div>

          {invitationValidation?.loading && (
            <div className="flex items-center justify-center gap-3 p-4 dark:bg-gray-700 bg-gray-50 rounded-lg">
              <Loader2 className="w-5 h-5 dark:text-gray-400 text-gray-400 animate-spin" />
              <span className="dark:text-gray-400 text-gray-600">Validating invitation code...</span>
            </div>
          )}

          {invitationValidation?.error && (
            <div className="flex items-center gap-3 p-4 dark:bg-red-900/20 dark:border-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="dark:text-red-300 text-red-800 font-medium">{invitationValidation.error}</p>
                <p className="dark:text-red-400 text-red-600 text-sm mt-1">
                  Please check the code or contact your referrer
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 dark:bg-blue-900/20 dark:border-blue-800/30 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold dark:text-white text-gray-900 mb-3">How to get an invitation code:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 dark:bg-blue-900/40 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-800 dark:text-blue-300 text-sm font-bold">1</span>
                </div>
                <span className="dark:text-gray-300 text-gray-700">Ask an existing AutoVault partner for their code</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 dark:bg-blue-900/40 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-800 dark:text-blue-300 text-sm font-bold">2</span>
                </div>
                <span className="dark:text-gray-300 text-gray-700">Check our partner directory for active stores</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-6 h-6 dark:bg-blue-900/40 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-800 dark:text-blue-300 text-sm font-bold">3</span>
                </div>
                <span className="dark:text-gray-300 text-gray-700">Join our partner community forum</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // STEP 5: Review & Submit
  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full mb-4">
          <FileCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900">Review & Submit</h2>
        <p className="dark:text-gray-300 text-gray-600">Final check before submitting your application</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary Card */}
        <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Application Summary</h3>
          
          <div className="space-y-6">
            {/* Store Info */}
            <div>
              <h4 className="text-sm font-semibold dark:text-gray-300 text-gray-700 mb-3">Store Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Store Name</span>
                  <span className="font-medium dark:text-white">{formData.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Category</span>
                  <span className="font-medium dark:text-white">
                    {STORE_CATEGORIES.find(c => c.value === formData.storeCategory)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Business Type</span>
                  <span className="font-medium dark:text-white">
                    {BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Design Preview */}
            <div>
              <h4 className="text-sm font-semibold dark:text-gray-300 text-gray-700 mb-3">Store Design</h4>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl h-24 relative mb-4">
                {formData.storeBannerPreview && (
                  <img
                    src={formData.storeBannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
                <div className="absolute -bottom-6 left-4">
                  <div className="w-12 h-12 dark:bg-gray-800 dark:border-gray-700 bg-white rounded-lg border-4 border-white shadow-sm flex items-center justify-center">
                    {formData.storeLogoPreview ? (
                      <img
                        src={formData.storeLogoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain rounded"
                      />
                    ) : (
                      <Store className="w-6 h-6 dark:text-gray-400 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold dark:text-gray-300 text-gray-700 mb-3">Contact Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <span className="dark:text-gray-400 text-gray-600">{formData.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <span className="dark:text-gray-400 text-gray-600">{formData.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <span className="dark:text-gray-400 text-gray-600">{formData.city}, {formData.country}</span>
                </div>
              </div>
            </div>

            {/* Invitation Info */}
            <div>
              <h4 className="text-sm font-semibold dark:text-gray-300 text-gray-700 mb-3">Invitation</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 dark:text-gray-500 text-gray-400" />
                  <span className="dark:text-gray-400 text-gray-600">Invited by</span>
                </div>
                <span className="font-medium dark:text-white">
                  {invitationValidation?.referrerName || 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Agreements */}
        <div className="space-y-6">
          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Terms & Agreements</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 dark:bg-gray-700/50 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                  className="mt-1 dark:accent-blue-500"
                />
                <div>
                  <label htmlFor="agreeToTerms" className="font-medium dark:text-gray-200 text-gray-900 cursor-pointer">
                    AutoVault Partner Agreement
                  </label>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                    I agree to the AutoVault Partner Terms of Service, including commission structure (15%), payment terms, and store policies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 dark:bg-gray-700/50 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="agreeToPrivacy"
                  checked={formData.agreeToPrivacy}
                  onChange={(e) => setFormData({...formData, agreeToPrivacy: e.target.checked})}
                  className="mt-1 dark:accent-blue-500"
                />
                <div>
                  <label htmlFor="agreeToPrivacy" className="font-medium dark:text-gray-200 text-gray-900 cursor-pointer">
                    Privacy Policy & Data Usage
                  </label>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                    I agree to the collection and use of my data as described in the Privacy Policy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 dark:bg-gray-700/50 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="agreeToCommission"
                  checked={formData.agreeToCommission}
                  onChange={(e) => setFormData({...formData, agreeToCommission: e.target.checked})}
                  className="mt-1 dark:accent-blue-500"
                />
                <div>
                  <label htmlFor="agreeToCommission" className="font-medium dark:text-gray-200 text-gray-900 cursor-pointer">
                    Commission Structure
                  </label>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                    I understand and agree to the 15% commission fee on all sales, with payments processed bi-weekly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 dark:bg-gray-700/50 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="receiveUpdates"
                  checked={formData.receiveUpdates}
                  onChange={(e) => setFormData({...formData, receiveUpdates: e.target.checked})}
                  className="mt-1 dark:accent-blue-500"
                />
                <div>
                  <label htmlFor="receiveUpdates" className="font-medium dark:text-gray-200 text-gray-900 cursor-pointer">
                    Marketing Communications
                  </label>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                    I want to receive updates, tips, and promotional offers from AutoVault.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="dark:bg-gray-800 dark:border-blue-800/30 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-4">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 dark:bg-blue-900/40 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 dark:text-blue-400 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">Application Review</p>
                  <p className="text-sm dark:text-gray-400 text-gray-600">We'll review your application within 48 hours</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 dark:bg-blue-900/40 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-4 h-4 dark:text-blue-400 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">Store Setup</p>
                  <p className="text-sm dark:text-gray-400 text-gray-600">Your store will be created with a unique Store ID</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 dark:bg-blue-900/40 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 dark:text-blue-400 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">Start Selling</p>
                  <p className="text-sm dark:text-gray-400 text-gray-600">Access our catalog and start selling immediately</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl w-full dark:bg-gray-800 bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-8">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-4">
            Application Submitted!
          </h1>
          
          <p className="text-xl dark:text-gray-300 text-gray-600 mb-8 max-w-md mx-auto">
            Your partner application has been received. Our team will review it and contact you within 48 hours.
          </p>

          {generatedStoreId && (
            <div className="dark:bg-gray-700/50 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 dark:bg-gray-800 bg-white rounded-full shadow-sm mb-4">
                <Store className="w-8 h-8 dark:text-blue-400 text-blue-600" />
              </div>
              <p className="text-sm font-medium dark:text-blue-300 text-blue-800 mb-2">Your Store ID</p>
              <div className="text-2xl font-bold dark:text-white text-gray-900 font-mono tracking-wider">
                {generatedStoreId}
              </div>
              <p className="text-sm dark:text-blue-400 text-blue-600 mt-2">
                Save this ID for future reference
              </p>
            </div>
          )}

          <button
            onClick={() => (window as any).closePartnerModal?.()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl w-full max-w-xs mx-auto"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 dark:bg-gray-800 dark:border-gray-700 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Steps */}
            <div className="flex items-center gap-8">
              {WIZARD_STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-3 transition-all ${
                    currentStep >= step.id ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.id
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'dark:bg-gray-700 dark:text-gray-400 bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'dark:text-white text-gray-900' : 'dark:text-gray-400 text-gray-500'
                    }`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${
                      currentStep >= step.id ? 'dark:text-gray-300 text-gray-600' : 'dark:text-gray-500 text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Step Counter */}
            <div className="text-right">
              <p className="text-sm font-medium dark:text-white text-gray-900">
                Step {currentStep} of {WIZARD_STEPS.length}
              </p>
              <div className="w-32 h-2 dark:bg-gray-700 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="dark:bg-gray-800 bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="dark:bg-red-900/20 dark:border-red-800 bg-red-50 border-l-4 border-red-500 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="dark:text-red-300 text-red-800 font-medium">Please fix the following errors:</p>
                  <p className="dark:text-red-400 text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="p-8 md:p-12">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          {/* Navigation Buttons */}
          <div className="dark:border-gray-700 border-t border-gray-200 p-8">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
                  currentStep === 1
                    ? 'opacity-50 cursor-not-allowed dark:text-gray-500 text-gray-400'
                    : 'dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              <div className="flex items-center gap-4">
                {currentStep === WIZARD_STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistrationForm;