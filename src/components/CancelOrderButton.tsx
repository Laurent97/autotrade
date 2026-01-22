import React, { useState } from 'react';

interface CancelOrderButtonProps {
  orderId: string;
  currentStatus: string;
  userRole: 'admin' | 'partner';
  onCancel: (orderId: string) => Promise<void>;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({
  orderId,
  currentStatus,
  userRole,
  onCancel,
  size = 'md',
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  
  const cannotCancelStatuses = ['CANCELLED']; // Only admins can cancel, and only if not already cancelled

  if (cannotCancelStatuses.includes(currentStatus?.toUpperCase()) || disabled || userRole !== 'admin') {
    return null; // Only admins can cancel orders
  }

  const handleClick = async () => {
    const message = `Are you sure you want to cancel order #${orderId.slice(0, 8)}?`;

    if (!window.confirm(message)) return;

    setLoading(true);
    try {
      await onCancel(orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm'
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        bg-red-600 hover:bg-red-700 text-white
        rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2 shadow-sm hover:shadow-md
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          Cancelling...
        </>
      ) : (
        <>
          <span>❌</span>
          Cancel Order
        </>
      )}
    </button>
  );
};
