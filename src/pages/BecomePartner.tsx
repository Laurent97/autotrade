import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Users, TrendingUp, Shield, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import PartnerRegistrationForm from '../components/Partner/PartnerRegistrationForm';

const BecomePartner: React.FC = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Store,
      title: 'Your Own Store',
      description: 'Create a branded storefront with your logo and custom pricing',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Margins',
      description: 'Set your own prices and earn generous commissions on every sale',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Users,
      title: 'Growing Network',
      description: 'Join 500+ successful partners across 80+ countries',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Shield,
      title: 'Full Support',
      description: 'We handle shipping, logistics, and customer support for you',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Partners' },
    { number: '80+', label: 'Countries' },
    { number: '$2M+', label: 'Annual Revenue' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container-wide py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Become a Partner</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container-wide py-12 lg:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mb-6">
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Partner Program</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Start Your Own
            <span className="block text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Auto Business
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Become a drop-shipping partner and sell cars, parts, and accessories from our catalog. 
            No inventory needed — we handle shipping and logistics.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Registration Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Start Your Journey
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Fill out the form below to apply for our partner program
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <PartnerRegistrationForm />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Application</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Quick Approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomePartner;
