
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useChallenge } from '@/contexts/ChallengeContext';

interface CountdownProps {
  className?: string;
}

const Countdown: React.FC<CountdownProps> = ({ className }) => {
  const { challenge } = useChallenge();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [progressValue, setProgressValue] = useState(100);

  useEffect(() => {
    if (!challenge || !challenge.startTime || !challenge.endTime) return;

    const updateTime = () => {
      const now = Date.now();
      const endTime = challenge.endTime as number;
      const totalDuration = challenge.duration * 60 * 1000;
      const elapsed = now - (challenge.startTime as number);
      const remaining = Math.max(0, endTime - now);
      
      // Calculate minutes and seconds
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      // Calculate progress percentage
      const percentage = Math.max(0, Math.min(100, 100 - (elapsed / totalDuration * 100)));
      
      setTimeLeft({ minutes, seconds });
      setProgressValue(percentage);

      return remaining <= 0;
    };

    // Update immediately
    const isFinished = updateTime();
    if (isFinished) return;

    // Then update every second
    const interval = setInterval(() => {
      const isFinished = updateTime();
      if (isFinished) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const formattedTime = `${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="text-center">
        <span className="text-4xl font-bold bg-duel-gradient bg-clip-text text-transparent">
          {formattedTime}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2 bg-gray-200"
      />
    </div>
  );
};

export default Countdown;
