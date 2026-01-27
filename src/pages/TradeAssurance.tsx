import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, Users, DollarSign, FileText, HeadphonesIcon, ArrowRight } from 'lucide-react';

export default function TradeAssurance() {
  const [activeTab, setActiveTab] = useState('overview');

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Full Payment Protection",
      description: "Your payment is securely held until you confirm satisfactory delivery"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Quality Guaranteed",
      description: "All products undergo strict quality inspection before shipping"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Refund Assurance",
      description: "Get full refund if products don't match description or quality standards"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "On-Time Delivery",
      description: "Guaranteed delivery timelines with tracking and updates"
    }
  ];

  const process = [
    {
      step: "1",
      title: "Place Order",
      description: "Browse products and place your order with secure payment"
    },
    {
      step: "2", 
      title: "Payment Protection",
      description: "Your payment is held in escrow until delivery confirmation"
    },
    {
      step: "3",
      title: "Quality Inspection",
      description: "Products undergo thorough quality checks before shipping"
    },
    {
      step: "4",
      title: "Safe Delivery",
      description: "Track your order until it arrives safely at your location"
    },
    {
      step: "5",
      title: "Confirm & Release",
      description: "Confirm satisfaction and payment is released to supplier"
    }
  ];

  const coverage = [
    "Product quality and authenticity",
    "On-time delivery guarantee", 
    "Accurate product specifications",
    "Secure payment processing",
    "Full refund for non-compliance",
    "24/7 dispute resolution support"
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <Shield className="w-16 h-16" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Trade Assurance Protection
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8">
                Shop with confidence knowing every order is protected by our comprehensive trade assurance program
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Start Shopping Protected
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">$10M+</div>
                <div className="text-gray-600">Protected Transactions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600">Support Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b">
            {['overview', 'how-it-works', 'coverage', 'claims'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Why Choose Trade Assurance?</h2>
                <p className="text-gray-600 mb-6">
                  Trade Assurance is our comprehensive protection program that ensures your auto parts purchases are safe, secure, and satisfactory. We stand between you and the supplier to guarantee quality and delivery.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="text-blue-600 mt-1">{benefit.icon}</div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4">Get Started Today</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of satisfied customers who shop with confidence through Trade Assurance.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>No additional fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Automatic protection on all orders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Easy dispute resolution</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Full refund guarantee</span>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6">
                  Browse Protected Products
                </button>
              </div>
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">How Trade Assurance Works</h2>
              <div className="grid md:grid-cols-5 gap-6">
                {process.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                      {step.step}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    {index < process.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-full w-full">
                        <ArrowRight className="w-6 h-6 text-blue-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Comprehensive Coverage</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">What's Covered</h3>
                  <ul className="space-y-3">
                    {coverage.map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Protection Levels</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Basic Protection</h4>
                      <p className="text-gray-600 text-sm">Payment security and delivery guarantee for all orders</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Premium Protection</h4>
                      <p className="text-gray-600 text-sm">Extended coverage including quality inspection and extended warranty</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Enterprise Protection</h4>
                      <p className="text-gray-600 text-sm">Custom protection plans for bulk orders and B2B transactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claims' && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Claims & Dispute Resolution</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">File a Claim</h3>
                  <p className="text-gray-600 mb-4">
                    If you're not satisfied with your order, filing a claim is simple and straightforward.
                  </p>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                      <span>Contact the supplier first to resolve the issue</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                      <span>If unresolved, file a dispute within 30 days</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                      <span>Provide evidence and documentation</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                      <span>Our team reviews and resolves within 5-7 business days</span>
                    </li>
                  </ol>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
                  <p className="text-gray-600 mb-6">
                    Our dedicated support team is here to help you through every step of the process.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <HeadphonesIcon className="w-5 h-5 text-blue-600" />
                      <span>24/7 Customer Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Detailed Documentation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Expert Mediation Team</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Shopping with Confidence</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of satisfied customers protected by Trade Assurance
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Explore Protected Products
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
