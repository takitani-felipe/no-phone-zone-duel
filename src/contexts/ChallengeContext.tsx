
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

// Base URL for our mock server
const SERVER_BASE_URL = 'https://mockapi.lovable.dev/challenges';

// Helper functions for managing storage and syncing with mock server
const getAllChallenges = async (): Promise<Record<string, ChallengeType>> => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}`);
    if (!response.ok) {
      throw new Error('Failed to fetch challenges');
    }
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('Error fetching challenges:', error);
    // Fallback to local storage if server fails
    const challengesJson = localStorage.getItem(CHALLENGE_STORE_KEY);
    return challengesJson ? JSON.parse(challengesJson) : {};
  }
};

const getChallenge = async (challengeId: string): Promise<ChallengeType | null> => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/${challengeId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Challenge not found
      }
      throw new Error('Failed to fetch challenge');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching challenge ${challengeId}:`, error);
    // Fallback to local storage
    const allChallenges = localStorage.getItem(CHALLENGE_STORE_KEY);
    if (allChallenges) {
      const parsed = JSON.parse(allChallenges);
      return parsed[challengeId] || null;
    }
    return null;
  }
};

const updateChallenge = async (challenge: ChallengeType): Promise<void> => {
  if (!challenge || !challenge.id) return;
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/${challenge.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(challenge),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update challenge');
    }
    
    // Also update local cache
    const allChallenges = localStorage.getItem(CHALLENGE_STORE_KEY);
    const parsed = allChallenges ? JSON.parse(allChallenges) : {};
    parsed[challenge.id] = challenge;
    localStorage.setItem(CHALLENGE_STORE_KEY, JSON.stringify(parsed));
    
  } catch (error) {
    console.error('Error updating challenge:', error);
    toast.error("Failed to sync with server. Challenge may not update for others.");
    
    // Still update local cache as fallback
    const allChallenges = localStorage.getItem(CHALLENGE_STORE_KEY);
    const parsed = allChallenges ? JSON.parse(allChallenges) : {};
    parsed[challenge.id] = challenge;
    localStorage.setItem(CHALLENGE_STORE_KEY, JSON.stringify(parsed));
  }
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
      // Update the challenge in the shared store
      updateChallenge(challenge);
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

  // Poll for updates to the challenge
  useEffect(() => {
    if (!challenge || !challenge.id) return;

    const checkForUpdates = async () => {
      try {
        const latestChallenge = await getChallenge(challenge.id);
        
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
      } catch (error) {
        console.error('Error checking for updates:', error);
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

  const joinChallenge = async (challengeId: string, name: string, reward: string) => {
    // Get challenge from the shared store
    const existingChallenge = await getChallenge(challengeId);
    
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
      await updateChallenge(updatedChallenge); // Update the shared store
      navigate(`/waiting/${challengeId}`);
    } else {
      toast.error("Challenge not found. Check the code and try again.");
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
      await updateChallenge(newChallenge); // Store in the shared challenge store
      navigate(`/waiting/${challengeId}`);
    }
  };

  const startChallenge = async () => {
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
    await updateChallenge(updatedChallenge); // Update the shared store
    navigate(`/duel/${challenge.id}`);
  };

  const handleLoss = async () => {
    if (!challenge || !participantId) return;
    
    // Update this participant's status to lost
    const updatedParticipants = {
      ...challenge.participants,
      [participantId]: {
        ...challenge.participants[participantId],
        status: 'lost' as ParticipantStatus
      }
    };
    
    // Check if there's only one active participant left
    const activeParticipants = Object.entries(updatedParticipants)
      .filter(([_, p]) => p.status === 'active');
    
    let updatedStatus = challenge.status;
    
    // If only one active player remains, they win
    if (activeParticipants.length === 1) {
      const lastActiveId = activeParticipants[0][0];
      updatedParticipants[lastActiveId] = {
        ...updatedParticipants[lastActiveId],
        status: 'won' as ParticipantStatus
      };
      updatedStatus = 'completed' as ChallengeStatus;
    }
    // If no active players remain, challenge is completed
    else if (activeParticipants.length === 0) {
      updatedStatus = 'completed' as ChallengeStatus;
    }
    
    const updatedChallenge: ChallengeType = {
      ...challenge,
      status: updatedStatus,
      participants: updatedParticipants
    };
    
    setChallenge(updatedChallenge);
    await updateChallenge(updatedChallenge); // Update the shared store
    
    if (updatedStatus === 'completed') {
      navigate(`/results/${challenge.id}`);
    }
    
    toast.error("You looked at your phone! You lost the challenge.");
  };

  const completeChallenge = async () => {
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
    await updateChallenge(updatedChallenge); // Update the shared store
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
