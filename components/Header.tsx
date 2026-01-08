
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, MapIcon, HomeIcon, AlertIcon } from './icons';
import { APP_NAME, APP_NAME_HINDI } from '../constants';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  setPage: (page: 'chat' | 'profile' | 'map' | 'facilities' | 'emergency') => void;
  currentPage?: string;
}

export const Header: React.FC<HeaderProps> = ({ setPage, currentPage = 'chat' }) => {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const navItems = [
    { id: 'chat', label: t('nav.chat'), icon: '💬' },
    { id: 'map', label: t('nav.map'), icon: '🗺️' },
    { id: 'facilities', label: t('nav.facilities'), icon: '🔍' },
  ];

  return (
    <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 w-full z-10 sticky top-0">
      {/* Main Header */}
      <div className="p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3" onClick={() => setPage('chat')} style={{ cursor: 'pointer' }}>
            <div className="relative p-2 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg shadow-md">
              <div className="absolute -inset-1 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg blur opacity-50"></div>
              <span className="relative text-xl">🙏</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-text-primary tracking-wide uppercase">{t('app_name')}</h1>
              <p className="text-[10px] text-brand-text-secondary font-medium tracking-tight">{APP_NAME_HINDI} • कुंभ मेला नाशिक 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Emergency SOS Button */}
            <button
              onClick={() => setPage('emergency')}
              className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all emergency-pulse"
            >
              🆘 {t('emergency_sos')}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-brand-accent" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-brand-accent">
                      <UserIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-brand-surface border border-white/10 rounded-xl shadow-lg py-1 animate-fade-in origin-top-right">
                    <div className="px-4 py-2 text-sm text-brand-text-secondary border-b border-white/10">
                      {profile?.full_name || user.email}
                    </div>
                    <button
                      onClick={() => { setPage('profile'); setIsDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-primary/20"
                    >
                      👤 Profile
                    </button>
                    <button
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 max-w-4xl mx-auto overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${currentPage === item.id
                ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                : 'bg-white/5 text-brand-text-secondary hover:bg-white/10'
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
