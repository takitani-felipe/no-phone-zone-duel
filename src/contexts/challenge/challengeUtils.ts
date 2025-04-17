
import { ChallengeType, ParticipantStatus, ChallengeStatus } from "./types";
import { updateChallenge, generateId } from "./challengeApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createChallengeAction = async (
  name: string, 
  duration: number, 
  reward: string,
  setChallenge: (challenge: ChallengeType) => void,
  setParticipantId: (id: string) => void
): Promise<string> => {
  const userId = generateId();
  
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
    const { data, error } = await supabase
      .from('challenges')
      .insert(dbChallenge)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
    
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

export const startChallengeAction = async (
  challenge: ChallengeType,
  setChallenge: (challenge: ChallengeType) => void,
  navigate: (path: string) => void
): Promise<void> => {
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

export const handleLossAction = async (
  challenge: ChallengeType,
  participantId: string,
  setChallenge: (challenge: ChallengeType) => void,
  navigate: (path: string) => void
): Promise<void> => {
  if (!challenge || !participantId) return;
  
  const updatedParticipants = {
    ...challenge.participants,
    [participantId]: {
      ...challenge.participants[participantId],
      status: 'lost' as ParticipantStatus
    }
  };
  
  const activeParticipants = Object.entries(updatedParticipants)
    .filter(([_, p]) => p.status === 'active');
  
  let updatedStatus = challenge.status;
  
  if (activeParticipants.length === 1) {
    const lastActiveId = activeParticipants[0][0];
    updatedParticipants[lastActiveId] = {
      ...updatedParticipants[lastActiveId],
      status: 'won' as ParticipantStatus
    };
    updatedStatus = 'completed' as ChallengeStatus;
  }
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

export const completeChallengeAction = async (
  challenge: ChallengeType,
  setChallenge: (challenge: ChallengeType) => void,
  navigate: (path: string) => void
): Promise<void> => {
  if (!challenge) return;
  
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

export const joinChallengeAction = async (
  challengeId: string,
  name: string,
  reward: string,
  setChallenge: (challenge: ChallengeType) => void,
  setParticipantId: (id: string) => void,
  navigate: (path: string) => void,
  getChallenge: (challengeId: string) => Promise<ChallengeType | null>
) => {
  try {
    const existingChallenge = await getChallenge(challengeId);
    
    if (!existingChallenge) {
      toast.error("Challenge not found. Check the code and try again.");
      return;
    }
    
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
    
    await updateChallenge(updatedChallenge);
    navigate(`/waiting/${challengeId}`);
  } catch (error) {
    console.error('Error joining challenge:', error);
    toast.error("Failed to join challenge. Please try again.");
  }
};
