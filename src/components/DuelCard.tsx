
import React from 'react';
import { Card } from '@/components/ui/card';

interface DuelCardProps {
  children: React.ReactNode;
  className?: string;
}

const DuelCard: React.FC<DuelCardProps> = ({ children, className }) => {
  return (
    <Card className={`p-6 shadow-lg border-2 border-duel-light ${className || ''}`}>
      {children}
    </Card>
  );
};

export default DuelCard;
