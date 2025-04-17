
import { supabase } from "@/integrations/supabase/client";
import { ChallengeType } from "./types";
import { toast } from "sonner";

export const getChallenge = async (challengeId: string): Promise<ChallengeType | null> => {
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
    
    const challenge: ChallengeType = {
      id: data.id,
      createdBy: data.created_by,
      duration: data.duration,
      reward: data.reward || '',
      participants: data.participants as ChallengeType['participants'],
      status: data.status as ChallengeType["status"],
      startTime: data.start_time || null,
      endTime: data.end_time || null
    };
    
    return challenge;
  } catch (error) {
    console.error(`Error fetching challenge ${challengeId}:`, error);
    
    const challengeJson = localStorage.getItem('challenge');
    const storedChallenge = challengeJson ? JSON.parse(challengeJson) : null;
    
    if (storedChallenge && storedChallenge.id === challengeId) {
      return storedChallenge;
    }
    
    return null;
  }
};

export const updateChallenge = async (challenge: ChallengeType): Promise<void> => {
  if (!challenge || !challenge.id) return;
  
  localStorage.setItem('challenge', JSON.stringify(challenge));
  
  try {
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

export const generateId = () => Math.random().toString(36).substring(2, 9);
