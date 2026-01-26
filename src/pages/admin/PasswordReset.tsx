import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Key, Clock, CheckCircle, AlertTriangle, RefreshCw, Search, Eye, Copy, ExternalLink, Send } from 'lucide-react';

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
  };
}

const PasswordReset: React.FC = () => {
  const { user: admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [resetType, setResetType] = useState<'email' | 'temporary'>('email');
  const [expiryHours, setExpiryHours] = useState('24');
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin) {
      fetchPasswordData();
    }
  }, [admin, statusFilter]);

  const fetchPasswordData = async () => {
    setLoading(true);
    try {
      let requestsQuery = supabase
        .from('password_reset_requests')
        .select(`
          *,
          user:users!id(id, email, full_name),
          creator:users!id(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        requestsQuery = requestsQuery.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        requestsQuery = requestsQuery.or(`user.email.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%`);
      }

      const { data: requestsData, error: requestsError } = await requestsQuery;

      if (requestsError) {
        console.error('Error fetching password reset requests:', requestsError);
        setResetRequests([]);
      } else {
        setResetRequests(requestsData || []);
      }
    } catch (error) {
      console.error('Error fetching password reset data:', error);
      setResetRequests([]);
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

  const createPasswordReset = async () => {
    if (!userEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setProcessingAction('create');
    setError('');
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', userEmail)
        .single();

      if (userError || !userData) {
        setError('User not found with this email address');
        return;
      }

      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

      const { data: resetData, error: resetError } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: userData.id,
          email: userEmail,
          reset_token: token,
          expires_at: expiresAt.toISOString(),
          created_by: admin.id,
          status: 'pending'
        })
        .select()
        .single();

      if (resetError) {
        setError('Failed to create password reset request');
        return;
      }

      const resetLink = `${window.location.origin}/reset-password?token=${token}`;
      setError(`Password reset link generated: ${resetLink}\n\nPlease send this link to the user.`);

      setShowCreateDialog(false);
      setUserEmail('');
      await fetchPasswordData();

    } catch (error: any) {
      console.error('Error creating password reset:', error);
      setError('Failed to create password reset. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setError('Copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: <Clock className="w-3 h-3" /> },
      used: { variant: 'default' as const, icon: <CheckCircle className="w-3 h-3" /> },
      expired: { variant: 'destructive' as const, icon: <AlertTriangle className="w-3 h-3" /> }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const openPasswordResetWindow = () => {
    const url = '/admin/password-reset';
    const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,status=1,toolbar=0,menubar=0,location=0';
    window.open(url, '_blank', windowFeatures);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Password Reset Management</h1>
          <p className="text-muted-foreground">Help users reset their passwords securely</p>
        </div>
        <Button onClick={openPasswordResetWindow}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Window
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resetRequests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
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
            <p className="text-xs text-muted-foreground">Active requests</p>
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
            <p className="text-xs text-muted-foreground">Completed</p>
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
            <p className="text-xs text-muted-foreground">Not used in time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Password Reset</CardTitle>
          <CardDescription>Generate secure password reset links for users</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Key className="w-4 h-4 mr-2" />
                Create Password Reset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Password Reset</DialogTitle>
                <DialogDescription>Generate a secure password reset for a user</DialogDescription>
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
                    <SelectTrigger className="w-full">
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

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Reset Requests</CardTitle>
          <CardDescription>Manage all password reset requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
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
                  <TableCell className="font-mono text-xs">
                    {request.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{request.user?.email}</div>
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
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
                            <DialogDescription>Full information about this password reset request</DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Request ID</Label>
                                  <p className="font-mono text-sm bg-muted p-2 rounded">{selectedRequest.id}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div>
                                  <Label>User</Label>
                                  <p className="font-medium">{selectedRequest.user?.full_name}</p>
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

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Created</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(selectedRequest.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <Label>Expires</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(selectedRequest.expires_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
