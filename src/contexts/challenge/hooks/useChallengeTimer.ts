
import { useEffect } from 'react';
import { ChallengeType } from '../types';

export const useChallengeTimer = (
  challenge: ChallengeType | null,
  completeChallenge: () => Promise<void>
) => {
  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || !challenge.endTime) return;

    const timeRemaining = challenge.endTime - Date.now();
    
    if (timeRemaining <= 0) {
      completeChallenge();
      return;
    }

    const timer = setTimeout(() => {
      completeChallenge();
    }, timeRemaining);

    return () => clearTimeout(timer);
  }, [challenge, completeChallenge]);
};
