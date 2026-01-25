import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, ShoppingCart, Wallet, DollarSign, TrendingUp, Settings, BarChart3, Inbox } from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { path: '/partner/dashboard', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
  { path: '/partner/dashboard/products', label: 'Add Products', icon: <Package className="w-5 h-5" /> },
  { path: '/partner/dashboard/inventory', label: 'My Inventory', icon: <Inbox className="w-5 h-5" /> },
  { path: '/partner/dashboard/orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
  { path: '/partner/dashboard/wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  { path: '/partner/dashboard/earnings', label: 'Earnings', icon: <DollarSign className="w-5 h-5" /> },
  { path: '/partner/dashboard/analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
  { path: '/partner/dashboard/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function PartnerSidebar() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 sm:p-3 lg:p-4 h-fit sticky top-4 border border-gray-200 dark:border-gray-700">
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/partner/dashboard'}
            className={({ isActive }) =>
              `flex items-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="mr-2 sm:mr-3 flex-shrink-0">
              {React.cloneElement(item.icon as React.ReactElement, {
                className: 'w-4 h-4 sm:w-5 sm:h-5'
              })}
            </span>
            <span className="font-medium text-xs sm:text-sm truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
