
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChallengeType, ChallengeContextType } from './types';
import { 
  createChallengeAction, 
  startChallengeAction, 
  handleLossAction, 
  completeChallengeAction, 
  joinChallengeAction 
} from './challengeUtils';
import { 
  useLocalStorage,
  useSupabaseUpdates,
  useActivityMonitor,
  useChallengeTimer
} from './hooks';

const defaultContext: ChallengeContextType = {
  challenge: null,
  participantId: null,
  createChallenge: async () => '',
  joinChallenge: async () => {},
  startChallenge: async () => {},
  handleLoss: async () => {},
  resetChallenge: () => {},
};

const ChallengeContext = createContext<ChallengeContextType>(defaultContext);

export const useChallenge = () => useContext(ChallengeContext);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    challenge, 
    participantId, 
    setStoredChallenge, 
    setStoredParticipantId 
  } = useLocalStorage();
  
  // Set up handlers for challenge actions
  const createChallenge = async (name: string, duration: number, reward: string): Promise<string> => {
    return createChallengeAction(name, duration, reward, setStoredChallenge, setStoredParticipantId);
  };

  const joinChallenge = async (challengeId: string, name: string, reward: string) => {
    // Import the getChallenge function from challengeApi
    const { getChallenge } = await import('./challengeApi');
    
    return joinChallengeAction(
      challengeId, 
      name, 
      reward, 
      setStoredChallenge, 
      setStoredParticipantId, 
      navigate,
      getChallenge // Add the missing 7th argument
    );
  };

  const startChallenge = async () => {
    if (!challenge) return;
    return startChallengeAction(challenge, setStoredChallenge, navigate);
  };

  const handleLoss = async () => {
    if (!challenge || !participantId) return;
    return handleLossAction(challenge, participantId, setStoredChallenge, navigate);
  };

  const completeChallenge = async () => {
    if (!challenge) return;
    return completeChallengeAction(challenge, setStoredChallenge, navigate);
  };

  const resetChallenge = () => {
    setStoredChallenge(null);
    setStoredParticipantId(null);
    navigate('/');
  };

  // Set up hooks for real-time updates, activity monitoring, and challenge timer
  useSupabaseUpdates(challenge, participantId, setStoredChallenge);
  useActivityMonitor(challenge, participantId, handleLoss);
  useChallengeTimer(challenge, completeChallenge);

  return (
    <ChallengeContext.Provider
      value={{
        challenge,
        participantId,
        createChallenge,
        joinChallenge,
        startChallenge,
        handleLoss,
        resetChallenge
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export default ChallengeProvider;
