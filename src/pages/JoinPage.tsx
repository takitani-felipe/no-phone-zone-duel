
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { UserIcon } from 'lucide-react';

const JoinPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { joinChallenge } = useChallenge();
  const [name, setName] = useState('');
  const [ownerReward, setOwnerReward] = useState('');

  useEffect(() => {
    // Get the challenge information from localStorage to show the owner's reward
    if (challengeId) {
      const allChallenges = getAllChallenges();
      const challenge = allChallenges[challengeId];
      
      if (challenge) {
        // Find the creator's participant entry
        const creatorId = challenge.createdBy;
        if (creatorId && challenge.participants[creatorId]) {
          setOwnerReward(challenge.participants[creatorId].reward || 'Nothing specified');
        }
      }
    }
  }, [challengeId]);

  const handleJoinChallenge = () => {
    if (!name.trim() || !challengeId) return;
    joinChallenge(challengeId, name, ownerReward);
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Helper function to get all challenges from localStorage
  const getAllChallenges = (): Record<string, any> => {
    const challengesJson = localStorage.getItem('all_challenges');
    return challengesJson ? JSON.parse(challengesJson) : {};
  };

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-full bg-duel-light mb-4">
          <UserIcon className="h-8 w-8 text-duel-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Challenge</h2>
        <p className="text-gray-600">Enter your name to join the duel</p>
      </div>

      <DuelCard>
        <div className="space-y-4">
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
          
          {ownerReward && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's at stake
              </label>
              <p className="text-gray-800">{ownerReward}</p>
              <p className="text-xs text-gray-500 mt-1">Set by the challenge creator</p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
              onClick={handleJoinChallenge}
              disabled={!name.trim()}
            >
              Join Challenge
            </Button>
            
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
    </Layout>
  );
};

export default JoinPage;
