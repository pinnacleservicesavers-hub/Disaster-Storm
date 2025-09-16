import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn, CountUp, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';

interface KPIProps {
  label: string;
  value: number | string;
  change?: string;
  color?: 'default' | 'green' | 'blue' | 'amber' | 'red';
  suffix?: string;
  testId: string;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  testId: string;
}

interface DashboardSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  kpis: KPIProps[];
  actions: ActionButtonProps[];
  children: ReactNode;
  testId: string;
}

const KPICard: React.FC<KPIProps> = ({ label, value, change, color = 'default', suffix = '', testId }) => {
  const colorClasses = {
    default: 'text-gray-900 dark:text-gray-100',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400'
  };

  return (
    <HoverLift>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-100/20 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-indigo-900/20" />
        <CardHeader className="relative pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className={`text-2xl font-bold ${colorClasses[color]}`} data-testid={testId}>
            {typeof value === 'number' ? (
              <>
                <CountUp end={value} />
                {suffix}
              </>
            ) : (
              value
            )}
          </div>
          {change && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{change}</p>
          )}
        </CardContent>
      </Card>
    </HoverLift>
  );
};

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  kpis,
  actions,
  children,
  testId
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6">
      <FadeIn>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <StaggerContainer className="mb-8">
            <StaggerItem>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-lg opacity-30 -z-10" />
                  </motion.div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid={`${testId}-title`}>
                        {title}
                      </h1>
                      {badge && (
                        <Badge variant={badge.variant || 'default'} className="text-sm">
                          {badge.text}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                      className="flex items-center space-x-2"
                      data-testid={action.testId}
                    >
                      <action.icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* KPI Grid */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => (
              <StaggerItem key={index}>
                <KPICard {...kpi} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Main Content */}
          <FadeIn delay={0.3}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              {children}
            </div>
          </FadeIn>
        </div>
      </FadeIn>
    </div>
  );
};