
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Trophy, Gift, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const WinnerPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge, participantId, resetChallenge } = useChallenge();

  useEffect(() => {
    // Only check if challenge exists and match ID
    if (!challenge || challenge.id !== challengeId) {
      navigate('/');
      return;
    }

    // Check if participant exists
    if (!participantId || !challenge.participants[participantId]) {
      navigate('/');
      return;
    }

    // Only check if they won, don't redirect otherwise
    const currentParticipant = challenge.participants[participantId];
    if (currentParticipant.status !== 'won') {
      // Instead of redirect, show a toast and stay on the page
      toast.error("You didn't win this challenge.");
      return;
    }

    // Launch confetti celebration
    const launchConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };
    
    launchConfetti();
    const timer = setInterval(launchConfetti, 2000);
    
    return () => clearInterval(timer);
  }, [challenge, challengeId, navigate, participantId]);

  const handleNewChallenge = () => {
    resetChallenge();
    navigate('/');
  };

  // Return null if challenge or participant ID isn't available
  if (!challenge || !participantId) return null;

  const currentParticipant = challenge.participants[participantId];
  if (!currentParticipant) return null;

  // Get the rewards from losers
  const losers = Object.entries(challenge.participants).filter(([_, p]) => p.status === 'lost');
  const wonRewards = losers.map(([_, p]) => p.reward).filter(r => r && r.trim() !== '');
  
  // The user's own reward that they put at risk
  const selfReward = currentParticipant.reward;

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className="inline-flex p-6 rounded-full bg-green-100 mb-6">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
            Congratulations!
          </span>
        </h2>
        
        <p className="text-xl font-medium text-gray-700 mb-4">
          You stayed focused and won the challenge!
        </p>
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
              <Gift className="h-8 w-8 text-purple-600" />
            </div>
            
            <h3 className="text-2xl font-medium mb-2">Your Reward</h3>
            
            {wonRewards.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Here's what you've earned from the challenge:
                </p>
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                  <ul className="space-y-3">
                    {wonRewards.map((reward, index) => (
                      <li 
                        key={index}
                        className="flex items-center justify-center text-lg text-purple-800 font-medium"
                      >
                        <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <p className="text-sm text-gray-500">
                  You also kept your {selfReward || "reward"} safe from others!
                </p>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-gray-600">
                  You kept your {selfReward || "reward"} safe!
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  No one else put up rewards in this challenge.
                </p>
              </div>
            )}
          </div>

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

export default WinnerPage;
