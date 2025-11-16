// frontend/src/pages/OwnerWithdrawals.new.tsx
// Owner page to view and process withdrawal requests
// Review and integrate into Owner.tsx or use as separate route

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  requestedAt: string;
  processedAt?: string;
  note?: string;
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    role: string;
  };
}

export default function OwnerWithdrawals() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const data = await api<{ items: Withdrawal[] }>("/owner/withdrawals");
      setWithdrawals(data.items);
    } catch (err: any) {
      toast.error(`Failed to load withdrawals: ${err.message}`);
      if (err.message.includes("Unauthorized")) {
        logout();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, action: "approve" | "decline") => {
    try {
      setProcessing(id);
      await api(`/owner/withdrawals/${id}/process`, {
        method: "POST",
        body: { action },
      });
      toast.success(`Withdrawal ${action}d successfully`);
      await loadWithdrawals();
    } catch (err: any) {
      toast.error(`Failed to ${action} withdrawal: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "DECLINED":
        return <Badge className="bg-red-500">Declined</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
          <Badge>{pendingCount} Pending</Badge>
        </div>

        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No withdrawal requests found
            </Card>
          ) : (
            withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">{withdrawal.user.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {withdrawal.user.phoneNumber}
                      </span>
                      <Badge variant="outline">{withdrawal.user.role}</Badge>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      KES {withdrawal.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requested: {new Date(withdrawal.requestedAt).toLocaleString()}
                    </div>
                    {withdrawal.note && (
                      <div className="text-sm text-muted-foreground mt-1">Note: {withdrawal.note}</div>
                    )}
                  </div>
                  {withdrawal.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcess(withdrawal.id, "approve")}
                        disabled={processing === withdrawal.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleProcess(withdrawal.id, "decline")}
                        disabled={processing === withdrawal.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

