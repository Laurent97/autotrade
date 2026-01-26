import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { toast } from '../hooks/use-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Car,
  Users,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/');
  
  const [loginData, setLoginData] = useState({ 
    email: '', 
    password: '',
    rememberMe: false 
  });
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    color: 'bg-gray-200'
  });

  // Handle redirect from URL params
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect && redirect !== '/login') {
      // Use the redirect parameter since React Router handles URL encoding
      // But don't redirect back to login page itself
      setRedirectPath(redirect);
    } else {
      // Default to homepage if no valid redirect parameter
      setRedirectPath('/');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
    else feedback.push('Include uppercase and lowercase letters');
    
    if (password.match(/[0-9]/)) score += 1;
    else feedback.push('Include numbers');
    
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;
    else feedback.push('Include special characters');
    
    let color = 'bg-red-500';
    if (score >= 3) color = 'bg-green-500';
    else if (score >= 2) color = 'bg-yellow-500';
    else if (score >= 1) color = 'bg-orange-500';
    
    setPasswordStrength({ score, feedback, color });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!loginData.email.trim()) {
        toast({
          title: 'Email required',
          description: 'Please enter your email address.',
          variant: 'destructive',
        });
        return;
      }

      if (!loginData.password) {
        toast({
          title: 'Password required',
          description: 'Please enter your password.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Auth: Attempting login for email:', loginData.email);
      await signIn(loginData.email, loginData.password);
      console.log('Auth: Login successful');
      
      toast({
        title: 'Welcome back! 🎉',
        description: 'You have successfully signed in.',
      });
      
      // Navigate to redirect path or default
      navigate(redirectPath, { replace: true });
      
    } catch (error: any) {
      console.error('Auth: Login failed:', error);
      let errorMessage = 'Please check your credentials and try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Sign in failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!registerData.fullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (!registerData.email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!registerData.password) {
      toast({
        title: 'Password required',
        description: 'Please enter a password.',
        variant: 'destructive',
      });
      return;
    }

    if (registerData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (!registerData.agreeToTerms) {
      toast({
        title: 'Terms required',
        description: 'You must agree to the Terms of Service.',
        variant: 'destructive',
      });
      return;
    }

    if (!registerData.agreeToPrivacy) {
      toast({
        title: 'Privacy required',
        description: 'You must agree to the Privacy Policy.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Auth: Attempting registration for email:', registerData.email);
      await signUp(registerData.email, registerData.password, registerData.fullName);
      console.log('Auth: Registration successful');
      
      toast({
        title: 'Account created successfully! 🎉',
        description: 'Welcome to AutoTradeHub! You are now signed in.',
      });
      
      // Navigate to redirect path or default
      navigate(redirectPath, { replace: true });
      
    } catch (error: any) {
      console.error('Auth: Registration failed:', error);
      let errorMessage = 'Please try again later.';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 8 characters long.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('Failed to create user profile')) {
        errorMessage = 'Registration failed. Please try again with different information.';
      } else if (error.message?.includes('Account created but failed to sign in')) {
        errorMessage = 'Account created successfully but sign in failed. Please try signing in manually.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Car, title: 'Premium Auto Parts', description: 'Access to thousands of quality parts' },
    { icon: Users, title: 'Trusted Sellers', description: 'Verified automotive professionals' },
    { icon: TrendingUp, title: 'Best Prices', description: 'Competitive pricing guaranteed' },
    { icon: Zap, title: 'Fast Delivery', description: 'Quick shipping to your doorstep' },
    { icon: Shield, title: 'Secure Payments', description: 'Safe and protected transactions' },
    { icon: Globe, title: 'Global Network', description: 'Connect with buyers worldwide' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center">
        <div className="container-wide max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Branding and Features */}
            <div className="hidden lg:block space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">AutoTradeHub</h1>
                    <p className="text-gray-600">Your Premium Automotive Marketplace</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Join the Future of Auto Parts Trading
                  </h2>
                  <p className="text-xl text-gray-600">
                    Connect with thousands of buyers and sellers in the automotive industry
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-4">
                  Join thousands of automotive professionals and enthusiasts already using AutoTradeHub
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Secure Platform</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Welcome to AutoTradeHub
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Your gateway to premium automotive parts
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                      <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        Sign Up
                      </TabsTrigger>
                    </TabsList>

                    {/* Sign In Form */}
                    <TabsContent value="login" className="space-y-6">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="Enter your email"
                              value={loginData.email}
                              onChange={(e) =>
                                setLoginData({ ...loginData, email: e.target.value })
                              }
                              className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginData.password}
                              onChange={(e) =>
                                setLoginData({ ...loginData, password: e.target.value })
                              }
                              className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-2 h-8 w-8 p-0"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="remember-me"
                              checked={loginData.rememberMe}
                              onCheckedChange={(checked) =>
                                setLoginData({ ...loginData, rememberMe: checked as boolean })
                              }
                            />
                            <Label htmlFor="remember-me" className="text-sm text-gray-600">
                              Remember me
                            </Label>
                          </div>
                          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                            Forgot password?
                          </Link>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Signing in...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              Sign In
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </Button>
                      </form>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Don't have an account?{' '}
                          <button
                            onClick={() => document.querySelector('[value="register"]')?.click()}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </TabsContent>

                    {/* Sign Up Form */}
                    <TabsContent value="register" className="space-y-6">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name" className="text-sm font-medium text-gray-700">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="register-name"
                              type="text"
                              placeholder="Enter your full name"
                              value={registerData.fullName}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, fullName: e.target.value })
                              }
                              className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="register-email"
                              type="email"
                              placeholder="Enter your email"
                              value={registerData.email}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, email: e.target.value })
                              }
                              className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={registerData.password}
                              onChange={(e) => {
                                setRegisterData({ ...registerData, password: e.target.value });
                                checkPasswordStrength(e.target.value);
                              }}
                              className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-2 h-8 w-8 p-0"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                          
                          {/* Password Strength Indicator */}
                          {registerData.password && (
                            <div className="space-y-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full ${
                                      level <= passwordStrength.score
                                        ? passwordStrength.color
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              {passwordStrength.feedback.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {passwordStrength.feedback[0]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-confirm" className="text-sm font-medium text-gray-700">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="register-confirm"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={registerData.confirmPassword}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, confirmPassword: e.target.value })
                              }
                              className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2 top-2 h-8 w-8 p-0"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="agree-terms"
                              checked={registerData.agreeToTerms}
                              onCheckedChange={(checked) =>
                                setRegisterData({ ...registerData, agreeToTerms: checked as boolean })
                              }
                            />
                            <Label htmlFor="agree-terms" className="text-sm text-gray-600 leading-tight">
                              I agree to the{' '}
                              <Link to="/terms" className="text-blue-600 hover:text-blue-800">
                                Terms of Service
                              </Link>
                            </Label>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="agree-privacy"
                              checked={registerData.agreeToPrivacy}
                              onCheckedChange={(checked) =>
                                setRegisterData({ ...registerData, agreeToPrivacy: checked as boolean })
                              }
                            />
                            <Label htmlFor="agree-privacy" className="text-sm text-gray-600 leading-tight">
                              I agree to the{' '}
                              <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="agree-marketing"
                              checked={registerData.agreeToMarketing}
                              onCheckedChange={(checked) =>
                                setRegisterData({ ...registerData, agreeToMarketing: checked as boolean })
                              }
                            />
                            <Label htmlFor="agree-marketing" className="text-sm text-gray-600 leading-tight">
                              I'd like to receive marketing emails (optional)
                            </Label>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating account...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              Create Account
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </Button>
                      </form>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Already have an account?{' '}
                          <button
                            onClick={() => document.querySelector('[value="login"]')?.click()}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span>Secure</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>Fast</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
