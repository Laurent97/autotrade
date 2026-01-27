import { ReactNode } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import AdminSidebar from './AdminSidebar';
import Breadcrumbs from '../Breadcrumbs';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <AdminSidebar />
            
            <div className="flex-grow">
              {/* Breadcrumbs appear once, globally */}
              <Breadcrumbs />
              
              <div className="mt-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
