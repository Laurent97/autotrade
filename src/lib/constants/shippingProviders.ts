/**
 * Professional Shipping Providers Configuration
 * Includes both real companies and realistic fictional providers
 */

export interface ShippingProvider {
  code: string;
  name: string;
  tier: 'premium' | 'standard' | 'economy' | 'specialized';
  speed: string;
  deliveryTime: string;
  icon: string;
  color: string;
  description: string;
  features?: string[];
}

// Real Global Shipping Providers
export const REAL_SHIPPING_PROVIDERS: Record<string, ShippingProvider> = {
  DHL: {
    code: 'DHL',
    name: 'DHL Express',
    tier: 'premium',
    speed: 'express',
    deliveryTime: '1-3 business days',
    icon: '🚚',
    color: '#FFCC00',
    description: 'Global express delivery with real-time tracking'
  },
  FEDEX: {
    code: 'FEDEX',
    name: 'FedEx International',
    tier: 'premium',
    speed: 'express',
    deliveryTime: '2-4 business days',
    icon: '🚀',
    color: '#4D148C',
    description: 'International shipping with comprehensive tracking'
  },
  UPS: {
    code: 'UPS',
    name: 'UPS Worldwide',
    tier: 'premium',
    speed: 'express',
    deliveryTime: '2-5 business days',
    icon: '📦',
    color: '#351C15',
    description: 'Reliable global delivery network'
  },
  TNT: {
    code: 'TNT',
    name: 'TNT Express',
    tier: 'standard',
    speed: 'express',
    deliveryTime: '2-5 business days',
    icon: '🚛',
    color: '#FF0000',
    description: 'European express delivery specialist'
  },
  USPS: {
    code: 'USPS',
    name: 'USPS Priority Mail',
    tier: 'economy',
    speed: 'standard',
    deliveryTime: '1-3 business days',
    icon: '📬',
    color: '#002147',
    description: 'Affordable domestic shipping with tracking'
  },
  FEDEX_GROUND: {
    code: 'FEDEX_GROUND',
    name: 'FedEx Ground',
    tier: 'economy',
    speed: 'ground',
    deliveryTime: '1-5 business days',
    icon: '🚚',
    color: '#4D148C',
    description: 'Cost-effective ground shipping'
  },
  UPS_GROUND: {
    code: 'UPS_GROUND',
    name: 'UPS Ground',
    tier: 'economy',
    speed: 'ground',
    deliveryTime: '1-5 business days',
    icon: '📦',
    color: '#351C15',
    description: 'Reliable ground delivery service'
  }
};

