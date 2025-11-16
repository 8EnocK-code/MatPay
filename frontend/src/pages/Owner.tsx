import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, PieChart, TrendingUp, AlertCircle, LogOut, Download, Loader2, CheckCircle, UserPlus, Wallet } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';

interface Trip {
  id: string;
  route: {
    id: string;
    name: string;
  };
  matatu: {
    id: string;
    plateNumber: string;
  };
  totalAmount: number;
  ownerConfirmed: boolean;
  driverConfirmed: boolean;
  status: string;
  tripDate: string;
  revenueSplit?: {
    id: string;
    totalAmount: number;
    ownerAmount: number;
    driverAmount: number;
    conductorAmount: number;
    saccoAmount: number;
    maintenanceAmount: number;
    blockchainHash?: string;
  };
}

interface RevenueSplit {
  id: string;
  totalAmount: number;
  ownerAmount: number;
  driverAmount: number;
  conductorAmount: number;
  saccoAmount: number;
  maintenanceAmount: number;
  blockchainHash?: string;
  createdAt: string;
  trip: {
    id: string;
    route: {
      name: string;
    };
    matatu: {
      plateNumber: string;
    };
  };
}

const OWNER_PERCENTAGE = 40;
const DRIVER_PERCENTAGE = 25;
const CONDUCTOR_PERCENTAGE = 15;
const SACCO_PERCENTAGE = 15;
const MAINTENANCE_PERCENTAGE = 5;

