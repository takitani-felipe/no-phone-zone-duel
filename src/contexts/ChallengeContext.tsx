
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ChallengeType = {
  id: string;
  createdBy: string;
  duration: number;
  reward: string;
  participants: {
    [key: string]: {
      name: string;
      reward: string;
      status: 'waiting' | 'active' | 'lost' | 'won';
    }
  };
  status: 'waiting' | 'active' | 'completed';
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
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

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
    navigate(`/invite/${challengeId}`);
    
    return challengeId;
  };

  const joinChallenge = (challengeId: string, name: string, reward: string) => {
    if (challenge && challenge.id === challengeId) {
      // If this challenge already exists, add the participant
      const userId = generateId();
      
      const updatedChallenge = {
        ...challenge,
        participants: {
          ...challenge.participants,
          [userId]: {
            name,
            reward,
            status: 'waiting'
          }
        }
      };
      
      setChallenge(updatedChallenge);
      setParticipantId(userId);
      navigate(`/waiting/${challengeId}`);
    } else {
      // If we don't have this challenge stored, create a new one
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
        status: 'active'
      };
    });

    const updatedChallenge = {
      ...challenge,
      status: 'active',
      startTime: now,
      endTime,
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
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
        status: 'lost'
      },
      [otherParticipantId]: {
        ...challenge.participants[otherParticipantId],
        status: 'won'
      }
    };
    
    const updatedChallenge = {
      ...challenge,
      status: 'completed',
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
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
          status: 'won'
        };
      }
    });

    const updatedChallenge = {
      ...challenge,
      status: 'completed',
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
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
