
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-white to-duel-light">
      <header className="mb-8 pt-6">
        <div className="container max-w-lg mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-duel-gradient bg-clip-text text-transparent">
            Focus Fight
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </main>

      <footer className="mt-8 py-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>Stay present, win rewards</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
