import React, { useState } from 'react';
import { 
  ShippingProvider, 
  getGroupedProviders, 
  getProviderByCode, 
  TIER_CONFIG,
  getProviderIcon,
  getProviderColor
} from '../lib/constants/shippingProviders';

interface ShippingProviderSelectProps {
  value: string;
  onChange: (providerCode: string) => void;
  disabled?: boolean;
  showCurrentInfo?: {
    currentCarrier?: string;
    currentTrackingNumber?: string;
    currentStatus?: string;
    lastUpdated?: string;
  };
}

export const ShippingProviderSelect: React.FC<ShippingProviderSelectProps> = ({
  value,
  onChange,
  disabled = false,
  showCurrentInfo
}) => {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const groupedProviders = getGroupedProviders();
  const selectedProvider = getProviderByCode(value);

  const handleProviderSelect = (providerCode: string) => {
    onChange(providerCode);
    const provider = getProviderByCode(providerCode);
    setSelectedTier(provider?.tier || null);
  };

  return (
    <div className="space-y-6">
      {/* Current Tracking Information */}
      {showCurrentInfo && (showCurrentInfo.currentCarrier || showCurrentInfo.currentTrackingNumber) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
            📍 Current Tracking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showCurrentInfo.currentCarrier && (
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Current Carrier</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderIcon(showCurrentInfo.currentCarrier)}</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {getProviderByCode(showCurrentInfo.currentCarrier)?.name || showCurrentInfo.currentCarrier}
                  </span>
                </div>
              </div>
            )}
            {showCurrentInfo.currentTrackingNumber && (
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Tracking Number</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-800 dark:text-blue-200">
                    {showCurrentInfo.currentTrackingNumber}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(showCurrentInfo.currentTrackingNumber!)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}
            {showCurrentInfo.currentStatus && (
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Status</div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {showCurrentInfo.currentStatus}
                </div>
              </div>
            )}
            {showCurrentInfo.lastUpdated && (
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Last Updated</div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {new Date(showCurrentInfo.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Provider Display */}
      {selectedProvider && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${getProviderColor(selectedProvider.code)}20` }}
              >
                {selectedProvider.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedProvider.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProvider.description}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${TIER_CONFIG[selectedProvider.tier as keyof typeof TIER_CONFIG].bgColor} ${TIER_CONFIG[selectedProvider.tier as keyof typeof TIER_CONFIG].textColor}`}>
                {selectedProvider.tier}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedProvider.deliveryTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-4">
        {Object.entries(groupedProviders).map(([tier, providers]) => (
          <div key={tier} className={`border rounded-xl overflow-hidden ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG].borderColor}`}>
            <div className={`bg-gradient-to-r ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG].color} p-4`}>
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                {TIER_CONFIG[tier as keyof typeof TIER_CONFIG].label}
              </h3>
              <p className="text-white/90 text-sm mt-1">
                {TIER_CONFIG[tier as keyof typeof TIER_CONFIG].description}
              </p>
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.map((provider) => {
                  const isSelected = value === provider.code;
                  const isRealProvider = Object.keys({
                    'DHL': true, 'FEDEX': true, 'UPS': true, 'TNT': true, 
                    'USPS': true, 'FEDEX_GROUND': true, 'UPS_GROUND': true
                  }).includes(provider.code);
                  
                  return (
                    <div
                      key={provider.code}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        disabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:shadow-md hover:scale-[1.02]'
                      } ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => !disabled && handleProviderSelect(provider.code)}
                    >
                      {/* Real Provider Badge */}
                      {isRealProvider && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            ✓ Real
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${provider.color}20` }}
                        >
                          {provider.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {provider.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {provider.description}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {provider.deliveryTime}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${TIER_CONFIG[provider.tier as keyof typeof TIER_CONFIG].bgColor} ${TIER_CONFIG[provider.tier as keyof typeof TIER_CONFIG].textColor}`}>
                              {provider.speed}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Features */}
                      {isSelected && provider.features && provider.features.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Key Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {provider.features.slice(0, 3).map((feature, index) => (
                              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                            {provider.features.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{provider.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
