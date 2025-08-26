import {
  Calendar,
  CheckSquare,
  DollarSign,
  Plus,
  ShoppingCart,
  ChefHat,
  Target,
  BookOpen,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface FeatureConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  path: string;
}

export const PRIMARY_FEATURES: FeatureConfig[] = [
  {
    title: 'Task Manager',
    description: 'Organize your tasks with boards and lists',
    icon: CheckSquare,
    color: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    path: '/tasks',
  },
  {
    title: 'Shopping Hub',
    description: 'Manage your shopping and grocery lists',
    icon: ShoppingCart,
    color: 'border-l-green-500',
    bgColor: 'bg-green-50',
    path: '/shopping',
  },
  {
    title: 'Meal Planner',
    description: 'Plan your weekly meals and recipes',
    icon: ChefHat,
    color: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
    path: '/meals',
  },
  {
    title: 'Budget Tracker',
    description: 'Track your expenses and income',
    icon: DollarSign,
    color: 'border-l-purple-500',
    bgColor: 'bg-purple-50',
    path: '/budget',
  },
];

export const SECONDARY_FEATURES: FeatureConfig[] = [
  {
    title: 'Calendar',
    description: 'Manage your schedule and events',
    icon: Calendar,
    color: 'border-l-indigo-500',
    bgColor: 'bg-indigo-50',
    path: '/calendar',
  },
  {
    title: 'Goals Tracker',
    description: 'Track your personal goals and milestones',
    icon: Target,
    color: 'border-l-teal-500',
    bgColor: 'bg-teal-50',
    path: '/goals',
  },
  {
    title: 'Digital Journal',
    description: 'Capture memories and thoughts',
    icon: BookOpen,
    color: 'border-l-pink-500',
    bgColor: 'bg-pink-50',
    path: '/journal',
  },
  {
    title: 'Habit Tracker',
    description: 'Build good habits and track your progress',
    icon: TrendingUp,
    color: 'border-l-rose-500',
    bgColor: 'bg-rose-50',
    path: '/habits',
  },
  {
    title: 'Quick Add',
    description: 'Quick actions and shortcuts',
    icon: Plus,
    color: 'border-l-gray-500',
    bgColor: 'bg-gray-50',
    path: 'quick-add', // Special path to be handled differently
  },
];
