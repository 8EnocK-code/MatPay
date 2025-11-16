// frontend/src/components/WalletPanel.new.tsx
// Simple wallet component showing balance and withdrawal form
// Review and integrate into your pages as needed

import { useState, useEffect } from "react";
import { Wallet, ArrowDownCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api";

export function WalletPanel() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api<{ balance: number }>("/wallet/balance");
      setBalance(data.balance);
    } catch (err: any) {
      toast.error(`Failed to load balance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setWithdrawing(true);
      await api("/wallet/withdraw", {
        method: "POST",
        body: { amount, note: "Withdrawal request" },
      });
      toast.success(`Withdrawal request of KES ${amount} submitted`);
      setWithdrawAmount("");
      await loadBalance();
    } catch (err: any) {
      toast.error(`Failed to request withdrawal: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Wallet className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">My Wallet</h2>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
            <div className="text-4xl font-bold text-primary">KES {balance.toLocaleString()}</div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
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
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              {withdrawing ? "Processing..." : "Request Withdrawal"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

