import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, ClipboardList, User, Building2 } from "lucide-react";
import { RoleCard } from "@/components/RoleCard";
import { MatatuLogo } from "@/components/MatatuLogo";
import type { UserRole } from "@/types/matatu";


/**
 * Role-selection landing page.
 * Clicking a role navigates to /login/:role where the real login form is shown.
 *
 * Replace your existing Login.tsx file with this content.
 */

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    // Navigate to dedicated login form for that role
    navigate(`/login/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MatatuLogo size={64} showText={true} />
          </div>
          <h1 className="text-4xl font-bold mb-2">Matatu Revenue Manager</h1>
          <p className="text-muted-foreground text-lg">
            Transparent fare management for modern matatus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleCard
            icon={ClipboardList}
            title="Conductor"
            description="Record passenger fares with locked pricing"
            roleColor="text-conductor border-conductor"
            onClick={() => handleRoleSelect("conductor")}
          />
          <RoleCard
            icon={Bus}
            title="Driver"
            description="Monitor real-time revenue and trips"
            roleColor="text-driver border-driver"
            onClick={() => handleRoleSelect("driver")}
          />
          <RoleCard
            icon={User}
            title="Owner"
            description="View analytics and revenue splits"
            roleColor="text-owner border-owner"
            onClick={() => handleRoleSelect("owner")}
          />
          <RoleCard
            icon={Building2}
            title="SACCO Admin"
            description="Manage fleet and performance metrics"
            roleColor="text-sacco border-sacco"
            onClick={() => handleRoleSelect("sacco")}
          />
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Demo version • All roles accessible</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
