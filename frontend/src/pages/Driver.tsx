import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, TrendingUp, Users, DollarSign, LogOut, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';

interface Trip {
  id: string;
  route: {
    id: string;
    name: string;
    from: string;
    to: string;
  };
  matatu: {
    id: string;
    plateNumber: string;
  };
  fareType: string;
  passengerCount: number;
  totalAmount: number;
  driverConfirmed: boolean;
  ownerConfirmed: boolean;
  status: string;
  tripDate: string;
  createdAt: string;
}

const Driver = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
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

    loadTrips();
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

  const loadTrips = async () => {
    try {
      setLoading(true);
      const tripsData = await api<Trip[]>('/trips');
      setTrips(tripsData);
    } catch (error: any) {
      toast.error(`Failed to load trips: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const todayTrips = trips.filter((t) => {
    const today = new Date();
    const tripDate = new Date(t.tripDate);
    return tripDate.toDateString() === today.toDateString();
  });

  const totalRevenue = todayTrips.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalPassengers = todayTrips.reduce((sum, t) => sum + t.passengerCount, 0);
  const unconfirmedTrips = todayTrips.filter((t) => !t.driverConfirmed).length;

  const dailyTarget = 15000;
  const targetProgress = (totalRevenue / dailyTarget) * 100;

  const handleConfirmTrip = async (tripId: string) => {
    try {
      setConfirming(tripId);
      await api(`/trips/${tripId}/confirm`, {
        method: 'POST',
      });
      toast.success('Trip confirmed successfully');
      await loadTrips(); // Reload trips to get updated status
    } catch (error: any) {
      toast.error(`Failed to confirm trip: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        logout();
        navigate('/');
      }
    } finally {
      setConfirming(null);
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
    <div className="min-h-screen bg-gradient-to-br from-driver/5 via-background to-driver/10">
      <div className="max-w-4xl mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-driver/10">
              <Bus className="w-6 h-6 text-driver" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Driver Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time revenue tracking</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={DollarSign}
            label="Today's Revenue"
            value={`KES ${totalRevenue.toLocaleString()}`}
            className="bg-driver/5 border-driver/20"
          />
          <StatCard
            icon={Users}
            label="Total Passengers"
            value={totalPassengers}
            subtext={`${todayTrips.length} trips completed`}
          />
          <StatCard
            icon={TrendingUp}
            label="Daily Target"
            value={`${Math.round(targetProgress)}%`}
            subtext={`KES ${(dailyTarget - totalRevenue).toLocaleString()} remaining`}
          />
        </div>

        {/* Daily Target Progress */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Daily Target Progress</span>
            <Badge variant="outline">
              KES {totalRevenue.toLocaleString()} / {dailyTarget.toLocaleString()}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className="bg-driver h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            />
          </div>
        </Card>

        {/* Recent Trips */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Trips</h2>
            {unconfirmedTrips > 0 && (
              <Badge variant="destructive">{unconfirmedTrips} pending</Badge>
            )}
          </div>

          {todayTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trips today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTrips.slice(0, 5).map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{trip.route.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {trip.fareType.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {trip.matatu.plateNumber}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.passengerCount} passengers • {new Date(trip.tripDate).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-lg font-bold">
                      KES {trip.totalAmount.toLocaleString()}
                    </div>
                    {trip.driverConfirmed ? (
                      <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => handleConfirmTrip(trip.id)}
                        disabled={confirming === trip.id}
                      >
                        {confirming === trip.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : null}
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/trips')}
          >
            View All Trips
          </Button>
        </Card>

        {/* Wallet Section */}
        <Card className="p-6 mb-6">
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

export default Driver;
