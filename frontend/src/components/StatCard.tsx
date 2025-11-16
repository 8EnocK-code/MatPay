import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export const StatCard = ({ icon: Icon, label, value, subtext, className }: StatCardProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
        {subtext && (
          <p className="text-sm text-muted-foreground mt-2">{subtext}</p>
        )}
      </div>
    </Card>
  );
};
