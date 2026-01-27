import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Package, CreditCard, AlertCircle, FileText } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const Terms = () => {
  const lastUpdated = "January 27, 2026";

  const sections = [
    {
      icon: FileText,
      title: "Agreement to Terms",
      content: "By accessing and using AutoTradeHub, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
    },
    {
      icon: Users,
      title: "User Accounts",
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and all activities that occur under your account."
    },
    {
      icon: Package,
      title: "Products and Services",
      content: "We strive to provide accurate descriptions of our products and services. However, we do not warrant that product descriptions, colors, information, or other content of the products are accurate, complete, reliable, current, or error-free."
    },
    {
      icon: CreditCard,
      title: "Payments and Refunds",
      content: "Payment for products must be made through our designated payment methods. Refunds are handled according to our refund policy and may be subject to restocking fees and shipping costs."
    },
    {
      icon: Shield,
      title: "Intellectual Property",
      content: "The service and its original content, features, and functionality are and will remain the exclusive property of AutoTradeHub and its licensors. The service is protected by copyright, trademark, and other laws."
    },
    {
      icon: AlertCircle,
      title: "Limitation of Liability",
      content: "In no event shall AutoTradeHub, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, or other intangible losses."
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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Terms of Service</h1>
            <p className="text-white/90">Please read these terms carefully before using our platform</p>
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
              Welcome to AutoTradeHub. These Terms of Service govern your use of our platform and services. 
              By accessing or using AutoTradeHub, you agree to comply with and be bound by these terms.
            </p>
          </div>

          {/* Terms Sections */}
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

          {/* Additional Terms */}
          <div className="bg-card rounded-lg shadow-md p-8 border border-border mb-8">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Additional Terms</h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Prohibited Activities</h3>
                <p className="leading-relaxed">You may not access or use the service for any purpose other than that for which we make the service available. The service may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Termination</h3>
                <p className="leading-relaxed">We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Governing Law</h3>
                <p className="leading-relaxed">These terms shall be interpreted and governed by the laws of the jurisdiction in which our headquarters are located, without regard to conflict of law provisions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Changes to Terms</h3>
                <p className="leading-relaxed">We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-accent rounded-lg text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              If you have any questions about these Terms of Service, please contact our legal team.
            </p>
            <Link to="/contact">
              <button className="bg-white text-primary hover:bg-white/90 px-6 py-3 rounded-lg font-semibold transition-colors">
                Contact Legal Team
              </button>
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
};

export default Terms;
