
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import TimeSelector from '@/components/TimeSelector';
import { useChallenge } from '@/contexts/ChallengeContext';
import { PhoneOff, Link } from 'lucide-react';
import { toast } from 'sonner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createChallenge } = useChallenge();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [reward, setReward] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateChallenge = () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    createChallenge(name, duration, reward);
  };

  const handleJoinChallenge = () => {
    if (!challengeId.trim()) {
      toast.error("Please enter a challenge code");
      return;
    }
    navigate(`/join/${challengeId}`);
  };

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-full bg-duel-light mb-4">
          <PhoneOff className="h-8 w-8 text-duel-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Focus Fight</h2>
        <p className="text-gray-600">Challenge a friend to stay off your phones and win rewards.</p>
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-4">
          {!isJoining ? (
            <>
              <h3 className="text-lg font-medium text-center">Create a Challenge</h3>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <TimeSelector value={duration} onChange={setDuration} />
                
                <div>
                  <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-1">
                    What are you betting? (optional)
                  </label>
                  <Input
                    id="reward"
                    placeholder="e.g. $5, coffee, lunch..."
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
                  onClick={handleCreateChallenge}
                  disabled={!name.trim()}
                >
                  Create Challenge
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-center">Join a Challenge</h3>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="challenge-id" className="block text-sm font-medium text-gray-700 mb-1">
                    Challenge Code
                  </label>
                  <Input
                    id="challenge-id"
                    placeholder="Enter challenge code"
                    value={challengeId}
                    onChange={(e) => setChallengeId(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
                  onClick={handleJoinChallenge}
                  disabled={!challengeId.trim()}
                >
                  Join Challenge
                </Button>
              </div>
            </>
          )}
        </div>
      </DuelCard>

      <div className="text-center">
        <Button
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 text-sm"
          onClick={() => setIsJoining(!isJoining)}
        >
          {isJoining ? (
            <>Want to create a challenge?</>
          ) : (
            <div className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              <span>Join an existing challenge</span>
            </div>
          )}
        </Button>
      </div>
    </Layout>
  );
};

export default HomePage;
