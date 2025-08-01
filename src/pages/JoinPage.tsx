
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const JoinPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { joinChallenge } = useChallenge();
  const [name, setName] = useState('');
  const [ownerReward, setOwnerReward] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) return;
    
    const fetchChallengeInfo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .single();
        
        if (error) {
          console.error('Error fetching challenge:', error);
          throw error;
        }
        
        if (data) {
          const creatorId = data.created_by;
          const participants = data.participants || {};
          
          if (creatorId && participants[creatorId]) {
            setOwnerReward(participants[creatorId].reward || 'Nothing specified');
          }
        }
      } catch (error) {
        console.error('Error:', error);
        // Fallback to localStorage
        const challengeJson = localStorage.getItem('challenge');
        const challenge = challengeJson ? JSON.parse(challengeJson) : null;
        
        if (challenge && challenge.id === challengeId) {
          const creatorId = challenge.createdBy;
          if (creatorId && challenge.participants[creatorId]) {
            setOwnerReward(challenge.participants[creatorId].reward || 'Nothing specified');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallengeInfo();
  }, [challengeId]);

  const handleJoinChallenge = () => {
    if (!name.trim() || !challengeId) return;
    joinChallenge(challengeId, name, ownerReward);
  };

  const handleCancel = () => {
    navigate('/');
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
          
          {loading ? (
            <div className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
          ) : ownerReward ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's at stake
              </label>
              <p className="text-gray-800">{ownerReward}</p>
              <p className="text-xs text-gray-500 mt-1">Set by the challenge creator</p>
            </div>
          ) : null}

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
