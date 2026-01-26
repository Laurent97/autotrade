import { useState } from 'react';
import { Copy, Check, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import StoreIdService from '@/services/storeIdService';

interface StoreIdBadgeProps {
  storeId: string;
  showCopy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

const StoreIdBadge: React.FC<StoreIdBadgeProps> = ({
  storeId,
  showCopy = true,
  size = 'md',
  variant = 'default',
  className
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      const formattedStoreId = StoreIdService.formatStoreId(storeId);
      await navigator.clipboard.writeText(formattedStoreId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy store ID:', err);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    outline: 'border-gray-300 text-gray-700 bg-white',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-mono font-semibold transition-colors',
        sizeClasses[size],
        variantClasses[variant]
      )}>
        <Store className="w-3 h-3" />
        <span>{StoreIdService.formatStoreId(storeId)}</span>
      </div>
      
      {showCopy && (
        <button
          onClick={copyToClipboard}
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
          title={copied ? 'Copied!' : 'Copy Store ID'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default StoreIdBadge;
