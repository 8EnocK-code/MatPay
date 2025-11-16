// frontend/src/components/ForgotPassword.new.tsx
// Forgot password component with OTP verification

import { useState } from "react";
import { Lock, Phone, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/api";
import { toast } from "sonner";

type Step = "request" | "verify" | "reset";

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>("request");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      setLoading(true);
      const response = await api<{ ok: boolean; message: string; otp?: string; token?: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: { phoneNumber },
        }
      );

      if (response.ok) {
        // In development, show OTP in console/response
        if (response.otp && response.token) {
          setToken(response.token);
          toast.success(`OTP sent! Check console for OTP: ${response.otp}`);
          console.log("OTP:", response.otp);
          console.log("Token:", response.token);
        } else {
          toast.success(response.message || "OTP sent to your phone");
        }
        setStep("verify");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const response = await api<{ ok: boolean; message: string; resetToken?: string }>(
        "/auth/verify-otp",
        {
          method: "POST",
          body: { phoneNumber, otp, token },
        }
      );

      if (response.ok) {
        if (response.resetToken) {
          setToken(response.resetToken);
        }
        toast.success("OTP verified successfully");
        setStep("reset");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await api<{ ok: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: { phoneNumber, token, newPassword },
      });

      if (response.ok) {
        toast.success("Password reset successfully! You can now login.");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Reset Password
        </CardTitle>
        <CardDescription>
          {step === "request" && "Enter your phone number to receive an OTP"}
          {step === "verify" && "Enter the 6-digit OTP sent to your phone"}
          {step === "reset" && "Enter your new password"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "request" && (
          <>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleRequestOTP} className="w-full" disabled={loading || !phoneNumber}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            <Alert>
              <AlertDescription>
                OTP has been sent to {phoneNumber}. Check your phone or console (in development mode).
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="mt-1 text-center text-2xl tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("request")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerifyOTP} className="flex-1" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("verify")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleResetPassword}
                className="flex-1"
                disabled={loading || !newPassword || newPassword !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </>
        )}

        <Button variant="ghost" onClick={onBack} className="w-full">
          Back to Login
        </Button>
      </CardContent>
    </Card>
  );
}

