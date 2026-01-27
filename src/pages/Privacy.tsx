import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Cookie, Lock, Users, FileText } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const Privacy = () => {
  const lastUpdated = "January 27, 2026";

  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, payment information, and shipping details."
    },
    {
      icon: Database,
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers."
    },
    {
      icon: Lock,
      title: "Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure."
    },
    {
      icon: Cookie,
      title: "Cookies and Tracking",
      content: "We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
    },
    {
      icon: Users,
      title: "Third-Party Services",
      content: "We may employ third-party companies and individuals to facilitate our service, provide the service on our behalf, perform service-related services, or assist us in analyzing how our service is used."
    },
    {
      icon: Eye,
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information. You may also object to processing of your personal information, ask us to restrict processing, or request portability of your data."
    }
  ];

  return (
    <PublicLayout>
      <main className="pt-8">
        {/* Header */}
        <div className="bg-gradient-accent rounded-b-2xl text-white pt-12 pb-8 px-4">
          <div className="container-wide max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-white/90">Your privacy is important to us. Learn how we collect, use, and protect your information.</p>
          </div>
        </div>

        <div className="container-wide max-w-4xl mx-auto py-12 px-4">
          {/* Last Updated */}
          <div className="bg-muted rounded-lg p-4 mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: <span className="font-medium">{lastUpdated}</span>
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg leading-relaxed text-muted-foreground">
              At AutoTradeHub, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
            </p>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-8 mb-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-card rounded-lg shadow-md p-8 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4 text-foreground">{section.title}</h2>
                      <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Privacy Information */}
          <div className="bg-card rounded-lg shadow-md p-8 border border-border mb-8">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Detailed Information</h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Types of Data Collected</h3>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>Personal identification information (name, email address, phone number)</li>
                  <li>Payment and billing information</li>
                  <li>Shipping and address information</li>
                  <li>Usage data and browsing behavior</li>
                  <li>Device and browser information</li>
                  <li>Communications with our customer support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Legal Basis for Processing</h3>
                <p className="leading-relaxed">We process your personal information based on: (1) consent, (2) contract necessity, (3) legal obligation, (4) vital interests, (5) public task, or (6) legitimate interests.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Data Retention</h3>
                <p className="leading-relaxed">We retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">International Data Transfers</h3>
                <p className="leading-relaxed">Your information may be transferred to, and maintained on, computers located outside of your state, province, country or other governmental jurisdiction where data protection laws may differ.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Children's Privacy</h3>
                <p className="leading-relaxed">Our service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18.</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-accent rounded-lg text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Privacy Questions?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              If you have any questions about this Privacy Policy or our data practices, please contact our privacy team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <button className="bg-white text-primary hover:bg-white/90 px-6 py-3 rounded-lg font-semibold transition-colors">
                  Contact Privacy Team
                </button>
              </Link>
              <button className="border border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">
                Download Data Policy
              </button>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
};

export default Privacy;
