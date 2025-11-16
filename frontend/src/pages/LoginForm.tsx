import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Phone, AlertCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/matatu";
import { ForgotPassword } from "@/components/ForgotPassword.new";

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+254|254|0)7\d{8}$/,
      "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    role: UserRole;
  };
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { role } = useParams<{ role?: string }>();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    const raw = localStorage.getItem("loginAttempts");
    return raw ? Number(raw) : 0;
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const lock = localStorage.getItem("loginLockout");
    if (!lock) return false;
    const dt = new Date(lock);
    return dt > new Date();
  });
  const [lockoutTime, setLockoutTime] = useState<Date | null>(() => {
    const lock = localStorage.getItem("loginLockout");
    return lock ? new Date(lock) : null;
  });

  const countdownInterval = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // If locked, start countdown interval to auto-unlock when expired
    if (isLocked && lockoutTime) {
      startCountdown();
    }
    return () => {
      stopCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, lockoutTime]);

  function startCountdown() {
    stopCountdown();
    countdownInterval.current = window.setInterval(() => {
      if (!lockoutTime) {
        stopCountdown();
        setIsLocked(false);
        localStorage.removeItem("loginLockout");
        return;
      }
      if (lockoutTime.getTime() <= Date.now()) {
        // Lockout expired
        stopCountdown();
        setIsLocked(false);
        setLoginAttempts(0);
        localStorage.removeItem("loginLockout");
        localStorage.removeItem("loginAttempts");
      }
    }, 1000);
  }

  function stopCountdown() {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  }

  // Normalizes to local Kenyan format: 0712345678
  const formatPhoneNumberToLocal = (phone: string): string => {
    if (!phone) return phone;
    // Remove non-digits except leading +
    const raw = phone.trim();
    const digits = raw.replace(/\D/g, "");

    // +2547xxxxxxxx => 07xxxxxxxx
    if (raw.startsWith("+254")) {
      return "0" + digits.slice(3);
    }

    // 2547xxxxxxxx => 07xxxxxxxx
    if (digits.length === 12 && digits.startsWith("254")) {
      return "0" + digits.slice(3);
    }

    // 07xxxxxxxx => already local
    if (digits.length === 10 && digits.startsWith("07")) {
      return digits;
    }

    // If user typed 7xxxxxxxxx (without 0) make it 07xxxxxxxx
    if (digits.length === 9 && digits.startsWith("7")) {
      return "0" + digits;
    }

    // fallback: return raw digits
    return digits;
  };

  const onSubmit = async (data: LoginFormData) => {
    // If locked, show remaining minutes
    if (isLocked && lockoutTime) {
      const remainingSeconds = Math.max(0, Math.ceil((lockoutTime.getTime() - Date.now()) / 1000));
      const minutes = Math.ceil(remainingSeconds / 60);
      toast.error(`Account temporarily locked. Try again in ${minutes} minute(s).`);
      return;
    }

    setLoading(true);
    setError("root", { message: "" });

    try {
      const formattedPhone = formatPhoneNumberToLocal(data.phoneNumber);

      // call backend
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        // If your api supports skipAuth, it will ignore attached tokens.
        // Otherwise this field will be ignored; it's safe to include.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        skipAuth: true,
        body: {
          phoneNumber: formattedPhone,
          password: data.password,
          role: role || undefined,
        },
      });

      // Successful login -> reset attempts & lock state
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginLockout");
      setIsLocked(false);
      setLockoutTime(null);

      // verify role if route expects a role
      const userRole = res.user.role?.toLowerCase();
      if (role && userRole !== role.toLowerCase()) {
        toast.error(`This account is registered as ${userRole}, not ${role}`);
        setLoading(false);
        return;
      }

      // store token & user using auth hook
      login(res.token, res.user);

      toast.success(`Welcome back, ${res.user.name || res.user.phoneNumber}!`);

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        // navigate to role dashboard (backend authoritative)
        const redirectPath = `/${userRole || role || "dashboard"}`;
        navigate(redirectPath);
      }, 100);
    } catch (err: any) {
      const message = err?.message || "Login failed. Please check your credentials.";

      // If server indicates rate limiting
      if (message.toLowerCase().includes("too many") || message.toLowerCase().includes("rate limit")) {
        toast.error("Too many login attempts. Please try again later.");
        setLoading(false);
        return;
      }

      // Increment attempts
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      localStorage.setItem("loginAttempts", String(attempts));

      if (attempts >= 5) {
        const lockoutMinutes = 15;
        const lockoutDate = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        setIsLocked(true);
        setLockoutTime(lockoutDate);
        localStorage.setItem("loginLockout", lockoutDate.toISOString());
        toast.error(`Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`);
        startCountdown();
      } else {
        // Surface the error to the form and toast
        setError("root", { message });
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleDisplayName = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  const lockoutRemainingMinutes = lockoutTime
    ? Math.max(0, Math.ceil((lockoutTime.getTime() - Date.now()) / 1000 / 60))
    : 0;

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <ForgotPassword
          onBack={() => setShowForgotPassword(false)}
          onSuccess={() => {
            setShowForgotPassword(false);
            toast.success("Password reset successful! Please login with your new password.");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Login as {roleDisplayName}</CardTitle>
          <CardDescription>Enter your phone number and password to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Global error */}
            {errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{(errors.root as any).message}</AlertDescription>
              </Alert>
            )}

            {/* Lockout alert */}
            {isLocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Account temporarily locked due to multiple failed attempts. Please try again in{" "}
                  {lockoutRemainingMinutes} minute{lockoutRemainingMinutes !== 1 ? "s" : ""}.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0712345678 or +254712345678"
                  className={`pl-10 ${errors.phoneNumber ? "border-destructive" : ""}`}
                  autoComplete="tel"
                  disabled={isLocked || loading}
                  {...register("phoneNumber")}
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  autoComplete="current-password"
                  disabled={isLocked || loading}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLocked || loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {loginAttempts > 0 && loginAttempts < 5 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {5 - loginAttempts} attempt{5 - loginAttempts !== 1 ? "s" : ""} remaining before account lockout
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLocked || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              <Shield className="w-4 h-4 mr-1" />
              Forgot Password?
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Need an account? Contact your SACCO administrator or use the backend{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">/auth/register</code> endpoint during development.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} disabled={loading}>
              ← Back to role selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
