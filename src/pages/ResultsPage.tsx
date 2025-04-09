
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import ParticipantCard from '@/components/ParticipantCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Trophy, Home, Award, Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const ResultsPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge, participantId, resetChallenge } = useChallenge();
  
  useEffect(() => {
    // Only redirect if challenge doesn't exist or doesn't match ID
    if (!challenge || challenge.id !== challengeId) {
      navigate('/');
      return;
    }
    
    // Don't redirect based on status anymore, just show appropriate content
    
    // Show confetti for winners
    if (participantId && challenge.participants[participantId]?.status === 'won') {
      launchConfetti();
    }
  }, [challenge, challengeId, navigate, participantId]);

  const launchConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Since particles fall down, start at the top
      confetti({
        startVelocity: 30,
        particleCount,
        spread: 360,
        origin: { x: randomInRange(0.1, 0.9), y: 0 },
        colors: ['#9b87f5', '#f97316', '#0ea5e9', '#22c55e', '#8b5cf6'],
        disableForReducedMotion: true
      });
    }, 250);
  };

  const handleNewChallenge = () => {
    resetChallenge();
    navigate('/');
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
  const selfReward = currentParticipant.reward;

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

          {hasWon && (
            <div className="space-y-6">
              {wonRewards.length > 0 && (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="mr-4 bg-white p-2 rounded-full shadow-sm">
                      <Gift className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Your Rewards</h4>
                      <p className="text-sm text-green-700">You've earned these rewards</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {wonRewards.map((reward, index) => (
                      <li key={index} className="flex items-center">
                        <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-gray-800">{reward}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-gray-600">
                      You also kept your {selfReward || "reward"} safe from others!
                    </p>
                  </div>
                </div>
              )}
              
              {wonRewards.length === 0 && (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="mr-4 bg-white p-2 rounded-full shadow-sm">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Congratulations!</h4>
                      <p className="text-sm text-green-700">You've completed the challenge</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    You kept your {selfReward || "reward"} safe! No one else put up rewards in this challenge.
                  </p>
                </div>
              )}
            </div>
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
