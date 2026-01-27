import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calculator, DollarSign, CreditCard, TrendingUp, Shield, 
  Clock, CheckCircle, Users, FileText, Percent, ArrowRight, 
  PiggyBank, Building, ArrowLeft, Search, Filter, 
  Eye, Check, X, Download, Send, AlertCircle, UserPlus, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Financing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState('5000');
  const [loanTerm, setLoanTerm] = useState('12');
  const [isAdminView, setIsAdminView] = useState(false);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applicationForm, setApplicationForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: '',
    annualRevenue: '',
    loanAmount: '',
    loanPurpose: '',
    loanTerm: '12',
    creditScore: '',
    taxId: '',
    agreeToTerms: false
  });

  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin and has partner profile
  useEffect(() => {
    if (!loading) {
      // Check if user is admin
      setIsAdminView(userProfile?.user_type === 'admin');
      
      // Pre-fill form data if user has partner profile
      if (userProfile && 'store_name' in userProfile && userProfile.store_name) {
        setApplicationForm(prev => ({
          ...prev,
          businessName: (userProfile.store_name as string) || '',
          contactPerson: userProfile.full_name || '',
          email: userProfile.email || '',
          phone: ('contact_phone' in userProfile) ? (userProfile.contact_phone as string) || '' : '',
          taxId: ('tax_id' in userProfile) ? (userProfile.tax_id as string) || '' : ''
        }));
      }
    }
  }, [userProfile, loading]);

  // Mock data for demonstration
  const mockApplications = [
    {
      id: 'APP001',
      partnerName: 'John Auto Parts',
      partnerEmail: 'john@example.com',
      loanAmount: 15000,
      loanPurpose: 'Inventory Expansion',
      loanTerm: 24,
      status: 'pending',
      appliedDate: '2024-01-15',
      creditScore: 720,
      annualRevenue: 250000,
      documents: ['tax_return.pdf', 'business_license.pdf']
    },
    {
      id: 'APP002',
      partnerName: 'Smith Motors',
      partnerEmail: 'smith@example.com',
      loanAmount: 50000,
      loanPurpose: 'Equipment Purchase',
      loanTerm: 36,
      status: 'approved',
      appliedDate: '2024-01-10',
      approvedDate: '2024-01-12',
      creditScore: 680,
      annualRevenue: 500000,
      documents: ['financial_statements.pdf']
    },
    {
      id: 'APP003',
      partnerName: 'City Garage LLC',
      partnerEmail: 'city@example.com',
      loanAmount: 10000,
      loanPurpose: 'Working Capital',
      loanTerm: 12,
      status: 'rejected',
      appliedDate: '2024-01-05',
      rejectedDate: '2024-01-08',
      creditScore: 650,
      annualRevenue: 150000,
      documents: ['bank_statements.pdf']
    }
  ];

  // Check if user has partner profile
  const hasPartnerProfile = userProfile && 'store_name' in userProfile && userProfile.store_name;

  // Initialize mock applications for admin view
  useEffect(() => {
    if (isAdminView && applications.length === 0) {
      setApplications(mockApplications);
    }
  }, [isAdminView]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading financing options...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access financing options.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show partner profile required message for loan applications
  const PartnerProfileRequired = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <UserPlus className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Partner Profile Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          To apply for financing, you must first create a partner profile. This helps us verify your business and provide you with the best financing options.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/become-partner')}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Create Partner Profile
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Financing Options
          </button>
        </div>
      </div>
    </div>
  );

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

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    // In real app, this would make an API call
    const newApplication = {
      id: `APP${String(applications.length + 1).padStart(3, '0')}`,
      partnerName: applicationForm.businessName,
      partnerEmail: applicationForm.email,
      loanAmount: parseFloat(applicationForm.loanAmount),
      loanPurpose: applicationForm.loanPurpose,
      loanTerm: parseInt(applicationForm.loanTerm),
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      creditScore: parseInt(applicationForm.creditScore),
      annualRevenue: parseFloat(applicationForm.annualRevenue),
      documents: []
    };
    
    setApplications([newApplication, ...applications]);
    setApplicationForm({
      businessName: userProfile && 'store_name' in userProfile ? (userProfile.store_name as string) || '' : '',
      contactPerson: userProfile?.full_name || '',
      email: userProfile?.email || '',
      phone: userProfile && 'contact_phone' in userProfile ? (userProfile.contact_phone as string) || '' : '',
      businessType: '',
      annualRevenue: '',
      loanAmount: '',
      loanPurpose: '',
      loanTerm: '12',
      creditScore: '',
      taxId: userProfile && 'tax_id' in userProfile ? (userProfile.tax_id as string) || '' : '',
      agreeToTerms: false
    });
    
    alert('Application submitted successfully! We will review it shortly.');
  };

  const handleApproveApplication = (applicationId) => {
    setApplications(applications.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'approved', approvedDate: new Date().toISOString().split('T')[0] }
        : app
    ));
  };

  const handleRejectApplication = (applicationId) => {
    setApplications(applications.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'rejected', rejectedDate: new Date().toISOString().split('T')[0] }
        : app
    ));
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.partnerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Show partner profile required for loan applications
  if (activeTab === 'apply' && !hasPartnerProfile && !isAdminView) {
    return <PartnerProfileRequired />;
  }

  const AdminDashboard = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Applications</h2>
          <p className="text-gray-600 dark:text-gray-400">Review and manage partner loan applications</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or application ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {app.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{app.partnerName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{app.partnerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${app.loanAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {app.loanPurpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {/* View details modal */}}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveApplication(app.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRejectApplication(app.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PartnerApplication = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan Application Form</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Fill out this form to apply for business financing</p>

          <form onSubmit={handleSubmitApplication}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.businessName}
                  onChange={(e) => setApplicationForm({...applicationForm, businessName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.contactPerson}
                  onChange={(e) => setApplicationForm({...applicationForm, contactPerson: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.email}
                  onChange={(e) => setApplicationForm({...applicationForm, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.phone}
                  onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max="500000"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.loanAmount}
                  onChange={(e) => setApplicationForm({...applicationForm, loanAmount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Purpose *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.loanPurpose}
                  onChange={(e) => setApplicationForm({...applicationForm, loanPurpose: e.target.value})}
                >
                  <option value="">Select Purpose</option>
                  <option value="Inventory Expansion">Inventory Expansion</option>
                  <option value="Equipment Purchase">Equipment Purchase</option>
                  <option value="Working Capital">Working Capital</option>
                  <option value="Business Expansion">Business Expansion</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Revenue ($) *
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.annualRevenue}
                  onChange={(e) => setApplicationForm({...applicationForm, annualRevenue: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credit Score *
                </label>
                <input
                  type="number"
                  required
                  min="300"
                  max="850"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={applicationForm.creditScore}
                  onChange={(e) => setApplicationForm({...applicationForm, creditScore: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Term (Months) *
                </label>
                <div className="flex gap-4">
                  {[12, 24, 36, 48, 60].map((term) => (
                    <button
                      key={term}
                      type="button"
                      className={`px-4 py-2 rounded-lg border ${applicationForm.loanTerm === term.toString() ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}
                      onClick={() => setApplicationForm({...applicationForm, loanTerm: term.toString()})}
                    >
                      {term} months
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  required
                  className="mr-2"
                  checked={applicationForm.agreeToTerms}
                  onChange={(e) => setApplicationForm({...applicationForm, agreeToTerms: e.target.checked})}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the terms and conditions and authorize credit verification
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Submit Application
              </button>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-800 dark:to-purple-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-purple-100 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </Link>
              {isAdminView && (
                <button
                  onClick={() => setActiveTab(activeTab === 'admin' ? 'overview' : 'admin')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  {activeTab === 'admin' ? 'View Financing Options' : 'Admin Dashboard'}
                </button>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <DollarSign className="w-16 h-16" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Flexible Financing Options
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8">
                Get the auto parts you need with affordable payment plans tailored to your budget
              </p>
              
              {/* Tabs */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'overview' ? 'bg-white text-purple-600' : 'border-2 border-white text-white hover:bg-white hover:text-purple-600'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'calculator' ? 'bg-white text-purple-600' : 'border-2 border-white text-white hover:bg-white hover:text-purple-600'}`}
                >
                  Payment Calculator
                </button>
                {!isAdminView && (
                  <button
                    onClick={() => setActiveTab(hasPartnerProfile ? 'apply' : 'overview')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'apply' ? 'bg-white text-purple-600' : 'border-2 border-white text-white hover:bg-white hover:text-purple-600'}`}
                  >
                    {hasPartnerProfile ? 'Apply Now' : 'Apply (Partner Required)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isAdminView && activeTab === 'admin' ? (
        <AdminDashboard />
      ) : activeTab === 'apply' ? (
        <PartnerApplication />
      ) : (
        <div className="container mx-auto px-4 py-12">
          {/* Financing Options */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Choose Your Financing Solution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financingOptions.map((option, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-purple-600 dark:text-purple-400 mb-4">
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {option.description}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Range: {option.minAmount} - {option.maxAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Calculator */}
          {activeTab === 'calculator' && (
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Calculator
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Loan Amount
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="1000"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2">
                        <span>$1,000</span>
                        <span className="text-lg font-bold">${parseInt(loanAmount).toLocaleString()}</span>
                        <span>$100,000</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Loan Term (Months)
                      </label>
                      <div className="flex gap-4">
                        {[12, 24, 36, 48, 60].map((term) => (
                          <button
                            key={term}
                            className={`px-4 py-2 rounded-lg ${loanTerm === term.toString() ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                            onClick={() => setLoanTerm(term.toString())}
                          >
                            {term} mo
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Estimated Payment
                    </h3>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      ${calculateMonthlyPayment()}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mb-4">
                      per month
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Based on 8.9% APR. Actual rate may vary based on creditworthiness.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Process Steps */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {process.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={() => setActiveTab(hasPartnerProfile ? 'apply' : 'overview')}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
            >
              {hasPartnerProfile ? 'Apply for Financing' : 'Create Partner Profile to Apply'}
              <ArrowRight className="w-5 h-5" />
            </button>
            {!hasPartnerProfile && (
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Partner profile required for loan applications
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
