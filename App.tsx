import React from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { useAuth } from './contexts/AuthContext';
import { SpinnerIcon } from './components/icons';

function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = React.useState<'chat' | 'profile' | 'knowledge'>('chat');

  if (loading) {
    return (
      <div className="dark flex flex-col h-screen font-sans text-brand-text-primary bg-brand-bg antialiased items-center justify-center">
        <SpinnerIcon className="w-10 h-10 text-brand-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="dark flex flex-col h-screen font-sans text-brand-text-primary bg-brand-bg antialiased animate-fade-in">
      <div className="absolute inset-0 z-[-1] opacity-[0.03]" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/subtle-grunge.png)' }}></div>
      <Header setPage={setPage} />
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto">
        {page === 'chat' && <ChatInterface />}
        {page === 'profile' && <ProfilePage setPage={setPage} />}
        {page === 'knowledge' && <KnowledgeBasePage setPage={setPage} />}
      </main>
    </div>
  );
}

export default App;