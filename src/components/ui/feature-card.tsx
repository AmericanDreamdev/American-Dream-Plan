import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  className 
}) => {
  return (
    <div className={cn("feature-card-3d", className)}>
      <div className="feature-card-3d-content">
        <p className="feature-card-title">{title}</p>
        <p className="feature-card-para">{description}</p>
      </div>
    </div>
  );
};

