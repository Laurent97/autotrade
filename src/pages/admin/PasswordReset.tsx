import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { 
  Key, 
  Mail, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search,
  Eye,
  Copy,
  ExternalLink,
  Shield,
  Calendar,
  Activity,
  Users,
  Lock,
  Unlock,
  Send,
  History,
  Filter
} from 'lucide-react';

interface PasswordResetRequest {
  id: string;
  user_id: string;
  email: string;
  reset_token: string;
  temporary_password?: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
  created_by: string;
  status: 'pending' | 'used' | 'expired';
  user?: {
    id: string;
    email: string;
    full_name: string;
    user_type: string;
    last_sign_in?: string;
  };
  creator?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface ResetActivity {
  id: string;
  user_id: string;
  reset_request_id: string;
  action: 'created' | 'sent' | 'used' | 'expired';
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin?: {
    id: string;
    email: string;
    full_name: string;
  };
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

const PasswordReset: React.FC = () => {
  const { user: admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [activities, setActivities] = useState<ResetActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Form states
  const [userEmail, setUserEmail] = useState('');
  const [resetType, setResetType] = useState<'email' | 'temporary'>('email');
  const [expiryHours, setExpiryHours] = useState('24');
  const [resetNotes, setResetNotes] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (admin) {
      fetchPasswordResetData();
    }
  }, [admin, statusFilter, timeRange]);

  const fetchPasswordResetData = async () => {
    setLoading(true);
    try {
      // Fetch password reset requests
      let requestsQuery = supabase
        .from('password_reset_requests')
        .select(`
          *,
          user:users(id, email, full_name, user_type, last_sign_in),
          creator:users!id(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        requestsQuery = requestsQuery.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        requestsQuery = requestsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%`);
      }
      
      if (timeRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
        requestsQuery = requestsQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: requestsData, error: requestsError } = await requestsQuery;
      if (requestsError) throw requestsError;
      setResetRequests(requestsData || []);

      // Fetch reset activities
      let activitiesQuery = supabase
        .from('password_reset_activities')
        .select(`
          *,
          admin:users(id, email, full_name),
          user:users(id, email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (timeRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
        activitiesQuery = activitiesQuery.gte('created_at', daysAgo.toISOString());
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;
      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

    } catch (error) {
      console.error('Error fetching password reset data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecureToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createPasswordReset = async () => {
    if (!userEmail.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setProcessingAction('create');
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, user_type')
        .eq('email', userEmail)
        .single();

      if (userError || !userData) {
        alert('User not found with this email address');
        return;
      }

      const token = generateSecureToken();
      let temporaryPassword = null;
      
      if (resetType === 'temporary') {
        temporaryPassword = generateSecurePassword();
      }

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

      // Create password reset request
      const { data: resetData, error: resetError } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: userData.id,
          email: userEmail,
          reset_token: token,
          temporary_password: temporaryPassword,
          expires_at: expiresAt.toISOString(),
          created_by: admin.id,
          status: 'pending'
        })
        .select()
        .single();

      if (resetError) throw resetError;

      // Log activity
      await supabase
        .from('password_reset_activities')
        .insert({
          user_id: userData.id,
          reset_request_id: resetData.id,
          action: 'created',
          details: `Password reset ${resetType === 'temporary' ? 'with temporary password' : 'via email'} by admin`,
          admin_id: admin.id
        });

      // Send email or provide credentials
      if (resetType === 'email') {
        // In a real implementation, you would send an email here
        // For now, we'll show the reset link to the admin
        const resetLink = `${window.location.origin}/reset-password?token=${token}`;
        setGeneratedToken(resetLink);
        alert(`Password reset link generated: ${resetLink}\n\nPlease send this link to the user.`);
      } else {
        setGeneratedToken(token);
        setGeneratedPassword(temporaryPassword);
        alert(`Temporary password created: ${temporaryPassword}\n\nPlease provide this to the user. They will be required to change it on first login.`);
      }

      // Close dialog and reset form
      setShowCreateDialog(false);
      setUserEmail('');
      setResetNotes('');
      setGeneratedToken('');
      setGeneratedPassword('');
      
      // Refresh data
      await fetchPasswordResetData();

    } catch (error: any) {
      console.error('Error creating password reset:', error);
      alert('Failed to create password reset. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const sendResetEmail = async (request: PasswordResetRequest) => {
    setProcessingAction(`send-${request.id}`);
    try {
      const resetLink = `${window.location.origin}/reset-password?token=${request.reset_token}`;
      
      // In a real implementation, you would send an email here
      // For now, we'll show the reset link to the admin
      alert(`Password reset link: ${resetLink}\n\nPlease send this link to ${request.email}.`);
      
      // Log activity
      await supabase
        .from('password_reset_activities')
        .insert({
          user_id: request.user_id,
          reset_request_id: request.id,
          action: 'sent',
          details: 'Reset link sent to user by admin',
          admin_id: admin.id
        });

      await fetchPasswordResetData();
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      alert('Failed to send reset email. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      used: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      expired: { variant: 'destructive', icon: <AlertTriangle className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      created: { variant: 'secondary', icon: <Key className="w-3 h-3" /> },
      sent: { variant: 'default', icon: <Send className="w-3 h-3" /> },
      used: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      expired: { variant: 'destructive', icon: <AlertTriangle className="w-3 h-3" /> }
    };

    const config = variants[action] || variants.created;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Password Reset Management</h1>
        <p className="text-muted-foreground">Help users reset their passwords securely</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resetRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resetRequests.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resetRequests.filter(r => r.status === 'used').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resetRequests.filter(r => r.status === 'expired').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Not used in time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Create Password Reset</CardTitle>
          <CardDescription>Generate secure password reset links or temporary passwords for users</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Key className="w-4 h-4 mr-2" />
                Create Password Reset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Password Reset</DialogTitle>
                <DialogDescription>
                  Generate a secure password reset for a user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-email">User Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="reset-type">Reset Type</Label>
                  <Select value={resetType} onValueChange={(value: 'email' | 'temporary') => setResetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Send Reset Link via Email</SelectItem>
                      <SelectItem value="temporary">Generate Temporary Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiry">Expires In</Label>
                  <Select value={expiryHours} onValueChange={setExpiryHours}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="6">6 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="72">3 Days</SelectItem>
                      <SelectItem value="168">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional notes about this reset request..."
                    value={resetNotes}
                    onChange={(e) => setResetNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createPasswordReset}
                    disabled={processingAction === 'create'}
                    className="flex-1"
                  >
                    {processingAction === 'create' ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Create Reset
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Reset Requests</TabsTrigger>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
        </TabsList>

        {/* Reset Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Reset Requests</CardTitle>
              <CardDescription>Manage all password reset requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resetRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.user?.user_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{request.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.temporary_password ? 'Temporary' : 'Email Link'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.expires_at).toLocaleDateString()}
                          <br />
                          {new Date(request.expires_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Reset Request Details</DialogTitle>
                                <DialogDescription>
                                  Full information about this password reset request
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Request ID</Label>
                                      <p className="font-mono text-sm">{selectedRequest.id}</p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getStatusBadge(selectedRequest.status)}</div>
                                    </div>
                                    <div>
                                      <Label>User</Label>
                                      <p>{selectedRequest.user?.full_name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedRequest.user?.email}</p>
                                    </div>
                                    <div>
                                      <Label>Reset Type</Label>
                                      <Badge variant="outline">
                                        {selectedRequest.temporary_password ? 'Temporary Password' : 'Email Link'}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Reset Token</Label>
                                    <div className="flex gap-2">
                                      <p className="font-mono text-sm bg-muted p-2 rounded flex-1">
                                        {selectedRequest.reset_token}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedRequest.reset_token)}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {selectedRequest.temporary_password && (
                                    <div>
                                      <Label>Temporary Password</Label>
                                      <div className="flex gap-2">
                                        <p className="font-mono text-sm bg-muted p-2 rounded flex-1">
                                          {selectedRequest.temporary_password}
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copyToClipboard(selectedRequest.temporary_password)}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Created</Label>
                                      <p className="text-sm">
                                        {new Date(selectedRequest.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Expires</Label>
                                      <p className="text-sm">
                                        {new Date(selectedRequest.expires_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedRequest.used_at && (
                                    <div>
                                      <Label>Used At</Label>
                                      <p className="text-sm">
                                        {new Date(selectedRequest.used_at).toLocaleString()}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <Label>Created By</Label>
                                    <p className="text-sm">
                                      {selectedRequest.creator?.full_name} ({selectedRequest.creator?.email})
                                    </p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendResetEmail(request)}
                              disabled={processingAction === `send-${request.id}`}
                            >
                              {processingAction === `send-${request.id}` ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Track all password reset activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{getActionBadge(activity.action)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.user?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{activity.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.admin?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{activity.admin?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{activity.details}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PasswordReset;
