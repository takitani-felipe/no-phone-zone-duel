
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { ChallengeType, ChallengeContextType } from './types';
import { 
  getChallenge, 
  updateChallenge, 
  generateId 
} from './challengeApi';
import { 
  createChallengeAction, 
  startChallengeAction, 
  handleLossAction, 
  completeChallengeAction, 
  joinChallengeAction 
} from './challengeUtils';

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
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (challenge) {
      localStorage.setItem('challenge', JSON.stringify(challenge));
    }
    
    if (participantId) {
      localStorage.setItem('participantId', participantId);
    }
  }, [challenge, participantId]);

  useEffect(() => {
    if (!challenge || !challenge.id) return;

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
          
          const updatedChallenge = await getChallenge(challenge.id);
          
          if (updatedChallenge && JSON.stringify(updatedChallenge) !== JSON.stringify(challenge)) {
            console.log('Setting updated challenge:', updatedChallenge);
            
            if (participantId && updatedChallenge.participants) {
              if (!updatedChallenge.participants[participantId] && challenge.participants[participantId]) {
                updatedChallenge.participants[participantId] = challenge.participants[participantId];
              }
            }
            
            setChallenge(updatedChallenge);
            
            if (updatedChallenge.status === 'active' && challenge.status === 'waiting') {
              navigate(`/duel/${challenge.id}`);
              toast.success("Challenge started!");
            }
          }
        }
      )
      .subscribe();

    const checkForUpdates = async () => {
      try {
        const latestChallenge = await getChallenge(challenge.id);
        
        if (latestChallenge && JSON.stringify(latestChallenge) !== JSON.stringify(challenge)) {
          if (participantId && latestChallenge.participants) {
            if (!latestChallenge.participants[participantId] && challenge.participants[participantId]) {
              latestChallenge.participants[participantId] = challenge.participants[participantId];
            }
          }
          
          setChallenge(latestChallenge);
          
          if (latestChallenge.status === 'active' && challenge.status === 'waiting') {
            navigate(`/duel/${challenge.id}`);
            toast.success("Challenge started!");
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, 5000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [challenge, participantId, navigate]);

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

  const createChallenge = async (name: string, duration: number, reward: string): Promise<string> => {
    return createChallengeAction(name, duration, reward, setChallenge, setParticipantId);
  };

  const joinChallenge = async (challengeId: string, name: string, reward: string) => {
    return joinChallengeAction(
      challengeId, 
      name, 
      reward, 
      setChallenge, 
      setParticipantId, 
      navigate, 
      getChallenge
    );
  };

  const startChallenge = async () => {
    if (!challenge) return;
    return startChallengeAction(challenge, setChallenge, navigate);
  };

  const handleLoss = async () => {
    if (!challenge || !participantId) return;
    return handleLossAction(challenge, participantId, setChallenge, navigate);
  };

  const completeChallenge = async () => {
    if (!challenge) return;
    return completeChallengeAction(challenge, setChallenge, navigate);
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
