
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ParticipantStatus = 'waiting' | 'active' | 'lost' | 'won';
type ChallengeStatus = 'waiting' | 'active' | 'completed';

type ChallengeType = {
  id: string;
  createdBy: string;
  duration: number;
  reward: string;
  participants: {
    [key: string]: {
      name: string;
      reward: string;
      status: ParticipantStatus;
    }
  };
  status: ChallengeStatus;
  startTime: number | null;
  endTime: number | null;
};

type ChallengeContextType = {
  challenge: ChallengeType | null;
  participantId: string | null;
  createChallenge: (name: string, duration: number, reward: string) => string;
  joinChallenge: (challengeId: string, name: string, reward: string) => void;
  startChallenge: () => void;
  handleLoss: () => void;
  resetChallenge: () => void;
};

const defaultContext: ChallengeContextType = {
  challenge: null,
  participantId: null,
  createChallenge: () => '',
  joinChallenge: () => {},
  startChallenge: () => {},
  handleLoss: () => {},
  resetChallenge: () => {},
};

const ChallengeContext = createContext<ChallengeContextType>(defaultContext);

export const useChallenge = () => useContext(ChallengeContext);

// Define key for storing challenges in localStorage
const CHALLENGE_STORE_KEY = 'all_challenges';

// Helper functions for managing localStorage
const getAllChallenges = (): Record<string, ChallengeType> => {
  const challengesJson = localStorage.getItem(CHALLENGE_STORE_KEY);
  return challengesJson ? JSON.parse(challengesJson) : {};
};

