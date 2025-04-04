
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import ParticipantCard from '@/components/ParticipantCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const WaitingPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge, participantId, startChallenge, resetChallenge } = useChallenge();
  
  useEffect(() => {
    if (!challenge || challenge.id !== challengeId) {
      navigate('/');
    }
  }, [challenge, challengeId, navigate]);

  const handleStart = () => {
    if (startChallenge) {
      startChallenge();
      toast.success("Challenge started!");
    }
  };

  const handleCancel = () => {
    resetChallenge();
    toast.info("Challenge cancelled");
  };

  if (!challenge || !participantId) return null;

  const participants = Object.entries(challenge.participants);
  const canStart = participants.length >= 2;
  const isCreator = participantId === challenge.createdBy;

  return (
    <Layout>
      <div className="text-center mb-4">
        <div className="inline-flex p-4 rounded-full bg-duel-light mb-2">
          <Clock className="h-8 w-8 text-duel-purple" />
        </div>
        <p className="text-gray-600">
          {canStart 
            ? "Everyone's here! Ready to start the duel?" 
            : "Waiting for your friend to join..."}
        </p>
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Participants</h3>
              {!canStart && (
                <div className="text-xs text-gray-500 flex items-center animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1" /> 
                  Refreshing...
                </div>
              )}
            </div>
            <div className="space-y-3">
              {participants.map(([id, participant]) => (
                <ParticipantCard
                  key={id}
                  name={participant.name}
                  reward={participant.reward}
                  status={participant.status}
                  isCurrentUser={id === participantId}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {isCreator && (
              <Button 
                className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
                onClick={handleStart}
                disabled={!canStart}
              >
                Start Challenge
              </Button>
            )}
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DuelCard>

      {!canStart && (
        <div className="text-center animate-pulse-grow">
          <p className="text-sm text-duel-purple">
            Waiting for more participants...
          </p>
        </div>
      )}
    </Layout>
  );
};

export default WaitingPage;
