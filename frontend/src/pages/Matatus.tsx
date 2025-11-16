import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bus, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/api';

interface Matatu {
  id: string;
  plateNumber: string;
  model?: string;
  capacity: number;
  owner: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
}

const Matatus = () => {
  const navigate = useNavigate();
  const [matatus, setMatatus] = useState<Matatu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [newMatatu, setNewMatatu] = useState({
    plateNumber: '',
    model: '',
    capacity: '14',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }

    loadMatatus();
  }, [navigate]);

  const loadMatatus = async () => {
    try {
      setLoading(true);
      const matatusData = await api<Matatu[]>('/matatus');
      setMatatus(matatusData);
    } catch (error: any) {
      toast.error(`Failed to load matatus: ${error.message}`);
      if (error.message.includes('Unauthorized')) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMatatu = async () => {
    if (!newMatatu.plateNumber) {
      toast.error('Please enter plate number');
      return;
    }

    try {
      setRegistering(true);
      await api('/matatus', {
        method: 'POST',
        body: {
          plateNumber: newMatatu.plateNumber,
          model: newMatatu.model || null,
          capacity: parseInt(newMatatu.capacity) || 14,
        },
      });

      toast.success('Matatu registered successfully');
      setShowRegister(false);
      setNewMatatu({
        plateNumber: '',
        model: '',
        capacity: '14',
      });
      await loadMatatus();
    } catch (error: any) {
      toast.error(`Failed to register matatu: ${error.message}`);
    } finally {
      setRegistering(false);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Matatu Management</h1>
              <p className="text-sm text-muted-foreground">Register and manage your fleet</p>
            </div>
          </div>
          <Dialog open={showRegister} onOpenChange={setShowRegister}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Register Matatu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Matatu</DialogTitle>
                <DialogDescription>
                  Add a new matatu to your fleet. Only owners can register matatus.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Plate Number *</Label>
                  <Input
                    placeholder="KCA 123A"
                    value={newMatatu.plateNumber}
                    onChange={(e) => setNewMatatu({ ...newMatatu, plateNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label>Model (Optional)</Label>
                  <Input
                    placeholder="Toyota Hiace"
                    value={newMatatu.model}
                    onChange={(e) => setNewMatatu({ ...newMatatu, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    placeholder="14"
                    value={newMatatu.capacity}
                    onChange={(e) => setNewMatatu({ ...newMatatu, capacity: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Default: 14 passengers</p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleRegisterMatatu}
                  disabled={registering || !newMatatu.plateNumber}
                >
                  {registering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Matatu'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Matatus List */}
        {matatus.length === 0 ? (
          <Card className="p-8 text-center">
            <Bus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No matatus registered yet</p>
            <Button onClick={() => setShowRegister(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Register Your First Matatu
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matatus.map((matatu) => (
              <Card key={matatu.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Bus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{matatu.plateNumber}</h3>
                      {matatu.model && (
                        <p className="text-sm text-muted-foreground">{matatu.model}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-semibold">{matatu.capacity} passengers</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-semibold">{matatu.owner.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="font-semibold">
                      {new Date(matatu.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matatus;

