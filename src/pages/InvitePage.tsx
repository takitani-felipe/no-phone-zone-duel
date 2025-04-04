
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { toast } from 'sonner';
import ParticipantCard from '@/components/ParticipantCard';

const InvitePage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { challenge } = useChallenge();
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!challenge || challenge.id !== challengeId) {
      navigate('/');
    }
  }, [challenge, challengeId, navigate]);

  const shareableLink = `${window.location.origin}/join/${challengeId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Focus Fight challenge!',
          text: 'Let\'s see who can stay off their phone longer!',
          url: shareableLink,
        });
        toast.success('Link shared successfully!');
      } catch (error) {
        // User canceled or share failed
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      handleCopyLink();
      toast.info('Share not supported on this browser. Link copied instead!');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(challengeId || '');
    toast.success('Challenge code copied to clipboard!');
  };

  const handleContinue = () => {
    navigate(`/waiting/${challengeId}`);
  };

  if (!challenge) return null;

  const participants = Object.entries(challenge.participants);
  const waitingCount = participants.length < 2 ? 1 : 0;

  return (
    <Layout>
      <div className="text-center mb-4">
        <p className="text-gray-600">Share this link with your friend to start the duel</p>
      </div>

      <DuelCard className="mb-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Shareable Link
            </label>
            <div className="relative">
              <Input
                value={shareableLink}
                readOnly
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  className="p-1 hover:bg-gray-100 rounded-full"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded-full"
                  onClick={handleShareLink}
                  title="Share link"
                >
                  <Share2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">OR</p>
            <div className="bg-gray-50 p-3 rounded-lg inline-block">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-700">{challengeId}</span>
                <button onClick={handleCopyCode}>
                  <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Challenge Code</p>
            </div>
          </div>

          {participants.length > 1 && (
            <div>
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-duel-purple mr-2" />
                <h3 className="text-md font-medium">Current Participants</h3>
              </div>
              <div className="space-y-3 mb-4">
                {participants.map(([id, participant]) => (
                  <ParticipantCard
                    key={id}
                    name={participant.name}
                    reward={participant.reward}
                    status={participant.status}
                    isCurrentUser={false}
                  />
                ))}
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-duel-gradient hover:opacity-90 transition-opacity"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </DuelCard>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          {waitingCount > 0 
            ? `Waiting for ${waitingCount} friend to join` 
            : "Friends have joined! You can continue to the waiting room."}
        </p>
      </div>
    </Layout>
  );
};

export default InvitePage;
