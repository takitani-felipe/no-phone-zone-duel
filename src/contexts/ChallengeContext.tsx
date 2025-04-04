
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
}

// Initialize Supabase client with null check
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
  createChallenge: (name: string, duration: number, reward: string) => Promise<string>;
  joinChallenge: (challengeId: string, name: string, reward: string) => void;
  startChallenge: () => void;
  handleLoss: () => void;
  resetChallenge: () => void;
};

const defaultContext: ChallengeContextType = {
  challenge: null,
  participantId: null,
  createChallenge: async () => '',
  joinChallenge: () => {},
  startChallenge: () => {},
  handleLoss: () => {},
  resetChallenge: () => {},
};

const ChallengeContext = createContext<ChallengeContextType>(defaultContext);

export const useChallenge = () => useContext(ChallengeContext);

// Helper functions for managing storage and syncing with Supabase
const getChallenge = async (challengeId: string): Promise<ChallengeType | null> => {
  if (!supabase) {
    console.error("Supabase client not initialized. Using local storage fallback.");
    const challengeJson = localStorage.getItem('challenge');
    return challengeJson ? JSON.parse(challengeJson) : null;
  }

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as ChallengeType;
  } catch (error) {
    console.error(`Error fetching challenge ${challengeId}:`, error);
    
    // Fallback to local storage if Supabase fails
    const challengeJson = localStorage.getItem('challenge');
    const storedChallenge = challengeJson ? JSON.parse(challengeJson) : null;
    
    if (storedChallenge && storedChallenge.id === challengeId) {
      return storedChallenge;
    }
    
    return null;
  }
};

const updateChallenge = async (challenge: ChallengeType): Promise<void> => {
  if (!challenge || !challenge.id) return;
  
  // Update local cache
  localStorage.setItem('challenge', JSON.stringify(challenge));
  
  if (!supabase) {
    console.error("Supabase client not initialized. Changes will only be saved locally.");
    return;
  }
  
  try {
    const { error } = await supabase
      .from('challenges')
      .upsert(challenge, { onConflict: 'id' });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating challenge:', error);
    toast.error("Failed to sync with database. Challenge may not update for others.");
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
      // Update the challenge in Supabase
      updateChallenge(challenge);
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

  // Set up real-time subscription to the challenge
  useEffect(() => {
    if (!challenge || !challenge.id || !supabase) return;

    // Set up real-time subscription
    const subscription = supabase
      .channel(`challenge-${challenge.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE',
        schema: 'public', 
        table: 'challenges',
        filter: `id=eq.${challenge.id}`
      }, (payload) => {
        const updatedChallenge = payload.new as ChallengeType;
        
        if (JSON.stringify(updatedChallenge) !== JSON.stringify(challenge)) {
          // Preserve the current participant's information during sync
          if (participantId && updatedChallenge.participants) {
            if (!updatedChallenge.participants[participantId] && challenge.participants[participantId]) {
              updatedChallenge.participants[participantId] = challenge.participants[participantId];
            }
          }
          
          setChallenge(updatedChallenge);
          
          // If challenge status changed to active, navigate to duel page
          if (updatedChallenge.status === 'active' && challenge.status === 'waiting') {
            navigate(`/duel/${challenge.id}`);
            toast.success("Challenge started!");
          }
        }
      })
      .subscribe();

    // Fallback polling mechanism in case the subscription fails
    const checkForUpdates = async () => {
      try {
        const latestChallenge = await getChallenge(challenge.id);
        
        if (latestChallenge && JSON.stringify(latestChallenge) !== JSON.stringify(challenge)) {
          // Preserve the current participant's information
          if (participantId && latestChallenge.participants) {
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

    const intervalId = setInterval(checkForUpdates, 5000); // Check every 5 seconds as a fallback
    
    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
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

  const createChallenge = async (name: string, duration: number, reward: string): Promise<string> => {
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
    await updateChallenge(newChallenge); // Store in Supabase
    
    return challengeId;
  };

  const joinChallenge = async (challengeId: string, name: string, reward: string) => {
    // Get challenge from Supabase
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
      await updateChallenge(updatedChallenge); // Update in Supabase
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
      await updateChallenge(newChallenge); // Store in Supabase
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
    await updateChallenge(updatedChallenge); // Update in Supabase
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
    await updateChallenge(updatedChallenge); // Update in Supabase
    
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
    await updateChallenge(updatedChallenge); // Update in Supabase
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
