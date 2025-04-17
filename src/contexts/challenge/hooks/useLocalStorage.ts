
import { useState, useEffect } from 'react';
import { ChallengeType } from '../types';

type StorageItems = {
  challenge: ChallengeType | null;
  participantId: string | null;
};

export const useLocalStorage = (): StorageItems & {
  setStoredChallenge: (challenge: ChallengeType | null) => void;
  setStoredParticipantId: (id: string | null) => void;
} => {
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedChallenge = localStorage.getItem('challenge');
    const storedParticipantId = localStorage.getItem('participantId');
    
    if (storedChallenge) {
      setChallenge(JSON.parse(storedChallenge));
    }
    
    if (storedParticipantId) {
      setParticipantId(storedParticipantId);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (challenge) {
      localStorage.setItem('challenge', JSON.stringify(challenge));
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

  const setStoredChallenge = (newChallenge: ChallengeType | null) => {
    setChallenge(newChallenge);
    if (newChallenge === null) {
      localStorage.removeItem('challenge');
    }
  };

  const setStoredParticipantId = (id: string | null) => {
    setParticipantId(id);
    if (id === null) {
      localStorage.removeItem('participantId');
    }
  };

  return { 
    challenge, 
    participantId, 
    setStoredChallenge, 
    setStoredParticipantId 
  };
};
