
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from './icons';

interface HeaderProps {
  setPage: (page: 'chat' | 'profile' | 'knowledge') => void;
}

export const Header: React.FC<HeaderProps> = ({ setPage }) => {
  const { user, profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const branding = useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname.startsWith('scribe')) {
      return { title: 'VEDA Scribe', subtitle: 'Clinical Intelligence & Documentation' };
    } else if (hostname.startsWith('vedax')) {
      return { title: 'VEDA X', subtitle: 'Advanced Diagnostic Reasoning' };
    }
    return { title: 'VEDA', subtitle: 'Virtual Expert for Diagnosis Assistance' };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="p-4 bg-black/30 backdrop-blur-xl border-b border-white/10 w-full z-10 sticky top-0">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="relative p-2 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg shadow-md cursor-pointer" onClick={() => setPage('chat')}>
             <div className="absolute -inset-1 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg blur opacity-50"></div>
             <img src="https://raw.githubusercontent.com/akashmanjunath2505/public/main/favicon.png" alt="VEDA Logo" className="relative w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-text-primary tracking-wide uppercase">{branding.title}</h1>
            <p className="text-[10px] text-brand-text-secondary font-medium tracking-tight">{branding.subtitle}</p>
          </div>
        </div>

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
              <span className="text-sm font-medium hidden sm:inline">{profile?.full_name || user.email}</span>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-brand-accent" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-brand-accent">
                    <UserIcon className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-brand-surface border border-white/10 rounded-md shadow-lg py-1 animate-fade-in origin-top-right">
                <button
                  onClick={() => { setPage('profile'); setIsDropdownOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-primary/50"
                >
                  Profile
                </button>
                <button
                  onClick={() => { setPage('knowledge'); setIsDropdownOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-primary/50"
                >
                  Knowledge Base
                </button>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-primary/50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
