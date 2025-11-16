import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, RefreshCw, Smartphone, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/api';

interface Payment {
  id: string;
  tripId: string;
  mpesaRequestId?: string;
  mpesaReceipt?: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'received' | 'failed';
  createdAt: string;
  trip: {
    id: string;
    route: {
      name: string;
    };
    matatu: {
      plateNumber: string;
    };
    totalAmount: number;
    passengerCount: number;
    tripDate: string;
  };
}

interface Trip {
  id: string;
  route: {
    name: string;
  };
  matatu: {
    plateNumber: string;
  };
  totalAmount: number;
  passengerCount: number;
  tripDate: string;
  payments: Payment[];
}

const MPesa = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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
      const tripsData = await api<Trip[]>('/trips');
      setTrips(tripsData);
      
      // Extract all payments from trips
      const allPayments: Payment[] = [];
      tripsData.forEach(trip => {
        if (trip.payments && trip.payments.length > 0) {
          allPayments.push(...trip.payments);
        }
      });
      setPayments(allPayments);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedTrip || !phoneNumber) {
      toast.error('Please select a trip and enter phone number');
      return;
    }

    try {
      setInitiating(selectedTrip.id);
      const result = await api('/mpesa/initiate', {
        method: 'POST',
        body: {
          tripId: selectedTrip.id,
          phoneNumber,
          amount: selectedTrip.totalAmount,
        },
      });

      toast.success('Payment request sent! Check your phone to complete payment.');
      setShowPaymentDialog(false);
      setPhoneNumber('');
      setSelectedTrip(null);
      
      // Reload after a delay to check payment status
      setTimeout(() => {
        loadData();
      }, 3000);
    } catch (error: any) {
      toast.error(`Failed to initiate payment: ${error.message}`);
    } finally {
      setInitiating(null);
    }
  };

  const handleCheckStatus = async (mpesaRequestId: string) => {
    try {
      const payment = await api<Payment>(`/mpesa/status/${mpesaRequestId}`);
      toast.success(`Payment status: ${payment.status}`);
      loadData();
    } catch (error: any) {
      toast.error(`Failed to check status: ${error.message}`);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received':
        return {
          icon: CheckCircle,
          color: 'text-accent',
          bg: 'bg-accent/10',
          border: 'border-accent/20',
          label: 'Payment Received',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
          label: 'Payment Failed',
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-border',
          label: 'Pending Payment',
        };
    }
  };

  // Get trips without payments or with pending payments
  const tripsNeedingPayment = trips.filter(trip => {
    const hasPayment = trip.payments && trip.payments.length > 0;
    const hasReceivedPayment = trip.payments?.some(p => p.status === 'received');
    return !hasPayment || (!hasReceivedPayment && trip.payments?.some(p => p.status === 'pending'));
  });

  const receivedCount = payments.filter(p => p.status === 'received').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

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
            <h1 className="text-xl font-bold">MPesa Payment Status</h1>
            <p className="text-sm text-muted-foreground">Track till payments</p>
          </div>
          {tripsNeedingPayment.length > 0 && (
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowPaymentDialog(true)}>
                  Initiate Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate MPesa Payment</DialogTitle>
                  <DialogDescription>
                    Select a trip and enter the customer's phone number to send a payment request.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Trip</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={selectedTrip?.id || ''}
                      onChange={(e) => {
                        const trip = tripsNeedingPayment.find(t => t.id === e.target.value);
                        setSelectedTrip(trip || null);
                      }}
                    >
                      <option value="">Choose a trip...</option>
                      {tripsNeedingPayment.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.route.name} - KES {trip.totalAmount.toLocaleString()} - {new Date(trip.tripDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedTrip && (
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground mb-1">Amount</div>
                      <div className="text-2xl font-bold">KES {selectedTrip.totalAmount.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <Label>Customer Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleInitiatePayment}
                    disabled={!selectedTrip || !phoneNumber || initiating !== null}
                  >
                    {initiating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Payment Request'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Till Info Card */}
        <Card className="p-6 mb-6 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Smartphone className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">MPesa STK Push</h3>
              <div className="text-2xl font-bold text-accent mb-2">Payment on Demand</div>
              <p className="text-sm text-muted-foreground">
                Initiate payment requests that customers can complete on their phones
              </p>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-accent/5 border-accent/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {receivedCount}
              </div>
              <div className="text-sm text-muted-foreground">Received</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {pendingCount}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </Card>
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive mb-1">
                {failedCount}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </Card>
        </div>

        {/* Payment List */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No payments recorded yet</p>
            </Card>
          ) : (
            payments.map((payment) => {
              const status = getStatusConfig(payment.status);
              const StatusIcon = status.icon;

              return (
                <Card key={payment.id} className={`p-6 ${status.bg} ${status.border}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${status.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{payment.trip.route.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${status.bg} ${status.border}`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <p className="font-bold">KES {payment.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Passengers</span>
                      <p className="font-bold">{payment.trip.passengerCount}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <p className="font-bold text-sm">{payment.phoneNumber}</p>
                    </div>
                  </div>

                  {payment.status === 'received' && payment.mpesaReceipt && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">MPesa Receipt</span>
                        <span className="font-mono font-bold">{payment.mpesaReceipt}</span>
                      </div>
                    </div>
                  )}

                  {payment.status === 'pending' && payment.mpesaRequestId && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCheckStatus(payment.mpesaRequestId!)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Check Status
                      </Button>
                    </div>
                  )}

                  {payment.status === 'failed' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const trip = trips.find(t => t.id === payment.tripId);
                        if (trip) {
                          setSelectedTrip(trip);
                          setShowPaymentDialog(true);
                        }
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Payment
                    </Button>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MPesa;
