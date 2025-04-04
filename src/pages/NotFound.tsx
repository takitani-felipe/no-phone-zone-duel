
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DuelCard from '@/components/DuelCard';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600">The page you're looking for doesn't exist.</p>
      </div>

      <DuelCard>
        <div className="space-y-4 text-center">
          <p className="text-7xl font-bold bg-duel-gradient bg-clip-text text-transparent">404</p>
          
          <p className="text-gray-600">
            Let's get you back to somewhere familiar.
          </p>
          
          <Button 
            className="bg-duel-gradient hover:opacity-90 transition-opacity"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </DuelCard>
    </Layout>
  );
};

export default NotFound;
