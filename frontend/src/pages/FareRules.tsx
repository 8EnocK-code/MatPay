import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  distance?: number;
  fareRules: {
    id: string;
    fareType: 'normal' | 'rush_hour' | 'off_peak' | 'rain';
    amount: number;
  }[];
}

const FareRules = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showEditFare, setShowEditFare] = useState(false);
  const [editingFareRule, setEditingFareRule] = useState<{ fareType: string; amount: number } | null>(null);

  // Form state for creating route
  const [newRoute, setNewRoute] = useState({
    name: '',
    from: '',
    to: '',
    distance: '',
    fareRules: {
      normal: '',
      rush_hour: '',
      off_peak: '',
      rain: '',
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/');
      return;
    }

    loadRoutes();
  }, [navigate]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const routesData = await api<Route[]>('/routes');
      setRoutes(routesData);
      if (routesData.length > 0 && !selectedRoute) {
        setSelectedRoute(routesData[0]);
      }
    } catch (error: any) {
      toast.error(`Failed to load routes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!newRoute.name || !newRoute.from || !newRoute.to) {
      toast.error('Please fill in route name, from, and to');
      return;
    }

    const fareRules = Object.entries(newRoute.fareRules)
      .filter(([_, amount]) => amount && parseFloat(amount) > 0)
      .map(([fareType, amount]) => ({
        fareType,
        amount: parseFloat(amount),
      }));

    if (fareRules.length === 0) {
      toast.error('Please add at least one fare rule');
      return;
    }

    try {
      await api('/routes', {
        method: 'POST',
        body: {
          name: newRoute.name,
          from: newRoute.from,
          to: newRoute.to,
          distance: newRoute.distance ? parseFloat(newRoute.distance) : null,
          fareRules,
        },
      });

      toast.success('Route created successfully');
      setShowCreateRoute(false);
      setNewRoute({
        name: '',
        from: '',
        to: '',
        distance: '',
        fareRules: {
          normal: '',
          rush_hour: '',
          off_peak: '',
          rain: '',
        },
      });
      await loadRoutes();
    } catch (error: any) {
      toast.error(`Failed to create route: ${error.message}`);
    }
  };

  const isAdmin = user?.role === 'sacco' || user?.role === 'admin';

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
              <h1 className="text-xl font-bold">Fare Rules</h1>
              <p className="text-sm text-muted-foreground">Official pricing configuration</p>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={showCreateRoute} onOpenChange={setShowCreateRoute}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Route
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Route</DialogTitle>
                  <DialogDescription>
                    Add a new route with fare rules for different fare types.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Route Name</Label>
                    <Input
                      placeholder="CBD - Ongata Rongai"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From</Label>
                      <Input
                        placeholder="CBD"
                        value={newRoute.from}
                        onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>To</Label>
                      <Input
                        placeholder="Ongata Rongai"
                        value={newRoute.to}
                        onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Distance (km) - Optional</Label>
                    <Input
                      type="number"
                      placeholder="25.5"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Fare Rules</Label>
                    <div>
                      <Label className="text-xs">Normal Fare</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newRoute.fareRules.normal}
                        onChange={(e) =>
                          setNewRoute({
                            ...newRoute,
                            fareRules: { ...newRoute.fareRules, normal: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rush Hour Fare</Label>
                      <Input
                        type="number"
                        placeholder="120"
                        value={newRoute.fareRules.rush_hour}
                        onChange={(e) =>
                          setNewRoute({
                            ...newRoute,
                            fareRules: { ...newRoute.fareRules, rush_hour: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Off-Peak Fare</Label>
                      <Input
                        type="number"
                        placeholder="80"
                        value={newRoute.fareRules.off_peak}
                        onChange={(e) =>
                          setNewRoute({
                            ...newRoute,
                            fareRules: { ...newRoute.fareRules, off_peak: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rain Fare</Label>
                      <Input
                        type="number"
                        placeholder="150"
                        value={newRoute.fareRules.rain}
                        onChange={(e) =>
                          setNewRoute({
                            ...newRoute,
                            fareRules: { ...newRoute.fareRules, rain: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreateRoute}>
                    Create Route
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Protection Notice */}
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Fare Protection Active</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Conductors cannot manually enter fare amounts. All fares are locked based on route
                and time of day to prevent manipulation.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  Only authorized admins can modify fare rules
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Route Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Select Route</h2>
          {routes.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No routes available</p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => setShowCreateRoute(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Route
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {routes.map((route) => (
                <Card
                  key={route.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedRoute?.id === route.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{route.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {route.from} → {route.to}
                      </p>
                      {route.distance && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {route.distance} km
                        </p>
                      )}
                    </div>
                    {selectedRoute?.id === route.id && (
                      <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Fare Breakdown */}
        {selectedRoute && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">
              Fare Structure: {selectedRoute.name}
            </h2>

            <div className="space-y-4">
              {selectedRoute.fareRules.map((fareRule) => {
                const fareTypeLabels: Record<string, string> = {
                  normal: 'Normal Fare',
                  rush_hour: 'Rush Hour Fare',
                  off_peak: 'Off-Peak Fare',
                  rain: 'Rain Fare',
                };

                const fareTypeBadges: Record<string, { label: string; className: string }> = {
                  normal: { label: 'Default', className: 'bg-primary/10 text-primary border-primary/20' },
                  rush_hour: { label: 'Peak', className: 'bg-destructive/10 text-destructive border-destructive/20' },
                  off_peak: { label: 'Discount', className: 'bg-accent/10 text-accent border-accent/20' },
                  rain: { label: 'Weather', className: 'bg-secondary/10 text-secondary border-secondary/20' },
                };

                const badge = fareTypeBadges[fareRule.fareType] || { label: '', className: '' };

                return (
                  <div key={fareRule.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{fareTypeLabels[fareRule.fareType]}</span>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      KES {fareRule.amount}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fareRule.fareType === 'normal' && 'Standard fare for regular hours (10am - 5pm)'}
                      {fareRule.fareType === 'rush_hour' && 'Peak hours: 6am - 10am & 5pm - 8pm'}
                      {fareRule.fareType === 'off_peak' && 'Late hours & weekends after 8pm'}
                      {fareRule.fareType === 'rain' && 'Activated during heavy rain conditions'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Admin Note */}
        {!isAdmin && (
          <Card className="p-4 mt-6 bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              🔒 Fare modifications require SACCO admin authentication
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FareRules;
