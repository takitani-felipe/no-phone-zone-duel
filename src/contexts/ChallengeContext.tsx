import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

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
  joinChallenge: (challengeId: string, name: string, reward: string) => Promise<void>;
  startChallenge: () => Promise<void>;
  handleLoss: () => Promise<void>;
  resetChallenge: () => void;
};

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

// Helper functions for managing challenges with Supabase
const getChallenge = async (challengeId: string): Promise<ChallengeType | null> => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) return null;
    
    // Transform the database record into our app's challenge format
    const challenge: ChallengeType = {
      id: data.id,
      createdBy: data.created_by,
      duration: data.duration,
      reward: data.reward || '',
      participants: data.participants as ChallengeType['participants'],
      status: data.status as ChallengeStatus,
      startTime: data.start_time || null,
      endTime: data.end_time || null
    };
    
    return challenge;
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
  
  // Update local cache for faster UI updates
  localStorage.setItem('challenge', JSON.stringify(challenge));
  
  try {
    // Transform our app's challenge format into the database record format
    const dbChallenge = {
      id: challenge.id,
      created_by: challenge.createdBy,
      duration: challenge.duration,
      reward: challenge.reward,
      participants: challenge.participants,
      status: challenge.status,
      start_time: challenge.startTime,
      end_time: challenge.endTime
    };
    
    const { error } = await supabase
      .from('challenges')
      .upsert(dbChallenge)
      .select();
    
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

  // Load challenge from localStorage (for initial load or fallback)
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

  // Set up real-time subscription to the challenge
  useEffect(() => {
    if (!challenge || !challenge.id) return;

    // Set up real-time subscription using Supabase Realtime
    const subscription = supabase
      .channel(`challenge-${challenge.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${challenge.id}`
        },
        async (payload) => {
          console.log('Realtime update received:', payload);
          
          // Get the updated challenge from Supabase
          const updatedChallenge = await getChallenge(challenge.id);
          
          if (updatedChallenge && JSON.stringify(updatedChallenge) !== JSON.stringify(challenge)) {
            console.log('Setting updated challenge:', updatedChallenge);
            
            // Preserve the current participant's information
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
        }
      )
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
    // Generate unique IDs
    const userId = generateId();
    
    // Create challenge data format for database
    const dbChallenge = {
      created_by: userId,
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
      start_time: null,
      end_time: null
    };
    
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('challenges')
        .insert(dbChallenge)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating challenge:', error);
        throw error;
      }
      
      // Create our app's challenge format
      const createdChallenge: ChallengeType = {
        id: data.id,
        createdBy: data.created_by,
        duration: data.duration,
        reward: data.reward || '',
        participants: data.participants as ChallengeType['participants'],
        status: data.status as ChallengeStatus,
        startTime: data.start_time,
        endTime: data.end_time
      };
      
      setChallenge(createdChallenge);
      setParticipantId(userId);
      localStorage.setItem('participantId', userId);
      
      return data.id;
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error("Failed to create challenge. Please try again.");
      return '';
    }
  };

  const joinChallenge = async (challengeId: string, name: string, reward: string) => {
    try {
      // Get challenge from Supabase
      const existingChallenge = await getChallenge(challengeId);
      
      if (!existingChallenge) {
        toast.error("Challenge not found. Check the code and try again.");
        return;
      }
      
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
      localStorage.setItem('participantId', userId);
      
      // Update the challenge in Supabase
      await updateChallenge(updatedChallenge);
      navigate(`/waiting/${challengeId}`);
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error("Failed to join challenge. Please try again.");
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
    await updateChallenge(updatedChallenge);
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
    await updateChallenge(updatedChallenge);
    
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
    await updateChallenge(updatedChallenge);
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

export default ChallengeProvider;
