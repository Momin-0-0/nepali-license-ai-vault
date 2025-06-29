
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      <Button onClick={onAction} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
        {actionLabel}
      </Button>
    </div>
  );
};

export default EmptyState;