// Professional Fictional Shipping Providers
export const FICTIONAL_SHIPPING_PROVIDERS: Record<string, ShippingProvider> = {
  // Premium Tier
  ELITE_EXPRESS: {
    code: 'ELITE_EXPRESS',
    name: 'Elite Express Global',
    tier: 'premium',
    speed: 'overnight',
    deliveryTime: 'Next business day',
    icon: '⭐',
    color: '#1a365d',
    description: 'Luxury delivery with white-glove service',
    features: ['White-glove service', 'Real-time VIP tracking', 'Temperature control', 'Signature required']
  },
  QUANTUM_LOGISTICS: {
    code: 'QUANTUM_LOGISTICS',
    name: 'Quantum Logistics',
    tier: 'premium',
    speed: 'predictive',
    deliveryTime: 'Predictive AI routing',
    icon: '🤖',
    color: '#2d3748',
    description: 'AI-powered logistics with blockchain tracking',
    features: ['AI route optimization', 'Blockchain tracking', 'Drone delivery option', 'Predictive ETAs']
  },
  PLATINUM_COURIER: {
    code: 'PLATINUM_COURIER',
    name: 'Platinum Courier Services',
    tier: 'premium',
    speed: 'same_day',
    deliveryTime: 'Same day delivery',
    icon: '🛡️',
    color: '#e53e3e',
    description: 'Discreet, secure delivery for high-value items',
    features: ['Personal courier', 'Discreet packaging', 'Insurance up to $50k', '24/7 support']
  },
  AURORA_LOGISTICS: {
    code: 'AURORA_LOGISTICS',
    name: 'Aurora Logistics',
    tier: 'premium',
    speed: 'smart',
    deliveryTime: '1-2 business days',
    icon: '🌌',
    color: '#805ad5',
    description: 'Sustainable premium delivery with smart home integration',
    features: ['Carbon-neutral shipping', 'Scheduled delivery windows', 'Smart lockbox integration']
  },

  // Standard Tier
  NEXUS_DELIVERY: {
    code: 'NEXUS_DELIVERY',
    name: 'Nexus Delivery Network',
    tier: 'standard',
    speed: 'standard',
    deliveryTime: '2-4 business days',
    icon: '🔗',
    color: '#3182ce',
    description: 'Smart grid delivery network leveraging crowdsourced drivers',
    features: ['Crowdsourced delivery', 'Real-time rerouting', 'Smart parcel lockers', 'App-based tracking']
  },
  GREENWAY_COURIER: {
    code: 'GREENWAY_COURIER',
    name: 'Greenway Eco-Courier',
    tier: 'standard',
    speed: 'eco',
    deliveryTime: '2-4 business days',
    icon: '🌿',
    color: '#38a169',
    description: 'Environmentally focused delivery service with carbon-neutral operations',
    features: ['100% electric fleet', 'Biodegradable packaging', 'Carbon offset included', 'Eco-routing']
  },
  CORPORATE_CHAIN: {
    code: 'CORPORATE_CHAIN',
    name: 'Corporate Chain Logistics',
    tier: 'standard',
    speed: 'scheduled',
    deliveryTime: '3-7 business days',
    icon: '💼',
    color: '#2c5282',
    description: 'Enterprise-grade logistics with full supply chain integration',
    features: ['Dedicated account managers', 'Supply chain integration', 'Bulk shipment discounts', 'Custom reporting']
  },

  // Economy Tier
  URBAN_RUSH: {
    code: 'URBAN_RUSH',
    name: 'Urban Rush Delivery',
    tier: 'economy',
    speed: 'same_day',
    deliveryTime: '2-hour delivery',
    icon: '🚴',
    color: '#dd6b20',
    description: 'Hyper-local urban delivery using sustainable transportation methods',
    features: ['Bicycle couriers', 'Pedestrian zones', 'Micro-warehouses', 'Instant delivery']
  },
  REGIONAL_EXPRESS: {
    code: 'REGIONAL_EXPRESS',
    name: 'Regional Express Service',
    tier: 'economy',
    speed: 'ground',
    deliveryTime: '3-7 business days',
    icon: '🏠',
    color: '#718096',
    description: 'Reliable regional delivery at affordable rates'
  },

  // Specialized Tier
  ARTISAN_LOGISTICS: {
    code: 'ARTISAN_LOGISTICS',
    name: 'Artisan Logistics Group',
    tier: 'specialized',
    speed: 'careful',
    deliveryTime: 'Special handling',
    icon: '🎨',
    color: '#805ad5',
    description: 'Specialized handling for fragile, high-value, and delicate items',
    features: ['Hand-crafted packaging', 'Temperature/humidity control', 'Fragile item specialists', 'White glove']
  },
  COLD_CHAIN: {
    code: 'COLD_CHAIN',
    name: 'Cold Chain Specialists',
    tier: 'specialized',
    speed: 'temperature',
    deliveryTime: '1-3 business days',
    icon: '❄️',
    color: '#00b5d8',
    description: 'Temperature-controlled delivery for perishables',
    features: ['Refrigerated transport', 'Temperature monitoring', 'Pharmaceutical grade', 'Food safety certified']
  },
  ALPINE_TRANSPORT: {
    code: 'ALPINE_TRANSPORT',
    name: 'Alpine Mountain Transport',
    tier: 'specialized',
    speed: 'mountain',
    deliveryTime: 'Variable (weather dependent)',
    icon: '⛰️',
    color: '#2f855a',
    description: 'Specialized delivery to mountainous and remote regions',
    features: ['4x4 vehicle fleet', 'Adverse weather capable', 'Remote location specialists', 'Winter logistics']
  },
  GLOBAL_CONNECT: {
    code: 'GLOBAL_CONNECT',
    name: 'Global Connect Express',
    tier: 'specialized',
    speed: 'international',
    deliveryTime: '3-7 business days',
    icon: '🌐',
    color: '#319795',
    description: 'International shipping with full customs and compliance services',
    features: ['Customs brokerage', 'Duty calculation', 'Trade compliance', 'Multi-language support']
  }
};

// Combined shipping providers
export const ALL_SHIPPING_PROVIDERS = {
  ...REAL_SHIPPING_PROVIDERS,
  ...FICTIONAL_SHIPPING_PROVIDERS
};

// Helper functions
export const getAllShippingProviders = (): ShippingProvider[] => {
  return Object.values(ALL_SHIPPING_PROVIDERS);
};

export const getProvidersByTier = (tier: string): ShippingProvider[] => {
  return getAllShippingProviders().filter(provider => provider.tier === tier);
};

export const getProviderByCode = (code: string): ShippingProvider | undefined => {
  return ALL_SHIPPING_PROVIDERS[code];
};

export const getProviderIcon = (code: string): string => {
  const provider = getProviderByCode(code);
  return provider?.icon || '📦';
};

export const getProviderColor = (code: string): string => {
  const provider = getProviderByCode(code);
  return provider?.color || '#718096';
};

// Group providers by tier for organized display
export const getGroupedProviders = () => {
  const providers = getAllShippingProviders();
  
  return {
    premium: providers.filter(p => p.tier === 'premium'),
    standard: providers.filter(p => p.tier === 'standard'),
    economy: providers.filter(p => p.tier === 'economy'),
    specialized: providers.filter(p => p.tier === 'specialized')
  };
};

// Tier labels and colors
export const TIER_CONFIG = {
  premium: {
    label: '⭐ Premium Services',
    description: 'Express delivery with premium features',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200'
  },
  standard: {
    label: '📦 Standard Delivery',
    description: 'Reliable delivery at competitive rates',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  economy: {
    label: '💰 Economy Options',
    description: 'Affordable shipping solutions',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  specialized: {
    label: '🎯 Specialized Services',
    description: 'Special handling for unique requirements',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200'
  }
};
