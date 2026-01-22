import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  WAITING_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  WAITING_CONFIRMATION: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
};

const statusIcons: Record<string, string> = {
  PENDING: '⏳',
  CONFIRMED: '📋',
  PROCESSING: '⚙️',
  WAITING_DELIVERY: '🚚',
  DELIVERED: '✅',
  COMPLETED: '✅',
  CANCELLED: '❌',
  REFUNDED: '💰',
  WAITING_CONFIRMATION: '⏳',
  SHIPPED: '🚚',
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const normalizedStatus = status?.toUpperCase() || 'UNKNOWN';
  const colorClass = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800';
  const icon = statusIcons[normalizedStatus] || '';

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${colorClass}
      ${sizeClasses[size]}
    `}>
      {icon && <span className="mr-1">{icon}</span>}
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  );
};
