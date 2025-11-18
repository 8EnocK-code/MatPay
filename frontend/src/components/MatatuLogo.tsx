// frontend/src/components/MatatuLogo.tsx
// Matatu Logo Component

import { Bus } from "lucide-react";

interface MatatuLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function MatatuLogo({ size = 48, className = "", showText = false }: MatatuLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shadow-lg">
          <Bus className="text-primary-foreground" size={size} strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-foreground">MatatuPay</span>
          <span className="text-xs text-muted-foreground">Revenue Manager</span>
        </div>
      )}
    </div>
  );
}

// Simple icon-only version
export function MatatuIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
        <Bus className="text-primary-foreground" size={size} strokeWidth={2.5} />
      </div>
    </div>
  );
}

