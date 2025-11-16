import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  roleColor: string;
  onClick: () => void;
}

export const RoleCard = ({ icon: Icon, title, description, roleColor, onClick }: RoleCardProps) => {
  return (
    <Card
      className={cn(
        "p-6 cursor-pointer transition-all hover:scale-105 active:scale-95",
        "border-2 hover:border-current hover:shadow-lg",
        roleColor
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-4 rounded-full bg-background/80">
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </Card>
  );
};
