
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { ChallengeType } from '../types';
import { getChallenge } from '../challengeApi';

export const useSupabaseUpdates = (
  challenge: ChallengeType | null, 
  participantId: string | null,
  setChallenge: (challenge: ChallengeType) => void
) => {
  const navigate = useNavigate();

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
  }, [challenge, participantId, navigate, setChallenge]);
};
