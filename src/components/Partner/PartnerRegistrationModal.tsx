import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PartnerRegistrationForm from './PartnerRegistrationForm';

interface PartnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [formKey, setFormKey] = useState(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormKey(prev => prev + 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
            aria-label="Close partner registration modal"
            title="Close modal"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Form Content */}
          <div className="max-h-[90vh] overflow-y-auto">
            <PartnerRegistrationForm key={formKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistrationModal;
