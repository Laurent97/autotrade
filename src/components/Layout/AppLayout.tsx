import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PartnerRegistrationModal from '../Partner/PartnerRegistrationModal';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // Function to open partner registration modal
  const openPartnerModal = () => setIsPartnerModalOpen(true);
  
  // Function to close partner registration modal
  const closePartnerModal = () => setIsPartnerModalOpen(false);

  // Make the modal functions globally available
  React.useEffect(() => {
    // Store functions in window object for global access
    (window as any).openPartnerModal = openPartnerModal;
    (window as any).closePartnerModal = closePartnerModal;
    
    return () => {
      delete (window as any).openPartnerModal;
      delete (window as any).closePartnerModal;
    };
  }, []);

  return (
    <>
      {children || <Outlet />}
      <PartnerRegistrationModal 
        isOpen={isPartnerModalOpen} 
        onClose={closePartnerModal} 
      />
    </>
  );
};

export default AppLayout;
