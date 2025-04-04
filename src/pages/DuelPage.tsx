
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import Countdown from '@/components/Countdown';
import ParticipantCard from '@/components/ParticipantCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

const DuelPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge, participantId } = useChallenge();
  
  useEffect(() => {
    if (!challenge || challenge.id !== challengeId || challenge.status !== 'active') {
      navigate('/');
    }
  }, [challenge, challengeId, navigate]);

  useEffect(() => {
    // Check if the current participant has lost
    if (challenge && participantId && challenge.participants[participantId].status === 'lost') {
      toast.error("You've lost, but you can still watch the others compete!");
    }
  }, [challenge, participantId]);

  if (!challenge || !participantId) return null;

  const participants = Object.entries(challenge.participants);
  const activeParticipants = participants.filter(([_, p]) => p.status === 'active');
  const lostParticipants = participants.filter(([_, p]) => p.status === 'lost');
  const currentParticipant = challenge.participants[participantId];
  const isCurrentParticipantActive = currentParticipant.status === 'active';

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-full bg-duel-light mb-4">
          <Shield className="h-8 w-8 text-duel-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge Active</h2>
        {isCurrentParticipantActive ? (
          <p className="text-gray-600">Don't leave this screen or you'll lose!</p>
        ) : (
          <p className="text-red-500">You've lost, but you can still watch the others compete!</p>
        )}
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-8">
          <Countdown className="mx-auto max-w-xs" />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Still in the challenge ({activeParticipants.length})</h3>
            <div className="space-y-3 mb-6">
              {activeParticipants.map(([id, participant]) => (
                <ParticipantCard
                  key={id}
                  name={participant.name}
                  reward={participant.reward}
                  status={participant.status}
                  isCurrentUser={id === participantId}
                />
              ))}
            </div>

            {lostParticipants.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-2 mt-4">Eliminated ({lostParticipants.length})</h3>
                <div className="space-y-3 opacity-80">
                  {lostParticipants.map(([id, participant]) => (
                    <ParticipantCard
                      key={id}
                      name={participant.name}
                      reward={participant.reward}
                      status={participant.status}
                      isCurrentUser={id === participantId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DuelCard>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          {challenge.duration > 1 
            ? `Stay on this page for ${challenge.duration} minutes to win!` 
            : "Stay on this page for 1 minute to win!"}
        </p>
      </div>
    </Layout>
  );
};

export default DuelPage;