const Owner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [revenueSplits, setRevenueSplits] = useState<RevenueSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStaff, setShowCreateStaff] = useState(true);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'driver' | 'conductor'>('driver');
  const [creatingStaff, setCreatingStaff] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, revenueData] = await Promise.all([
        api<Trip[]>('/trips'),
        api<RevenueSplit[]>('/revenue'),
      ]);

      setTrips(tripsData);
      setRevenueSplits(revenueData);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // Trip confirmation removed - only drivers can confirm trips

  const handleCreateStaff = async () => {
    if (!staffName || !staffPhone || !staffPassword) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setCreatingStaff(true);
      await api('/owner/users', {
        method: 'POST',
        body: { name: staffName, phoneNumber: staffPhone, password: staffPassword, role: staffRole },
      });
      toast.success(`${staffRole} created successfully`);
      setStaffName('');
      setStaffPhone('');
      setStaffPassword('');
      setStaffRole('driver');
      setShowCreateStaff(false);
    } catch (err: any) {
      toast.error(`Failed to create ${staffRole}: ${err.message}`);
    } finally {
      setCreatingStaff(false);
    }
  };

  const totalRevenue = trips.reduce((sum, t) => sum + t.totalAmount, 0);
  const confirmedRevenue = trips
    .filter((t) => t.driverConfirmed)
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const pendingRevenue = totalRevenue - confirmedRevenue;
  const pendingTrips = trips.filter((t) => !t.driverConfirmed);

  // Calculate splits from actual revenue splits or estimated
  const totalOwnerAmount = revenueSplits.reduce((sum, rs) => sum + rs.ownerAmount, 0);
  const totalDriverAmount = revenueSplits.reduce((sum, rs) => sum + rs.driverAmount, 0);
  const totalConductorAmount = revenueSplits.reduce((sum, rs) => sum + rs.conductorAmount, 0);
  const totalSaccoAmount = revenueSplits.reduce((sum, rs) => sum + rs.saccoAmount, 0);
  const totalMaintenanceAmount = revenueSplits.reduce((sum, rs) => sum + rs.maintenanceAmount, 0);

  const splits = {
    owner: totalOwnerAmount || (confirmedRevenue * OWNER_PERCENTAGE) / 100,
    driver: totalDriverAmount || (confirmedRevenue * DRIVER_PERCENTAGE) / 100,
    conductor: totalConductorAmount || (confirmedRevenue * CONDUCTOR_PERCENTAGE) / 100,
    sacco: totalSaccoAmount || (confirmedRevenue * SACCO_PERCENTAGE) / 100,
    maintenance: totalMaintenanceAmount || (confirmedRevenue * MAINTENANCE_PERCENTAGE) / 100,
  };

  const handleExport = () => {
    const csv = [
      ['Trip ID', 'Route', 'Matatu', 'Total Amount', 'Owner Share', 'Date'].join(','),
      ...revenueSplits.map(rs => [
        rs.trip.id,
        rs.trip.route.name,
        rs.trip.matatu.plateNumber,
        rs.totalAmount,
        rs.ownerAmount,
        new Date(rs.createdAt).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-splits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // Group matatus by plate number
  const matatuStats = trips.reduce((acc, trip) => {
    const plate = trip.matatu.plateNumber;
    if (!acc[plate]) {
      acc[plate] = { revenue: 0, trips: 0 };
    }
    acc[plate].revenue += trip.totalAmount;
    acc[plate].trips += 1;
    return acc;
  }, {} as Record<string, { revenue: number; trips: number }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-owner/5 via-background to-owner/10">
      <div className="max-w-6xl mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-owner/10">
              <User className="w-6 h-6 text-owner" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Owner Dashboard</h1>
              <p className="text-sm text-muted-foreground">Revenue analytics & management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/owner/withdrawals')}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdrawals
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={revenueSplits.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={`KES ${totalRevenue.toLocaleString()}`}
            className="bg-owner/5 border-owner/20"
          />
          <StatCard
            icon={PieChart}
            label="Your Share"
            value={`KES ${splits.owner.toLocaleString()}`}
            subtext={`${OWNER_PERCENTAGE}% of confirmed revenue`}
          />
          <StatCard
            icon={AlertCircle}
            label="Pending Approval"
            value={`KES ${pendingRevenue.toLocaleString()}`}
            subtext={`${pendingTrips.length} trips`}
          />
          <StatCard
            icon={CheckCircle}
            label="Confirmed"
            value={`KES ${confirmedRevenue.toLocaleString()}`}
            subtext={`${trips.filter((t) => t.driverConfirmed).length} trips`}
          />
        </div>

        {/* Note: Only drivers can confirm trips */}

        {/* Create Staff Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Create Staff Member</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateStaff(!showCreateStaff)}
            >
              {showCreateStaff ? 'Hide' : 'Show Form'}
            </Button>
          </div>

          {showCreateStaff && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staff-phone">Phone Number</Label>
                <Input
                  id="staff-phone"
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="0712345678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staff-role">Role</Label>
                <Select value={staffRole} onValueChange={(v: 'driver' | 'conductor') => setStaffRole(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="conductor">Conductor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Set password"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCreateStaff}
                className="w-full"
                disabled={creatingStaff}
              >
                {creatingStaff ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </div>
          )}
        </Card>

        {/* Revenue Split Breakdown */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Revenue Split Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(splits).map(([key, amount]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{key}</span>
                    <Badge variant="outline" className="text-xs">
                      {key === 'owner' && OWNER_PERCENTAGE}%
                      {key === 'driver' && DRIVER_PERCENTAGE}%
                      {key === 'conductor' && CONDUCTOR_PERCENTAGE}%
                      {key === 'sacco' && SACCO_PERCENTAGE}%
                      {key === 'maintenance' && MAINTENANCE_PERCENTAGE}%
                    </Badge>
                  </div>
                  <span className="font-bold">KES {amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-owner h-full rounded-full transition-all"
                    style={{
                      width: `${
                        key === 'owner' ? OWNER_PERCENTAGE :
                        key === 'driver' ? DRIVER_PERCENTAGE :
                        key === 'conductor' ? CONDUCTOR_PERCENTAGE :
                        key === 'sacco' ? SACCO_PERCENTAGE :
                        MAINTENANCE_PERCENTAGE
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Fleet Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matatu Performance */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Matatu Performance</h2>
            <div className="space-y-3">
              {Object.entries(matatuStats).map(([plate, stats]) => (
                <div key={plate} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{plate}</span>
                    <Badge className="bg-accent text-accent-foreground">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Revenue</span>
                      <p className="font-bold">KES {stats.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trips</span>
                      <p className="font-bold">{stats.trips}</p>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(matatuStats).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trips recorded yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Revenue Splits */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Recent Revenue Splits</h2>
            <div className="space-y-3">
              {revenueSplits.slice(0, 5).map((split) => (
                <div key={split.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{split.trip.route.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {split.trip.matatu.plateNumber}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(split.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Your Share</span>
                    <span className="font-bold text-owner">KES {split.ownerAmount.toLocaleString()}</span>
                  </div>
                  {split.blockchainHash && (
                    <div className="text-xs text-muted-foreground mt-2 font-mono truncate">
                      Hash: {split.blockchainHash.substring(0, 16)}...
                    </div>
                  )}
                </div>
              ))}
              {revenueSplits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No revenue splits yet</p>
                  <p className="text-xs mt-1">Revenue splits are created when trips are confirmed</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/trips')}>
            View Trip Log
          </Button>
          <Button variant="outline" onClick={() => navigate('/fare-rules')}>
            Manage Fare Rules
          </Button>
          <Button variant="outline" onClick={() => navigate('/mpesa')}>
            MPesa Status
          </Button>
          <Button variant="outline" onClick={() => navigate('/matatus')}>
            Manage Matatus
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Owner;
