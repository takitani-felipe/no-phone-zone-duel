
export type ParticipantStatus = 'waiting' | 'active' | 'lost' | 'won';
export type ChallengeStatus = 'waiting' | 'active' | 'completed';

export type ChallengeType = {
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

export type ChallengeContextType = {
  challenge: ChallengeType | null;
  participantId: string | null;
  createChallenge: (name: string, duration: number, reward: string) => Promise<string>;
  joinChallenge: (challengeId: string, name: string, reward: string) => Promise<void>;
  startChallenge: () => Promise<void>;
  handleLoss: () => Promise<void>;
  resetChallenge: () => void;
};
