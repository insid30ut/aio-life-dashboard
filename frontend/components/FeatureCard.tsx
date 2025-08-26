import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  color,
  bgColor,
  onClick,
  variant = 'primary',
}: FeatureCardProps) {
  if (variant === 'secondary') {
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${color} ${bgColor}`}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 text-xs mt-1">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${color} ${bgColor}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
