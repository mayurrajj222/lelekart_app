import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isUpward?: boolean;
    isNegative?: boolean;
  };
};

export function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {trend && (
            <div className={`flex items-center text-sm ${
              trend.isNegative 
                ? trend.isUpward ? 'text-red-500' : 'text-green-600'
                : trend.isUpward ? 'text-green-600' : 'text-red-500'
            }`}>
              {trend.isUpward ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}