const updateChallenge = (challenge: ChallengeType) => {
  const allChallenges = getAllChallenges();
  allChallenges[challenge.id] = challenge;
  localStorage.setItem(CHALLENGE_STORE_KEY, JSON.stringify(allChallenges));
};

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load challenge from localStorage
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

  // Update localStorage when challenge changes
  useEffect(() => {
    if (challenge) {
      localStorage.setItem('challenge', JSON.stringify(challenge));
      // Also update the challenge in the shared store
      updateChallenge(challenge);
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

  // Poll for updates to the challenge
  useEffect(() => {
    if (!challenge || !challenge.id) return;

    // Don't poll if the challenge is completed or active
    if (challenge.status !== 'waiting') return;

    const checkForUpdates = () => {
      const allChallenges = getAllChallenges();
      const latestChallenge = allChallenges[challenge.id];
      
      if (latestChallenge && JSON.stringify(latestChallenge) !== JSON.stringify(challenge)) {
        // Preserve the current participant's information
        if (participantId && latestChallenge.participants) {
          // Make sure we don't lose our own participant data during sync
          if (!latestChallenge.participants[participantId] && challenge.participants[participantId]) {
            latestChallenge.participants[participantId] = challenge.participants[participantId];
          }
        }
        
        setChallenge(latestChallenge);
        
        // If challenge status changed to active, navigate to duel page
        if (latestChallenge.status === 'active' && challenge.status === 'waiting') {
          navigate(`/duel/${challenge.id}`);
          toast.success("Challenge started!");
        }
      }
    };

    const intervalId = setInterval(checkForUpdates, 2000); // Check every 2 seconds
    
    return () => clearInterval(intervalId);
  }, [challenge, participantId, navigate]);

  // Check if challenge is active and user left the page
  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || !participantId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && 
          challenge.status === 'active' && 
          challenge.participants[participantId].status === 'active') {
        handleLoss();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (challenge.status === 'active' && 
          challenge.participants[participantId].status === 'active') {
        e.preventDefault();
        e.returnValue = '';
        handleLoss();
        return '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [challenge, participantId]);

  // Check if challenge time has ended
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
  }, [challenge]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const createChallenge = (name: string, duration: number, reward: string) => {
    const challengeId = generateId();
    const userId = generateId();
    
    const newChallenge: ChallengeType = {
      id: challengeId,
      createdBy: userId,
      duration,
      reward: '',
      participants: {
        [userId]: {
          name,
          reward,
          status: 'waiting'
        }
      },
      status: 'waiting',
      startTime: null,
      endTime: null
    };
    
    setChallenge(newChallenge);
    setParticipantId(userId);
    updateChallenge(newChallenge); // Store in the shared challenge store
    navigate(`/invite/${challengeId}`);
    
    return challengeId;
  };

  const joinChallenge = (challengeId: string, name: string, reward: string) => {
    // Get challenge from the shared store
    const allChallenges = getAllChallenges();
    const existingChallenge = allChallenges[challengeId];
    
    if (existingChallenge) {
      // Add the participant
      const userId = generateId();
      const updatedChallenge: ChallengeType = {
        ...existingChallenge,
        participants: {
          ...existingChallenge.participants,
          [userId]: {
            name,
            reward,
            status: 'waiting' as ParticipantStatus
          }
        }
      };
      
      setChallenge(updatedChallenge);
      setParticipantId(userId);
      updateChallenge(updatedChallenge); // Update the shared store
      navigate(`/waiting/${challengeId}`);
    } else {
      // We don't have the challenge stored, create a temporary one
      const userId = generateId();
      
      const newChallenge: ChallengeType = {
        id: challengeId,
        createdBy: userId, // Temp creator until the real one connects
        duration: 60, // Default duration of 60 minutes
        reward: '',
        participants: {
          [userId]: {
            name,
            reward,
            status: 'waiting'
          }
        },
        status: 'waiting',
        startTime: null,
        endTime: null
      };
      
      setChallenge(newChallenge);
      setParticipantId(userId);
      updateChallenge(newChallenge); // Store in the shared challenge store
      navigate(`/waiting/${challengeId}`);
    }
  };

  const startChallenge = () => {
    if (!challenge) return;
    
    const now = Date.now();
    const endTime = now + (challenge.duration * 60 * 1000);
    
    const updatedParticipants = { ...challenge.participants };
    Object.keys(updatedParticipants).forEach(id => {
      updatedParticipants[id] = {
        ...updatedParticipants[id],
        status: 'active' as ParticipantStatus
      };
    });

    const updatedChallenge: ChallengeType = {
      ...challenge,
      status: 'active' as ChallengeStatus,
      startTime: now,
      endTime,
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
    updateChallenge(updatedChallenge); // Update the shared store
    navigate(`/duel/${challenge.id}`);
  };

  const handleLoss = () => {
    if (!challenge || !participantId) return;
    
    // Find the other participant
    const otherParticipantId = Object.keys(challenge.participants).find(id => id !== participantId);
    
    if (!otherParticipantId) return;
    
    // Update status for both participants
    const updatedParticipants = {
      ...challenge.participants,
      [participantId]: {
        ...challenge.participants[participantId],
        status: 'lost' as ParticipantStatus
      },
      [otherParticipantId]: {
        ...challenge.participants[otherParticipantId],
        status: 'won' as ParticipantStatus
      }
    };
    
    const updatedChallenge: ChallengeType = {
      ...challenge,
      status: 'completed' as ChallengeStatus,
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
    updateChallenge(updatedChallenge); // Update the shared store
    navigate(`/results/${challenge.id}`);
    toast.error("You looked at your phone! You lost the challenge.");
  };

  const completeChallenge = () => {
    if (!challenge) return;
    
    // Everyone who is still active has won
    const updatedParticipants = { ...challenge.participants };
    Object.keys(updatedParticipants).forEach(id => {
      if (updatedParticipants[id].status === 'active') {
        updatedParticipants[id] = {
          ...updatedParticipants[id],
          status: 'won' as ParticipantStatus
        };
      }
    });

    const updatedChallenge: ChallengeType = {
      ...challenge,
      status: 'completed' as ChallengeStatus,
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
    updateChallenge(updatedChallenge); // Update the shared store
    navigate(`/results/${challenge.id}`);
    toast.success("Challenge completed successfully!");
  };

  const resetChallenge = () => {
    setChallenge(null);
    setParticipantId(null);
    localStorage.removeItem('challenge');
    localStorage.removeItem('participantId');
    navigate('/');
  };

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
