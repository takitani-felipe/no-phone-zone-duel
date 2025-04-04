
import React from 'react';
import { UserIcon } from 'lucide-react';

interface ParticipantCardProps {
  name: string;
  reward: string;
  status: 'waiting' | 'active' | 'lost' | 'won';
  isCurrentUser?: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ 
  name, 
  reward, 
  status,
  isCurrentUser = false
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'waiting':
        return 'bg-gray-100 border-gray-300';
      case 'active':
        return 'bg-blue-50 border-blue-200';
      case 'lost':
        return 'bg-red-50 border-red-200';
      case 'won':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'active':
        return 'Active';
      case 'lost':
        return 'Lost';
      case 'won':
        return 'Won';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusClasses()} ${isCurrentUser ? 'border-dashed' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 bg-duel-gradient rounded-full p-2">
          <UserIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {name} {isCurrentUser && <span className="text-xs text-gray-500">(you)</span>}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Reward: {reward}
          </p>
        </div>
        <div className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 bg-white shadow-sm">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
