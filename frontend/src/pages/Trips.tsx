import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/api';

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
  payments: {
    id: string;
    status: 'pending' | 'received' | 'failed';
    mpesaReceipt?: string;
  }[];
}

const Trips = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }

    loadTrips();
  }, [navigate]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const tripsData = await api<Trip[]>('/trips');
      setTrips(tripsData);
    } catch (error: any) {
      toast.error(`Failed to load trips: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) =>
    trip.route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.matatu.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaymentStatus = (trip: Trip): 'pending' | 'received' | 'failed' => {
    if (trip.payments && trip.payments.length > 0) {
      const received = trip.payments.find(p => p.status === 'received');
      if (received) return 'received';
      const failed = trip.payments.find(p => p.status === 'failed');
      if (failed) return 'failed';
      return 'pending';
    }
    return 'pending';
  };

  const getStatusIcon = (trip: Trip) => {
    const status = getPaymentStatus(trip);
    if (status === 'received') return <CheckCircle className="w-4 h-4 text-accent" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (trip: Trip) => {
    const status = getPaymentStatus(trip);
    if (status === 'received')
      return (
        <Badge className="bg-accent/10 text-accent border-accent/20">
          Received
        </Badge>
      );
    if (status === 'failed')
      return (
        <Badge variant="destructive">
          Failed
        </Badge>
      );
    return <Badge variant="outline">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Trip Log</h1>
            <p className="text-sm text-muted-foreground">View all trip records</p>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by route or matatu plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No trips found matching your search' : 'No trips recorded yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(trip)}
                    <div>
                      <h3 className="font-semibold">{trip.route.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.tripDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(trip)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <p className="font-bold">KES {trip.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Passengers</span>
                    <p className="font-bold">{trip.passengerCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Matatu</span>
                    <p className="font-bold text-sm">{trip.matatu.plateNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Fare Type</span>
                    <p className="font-bold text-sm capitalize">{trip.fareType.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Driver:</span>
                    <Badge variant={trip.driverConfirmed ? 'default' : 'outline'}>
                      {trip.driverConfirmed ? 'Confirmed' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Owner:</span>
                    <Badge variant={trip.ownerConfirmed ? 'default' : 'outline'}>
                      {trip.ownerConfirmed ? 'Confirmed' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="capitalize">
                      {trip.status}
                    </Badge>
                  </div>
                </div>

                {trip.payments && trip.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Payment Details</div>
                    {trip.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment {payment.id.substring(0, 8)}</span>
                        <Badge
                          variant={
                            payment.status === 'received'
                              ? 'default'
                              : payment.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {payment.status}
                        </Badge>
                        {payment.mpesaReceipt && (
                          <span className="font-mono text-xs">{payment.mpesaReceipt}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;
