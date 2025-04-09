
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import ParticipantCard from '@/components/ParticipantCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Trophy, Home, Award } from 'lucide-react';

const ResultsPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge, participantId, resetChallenge } = useChallenge();
  
  useEffect(() => {
    if (!challenge || challenge.id !== challengeId || challenge.status !== 'completed') {
      navigate('/');
    }
  }, [challenge, challengeId, navigate]);

  const handleNewChallenge = () => {
    resetChallenge();
    navigate('/');
  };

  const handleViewReward = () => {
    navigate(`/winner/${challengeId}`);
  };

  if (!challenge || !participantId) return null;

  const participants = Object.entries(challenge.participants);
  const currentParticipant = challenge.participants[participantId];
  const hasWon = currentParticipant.status === 'won';
  
  // Find the winner(s) and loser(s)
  const winners = participants.filter(([_, p]) => p.status === 'won');
  const losers = participants.filter(([_, p]) => p.status === 'lost');
  
  // Get the rewards that were won
  const wonRewards = losers.map(([_, p]) => p.reward).filter(r => r);

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className={`inline-flex p-4 rounded-full ${hasWon ? 'bg-green-100' : 'bg-red-100'} mb-4`}>
          <Trophy className={`h-8 w-8 ${hasWon ? 'text-green-600' : 'text-red-500'}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {hasWon ? 'You Won!' : 'Better Luck Next Time'}
        </h2>
        <p className="text-gray-600">
          {hasWon 
            ? (wonRewards.length > 0 
              ? `You've earned: ${wonRewards.join(', ')}` 
              : 'You stayed off your phone!')
            : winners.length === 0 
              ? 'Everyone checked their phones! Challenge failed.'
              : `${winners.map(([_, p]) => p.name).join(', ')} won the challenge.`}
        </p>
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Final Results</h3>
            {winners.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-600 mb-2">Winners</h4>
                <div className="space-y-3">
                  {winners.map(([id, participant]) => (
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
            )}

            {losers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">Eliminated</h4>
                <div className="space-y-3">
                  {losers.map(([id, participant]) => (
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
            )}
          </div>

          {hasWon && wonRewards.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              onClick={handleViewReward}
            >
              <Award className="h-4 w-4 mr-2" />
              View Your Reward
            </Button>
          )}

          <Button 
            className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
            onClick={handleNewChallenge}
          >
            <Home className="h-4 w-4 mr-2" />
            Start New Challenge
          </Button>
        </div>
      </DuelCard>
    </Layout>
  );
};

export default ResultsPage;
