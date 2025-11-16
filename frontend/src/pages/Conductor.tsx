import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, AlertTriangle, LogOut, Loader2, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FareType } from '@/types/matatu';
import { toast } from 'sonner';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  fareRules: {
    id: string;
    fareType: FareType;
    amount: number;
  }[];
}

interface Matatu {
  id: string;
  plateNumber: string;
  model?: string;
  capacity: number;
}

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
}

const Conductor = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [matatus, setMatatus] = useState<Matatu[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedMatatu, setSelectedMatatu] = useState<Matatu | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [fareType, setFareType] = useState<FareType>('normal');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    // Check localStorage directly to avoid timing issues
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }

    loadData();
    loadWalletBalance();
  }, [navigate]);

  const loadWalletBalance = async () => {
    try {
      const data = await api<{ balance: number }>('/wallet/balance');
      setWalletBalance(data.balance);
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (walletBalance === null || amount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setWithdrawing(true);
      await api('/wallet/withdraw', {
        method: 'POST',
        body: { amount, note: 'Withdrawal request' },
      });
      toast.success(`Withdrawal request of KES ${amount} submitted`);
      setWithdrawAmount('');
      await loadWalletBalance();
    } catch (err: any) {
      toast.error(`Failed to request withdrawal: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, matatusData, driversData] = await Promise.all([
        api<Route[]>('/routes'),
        api<Matatu[]>('/matatus'),
        api<Driver[]>('/users?role=driver'),
      ]);

      setRoutes(routesData);
      setMatatus(matatusData);
      setDrivers(driversData);

      // Auto-select first items if available
      if (routesData.length > 0) setSelectedRoute(routesData[0]);
      if (matatusData.length > 0) setSelectedMatatu(matatusData[0]);
      if (driversData.length > 0) setSelectedDriver(driversData[0]);
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

  // Passenger count is now fixed from matatu capacity

  const getFareTypeLabel = (type: FareType): string => {
    const labels = {
      normal: 'Normal Fare',
      rush_hour: 'Rush Hour',
      off_peak: 'Off-Peak',
      rain: 'Rain Fare',
    };
    return labels[type];
  };

  const getFareAmount = (): number => {
    if (!selectedRoute) return 0;
    const fareRule = selectedRoute.fareRules.find((rule) => rule.fareType === fareType);
    return fareRule?.amount || 0;
  };

  const calculateTotal = (): number => {
    if (!selectedMatatu) return 0;
    const fare = getFareAmount();
    return fare * selectedMatatu.capacity;
  };

  const handleSubmit = async () => {
    if (!selectedRoute || !selectedMatatu || !selectedDriver) {
      toast.error('Please fill all required fields');
      return;
    }

    const fareRule = selectedRoute.fareRules.find((rule) => rule.fareType === fareType);
    if (!fareRule) {
      toast.error('Fare rule not found for selected fare type');
      return;
    }

    try {
      setSubmitting(true);
      const trip = await api('/trips', {
        method: 'POST',
        body: {
          routeId: selectedRoute.id,
          matatuId: selectedMatatu.id,
          driverId: selectedDriver.id,
          fareType,
        },
      });

      toast.success(`Trip recorded: KES ${calculateTotal().toLocaleString()}`, {
        description: `${selectedMatatu.capacity} passengers (full capacity) • ${selectedRoute.name}`,
      });
    } catch (error: any) {
      toast.error(`Failed to create trip: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        logout();
        navigate('/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-conductor/5 via-background to-conductor/10">
      <div className="max-w-md mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-conductor/10">
              <ClipboardList className="w-6 h-6 text-conductor" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Conductor Dashboard</h1>
              <p className="text-sm text-muted-foreground">Enter fare details</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Matatu Selection */}
        <Card className="p-4 mb-4">
          <label className="text-sm font-medium mb-2 block">Select Matatu</label>
          <Select
            value={selectedMatatu?.id}
            onValueChange={(value) => setSelectedMatatu(matatus.find((m) => m.id === value) || null)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose matatu" />
            </SelectTrigger>
            <SelectContent>
              {matatus.map((matatu) => (
                <SelectItem key={matatu.id} value={matatu.id}>
                  {matatu.plateNumber} {matatu.model && `(${matatu.model})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Driver Selection */}
        <Card className="p-4 mb-4">
          <label className="text-sm font-medium mb-2 block">Select Driver</label>
          <Select
            value={selectedDriver?.id}
            onValueChange={(value) => setSelectedDriver(drivers.find((d) => d.id === value) || null)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phoneNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Route Selection */}
        <Card className="p-4 mb-4">
          <label className="text-sm font-medium mb-2 block">Select Route</label>
          <Select
            value={selectedRoute?.id}
            onValueChange={(value) => setSelectedRoute(routes.find((r) => r.id === value) || null)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose route" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Fare Type Selection */}
        {selectedRoute && selectedRoute.fareRules.length > 0 && (
          <Card className="p-4 mb-4">
            <label className="text-sm font-medium mb-2 block">Fare Type</label>
            <div className="grid grid-cols-2 gap-2">
              {selectedRoute.fareRules.map((rule) => (
                <Button
                  key={rule.fareType}
                  variant={fareType === rule.fareType ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => setFareType(rule.fareType)}
                >
                  {getFareTypeLabel(rule.fareType)}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Fare Display */}
        {selectedRoute && getFareAmount() > 0 && (
          <Card className="p-4 mb-4 bg-conductor/5 border-conductor/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Official Fare</span>
              <Badge variant="outline" className="bg-background">
                {getFareTypeLabel(fareType)}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold">KES {getFareAmount()}</span>
              <span className="text-muted-foreground">per passenger</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-conductor">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Fare is locked and cannot be changed</span>
            </div>
          </Card>
        )}

        {/* Matatu Capacity Display */}
        {selectedMatatu && (
          <Card className="p-6 mb-4 bg-conductor/5 border-conductor/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Matatu Capacity</span>
              <Badge className="bg-conductor text-conductor-foreground">
                {selectedMatatu.capacity} passengers
              </Badge>
            </div>
            <div className="text-2xl font-bold text-conductor mb-2">
              Fixed at {selectedMatatu.capacity} passengers
            </div>
            <div className="text-sm text-muted-foreground">
              Using full matatu capacity for trip calculation
            </div>
          </Card>
        )}

        {/* Total Display */}
        {selectedMatatu && selectedRoute && getFareAmount() > 0 && (
          <Card className="p-6 mb-4 bg-accent/5 border-accent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Amount</span>
              <Badge className="bg-accent text-accent-foreground">
                {selectedMatatu.capacity} passengers
              </Badge>
            </div>
            <div className="text-4xl font-bold text-accent mb-2">
              KES {calculateTotal().toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedMatatu.capacity} × KES {getFareAmount()} = KES {calculateTotal().toLocaleString()}
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          className="w-full h-14 text-lg font-semibold"
          onClick={handleSubmit}
          disabled={!selectedRoute || !selectedMatatu || !selectedDriver || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Trip
            </>
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => navigate('/trips')}
        >
          View Trip Log
        </Button>

        {/* Wallet Section */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">My Wallet</h2>
          </div>
          {walletBalance !== null ? (
            <>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-bold text-primary">KES {walletBalance.toLocaleString()}</div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                  className="w-full"
                >
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Loading wallet...</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Conductor;
