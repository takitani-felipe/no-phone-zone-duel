
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { useChallenge } from '@/contexts/ChallengeContext';
import { toast } from 'sonner';

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(challengeId || '');
    toast.success('Challenge code copied to clipboard!');
  };

  const handleContinue = () => {
    navigate(`/waiting/${challengeId}`);
  };

  if (!challenge) return null;

  return (
    <Layout>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite a Friend</h2>
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
                className="pr-10"
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
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
          Waiting for 1 friend to join
        </p>
      </div>
    </Layout>
  );
};

export default InvitePage;
