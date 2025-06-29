
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = "secondary",
  disabled = false
}: QuickActionCardProps) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="ghost"
        className={`
          h-auto w-full p-6 flex flex-col items-center justify-center gap-3 
          ${variant === "primary" 
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700" 
            : "hover:bg-muted/50"
          }
        `}
      >
        <div className={`
          p-3 rounded-full 
          ${variant === "primary" 
            ? "bg-white/20" 
            : "bg-primary/10"
          }
        `}>
          <Icon className={`w-6 h-6 ${variant === "primary" ? "text-white" : "text-primary"}`} />
        </div>
        <div className="text-center">
          <h3 className={`font-semibold ${variant === "primary" ? "text-white" : ""}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${variant === "primary" ? "text-white/80" : "text-muted-foreground"}`}>
              {description}
            </p>
          )}
        </div>
      </Button>
    </Card>
  );
};

export default QuickActionCard;
