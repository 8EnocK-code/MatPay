// frontend/src/pages/Sacco.tsx
// Separate SACCO admin dashboard

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, PieChart, TrendingUp, AlertCircle, LogOut, Download, Loader2, CheckCircle, UserPlus, Wallet } from 'lucide-react';
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
  driverConfirmed: boolean;
  status: string;
  tripDate: string;
}

interface RevenueSplit {
  id: string;
  totalAmount: number;
  saccoAmount: number;
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

const SACCO_PERCENTAGE = 15;

const Sacco = () => {
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
  const totalSaccoAmount = revenueSplits.reduce((sum, rs) => sum + rs.saccoAmount, 0);
  const estimatedSaccoAmount = (confirmedRevenue * SACCO_PERCENTAGE) / 100;

  const handleExport = () => {
    const csv = [
      ['Trip ID', 'Route', 'Matatu', 'Total Amount', 'SACCO Share', 'Date'].join(','),
      ...revenueSplits.map(rs => [
        rs.trip.id,
        rs.trip.route.name,
        rs.trip.matatu.plateNumber,
        rs.totalAmount,
        rs.saccoAmount,
        new Date(rs.createdAt).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sacco-revenue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacco/5 via-background to-sacco/10">
      <div className="max-w-6xl mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sacco/10">
              <Building2 className="w-6 h-6 text-sacco" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SACCO Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Revenue analytics & staff management</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={`KES ${totalRevenue.toLocaleString()}`}
            className="bg-sacco/5 border-sacco/20"
          />
          <StatCard
            icon={PieChart}
            label="SACCO Share"
            value={`KES ${(totalSaccoAmount || estimatedSaccoAmount).toLocaleString()}`}
            subtext={`${SACCO_PERCENTAGE}% of confirmed revenue`}
          />
          <StatCard
            icon={CheckCircle}
            label="Confirmed Trips"
            value={trips.filter((t) => t.driverConfirmed).length}
            subtext={`KES ${confirmedRevenue.toLocaleString()} total`}
          />
        </div>

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

        {/* Revenue Breakdown */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">SACCO Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sacco/5 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">SACCO Share</span>
                <Badge variant="outline" className="text-xs">
                  {SACCO_PERCENTAGE}%
                </Badge>
              </div>
              <span className="font-bold text-lg">KES {(totalSaccoAmount || estimatedSaccoAmount).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Recent Revenue Splits */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Recent Revenue Splits</h2>
          {revenueSplits.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No revenue splits yet</div>
          ) : (
            <div className="space-y-2">
              {revenueSplits.slice(0, 10).map((rs) => (
                <div
                  key={rs.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-semibold">{rs.trip.route.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {rs.trip.matatu.plateNumber} • {new Date(rs.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">KES {rs.saccoAmount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">of {rs.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Sacco;

