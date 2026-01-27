import { useState } from 'react';
import { Calculator, DollarSign, CreditCard, TrendingUp, Shield, Clock, CheckCircle, Users, FileText, Percent, ArrowRight, PiggyBank, Building } from 'lucide-react';

export default function Financing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState('5000');
  const [loanTerm, setLoanTerm] = useState('12');

  const financingOptions = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Buy Now Pay Later",
      description: "Split your purchase into manageable monthly payments",
      features: ["0% interest available", "No credit check required", "Instant approval", "Flexible payment terms"],
      minAmount: "$100",
      maxAmount: "$5,000"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Business Financing",
      description: "Specialized financing solutions for auto parts businesses",
      features: ["Competitive business rates", "Extended payment terms", "Bulk purchase discounts", "Line of credit options"],
      minAmount: "$10,000",
      maxAmount: "$500,000"
    },
    {
      icon: <PiggyBank className="w-6 h-6" />,
      title: "Personal Loans",
      description: "Affordable personal loans for auto parts purchases",
      features: ["Low fixed rates", "Terms up to 60 months", "Quick approval process", "No prepayment penalties"],
      minAmount: "$1,000",
      maxAmount: "$50,000"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Lease Options",
      description: "Lease high-value auto parts and equipment",
      features: ["Tax advantages", "Lower monthly payments", "Upgrade options", "End-of-lease flexibility"],
      minAmount: "$2,000",
      maxAmount: "$100,000"
    }
  ];

  const benefits = [
    "Quick and easy application process",
    "Competitive interest rates",
    "No hidden fees or charges",
    "Flexible repayment terms",
    "Instant pre-approval available",
    "Dedicated financing support"
  ];

  const process = [
    {
      step: "1",
      title: "Apply Online",
      description: "Fill out our simple online application form"
    },
    {
      step: "2",
      title: "Get Approved",
      description: "Receive instant approval decision"
    },
    {
      step: "3",
      title: "Choose Terms",
      description: "Select the payment plan that works for you"
    },
    {
      step: "4",
      title: "Complete Purchase",
      description: "Buy your auto parts with financing"
    },
    {
      step: "5",
      title: "Make Payments",
      description: "Pay conveniently over time"
    }
  ];

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(loanAmount) || 0;
    const months = parseInt(loanTerm) || 1;
    const annualRate = 0.089; // 8.9% APR
    const monthlyRate = annualRate / 12;
    
    if (principal === 0 || months === 0) return 0;
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return monthlyPayment.toFixed(2);
  };

  const eligibility = [
    "Minimum age 18 years",
    "Valid government-issued ID",
    "Active bank account",
    "Regular income source",
    "Good credit history (for some options)",
    "Resident of supported countries"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <DollarSign className="w-16 h-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Flexible Financing Options
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              Get the auto parts you need with affordable payment plans tailored to your budget
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                Apply Now
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
                Calculate Payments
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
              <div className="text-3xl font-bold text-purple-600 mb-2">$50M+</div>
              <div className="text-gray-600">Financed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">25K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">8.9%</div>
              <div className="text-gray-600">Starting APR</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">60mo</div>
              <div className="text-gray-600">Max Term</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b">
          {['overview', 'options', 'calculator', 'process'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Our Financing?</h2>
              <p className="text-gray-600 mb-6">
                We make it easy to purchase the auto parts you need with flexible financing options that fit your budget. Get approved quickly and enjoy competitive rates.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Quick Pre-Approval</h3>
              <p className="text-gray-600 mb-6">
                Check your eligibility and get pre-approved in minutes without affecting your credit score.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>2-minute application</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>Secure and confidential</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>Expert support available</span>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Get Pre-Approved Now
              </button>
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Financing Options</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {financingOptions.map((option, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="text-purple-600 mt-1">{option.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                      <p className="text-gray-600 mb-4">{option.description}</p>
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>Min: {option.minAmount}</span>
                        <span>Max: {option.maxAmount}</span>
                      </div>
                      <ul className="space-y-2">
                        {option.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">Payment Calculator</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-6">Calculate Your Payment</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="100"
                        max="500000"
                        step="100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Term (months)
                    </label>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="24">24 months</option>
                      <option value="36">36 months</option>
                      <option value="48">48 months</option>
                      <option value="60">60 months</option>
                    </select>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Interest Rate (APR)</span>
                      <span className="font-semibold">8.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Payment</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ${calculateMonthlyPayment()}
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Apply for This Loan
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Loan Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Loan Amount</span>
                    <span className="font-semibold">${parseFloat(loanAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Term</span>
                    <span className="font-semibold">{loanTerm} months</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="font-semibold">8.9% APR</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-semibold text-purple-600">${calculateMonthlyPayment()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Interest</span>
                    <span className="font-semibold">
                      ${(parseFloat(calculateMonthlyPayment() || 0) * parseInt(loanTerm) - parseFloat(loanAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 font-semibold">Total Amount</span>
                    <span className="font-bold text-lg">
                      ${(parseFloat(calculateMonthlyPayment() || 0) * parseInt(loanTerm)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-5 gap-6">
              {process.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  {index < process.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full">
                      <ArrowRight className="w-6 h-6 text-purple-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Eligibility Requirements</h3>
                <ul className="space-y-3">
                  {eligibility.map((req, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Required Documents</h3>
                <ul className="space-y-3">
                  {[
                    "Government-issued ID",
                    "Proof of income",
                    "Bank statements",
                    "Address verification",
                    "Credit authorization"
                  ].map((doc, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-gray-700">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Apply now and get approved in minutes for the auto parts you need
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
            Start Your Application
          </button>
        </div>
      </div>
    </div>
  );
}
