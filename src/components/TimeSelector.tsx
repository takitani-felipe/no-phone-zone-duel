
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface TimeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const handleChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Duration</span>
        <span className="font-bold text-lg bg-duel-gradient bg-clip-text text-transparent">
          {value} {value === 1 ? 'minute' : 'minutes'}
        </span>
      </div>
      
      <Slider
        defaultValue={[value]}
        max={120}
        min={5}
        step={5}
        onValueChange={handleChange}
        className="py-4"
      />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>5m</span>
        <span>30m</span>
        <span>60m</span>
        <span>120m</span>
      </div>
    </div>
  );
};

export default TimeSelector;
