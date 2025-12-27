
import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { SpinnerIcon } from '../components/icons';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const branding = useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname.startsWith('scribe')) {
      return { title: 'VEDA SCRIBE', subtitle: 'CLINICAL INTELLIGENCE' };
    } else if (hostname.startsWith('vedax')) {
      return { title: 'VEDA X', subtitle: 'DIAGNOSTIC REASONING' };
    }
    return { title: 'VEDA', subtitle: 'HEALTH INTELLIGENCE' };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: email.split('@')[0], // Default name
                }
            }
        });
        if (error) throw error;
        setMessage('Registration successful! Please check your email for a confirmation link.');
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // Use window.location.origin to ensure the user is redirected back to the specific subdomain they started on
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="dark flex flex-col items-center justify-center h-screen font-sans text-brand-text-primary bg-brand-bg antialiased animate-fade-in relative">
        <div className="absolute inset-0 z-[-1] opacity-[0.03]" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/subtle-grunge.png)' }}></div>
        
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

        <div className="w-full max-w-sm mx-auto p-8 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 relative z-10">
            <div className="flex items-center space-x-3 mb-8 justify-center">
                <div className="relative p-2.5 bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl shadow-lg">
                   <img src="https://raw.githubusercontent.com/akashmanjunath2505/public/main/favicon.png" alt="VEDA Logo" className="relative w-7 h-7" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">{branding.title}</h1>
                  <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary font-bold">{branding.subtitle}</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-8 tracking-tight">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 bg-brand-surface border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder-brand-text-secondary/50"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-5 py-3.5 bg-brand-surface border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder-brand-text-secondary/50"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-4 font-bold text-white bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
                >
                    {loading ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            <div className="my-8 flex items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">OR</span>
                <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full py-4 font-bold text-brand-text-primary bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
               {googleLoading ? (
                 <SpinnerIcon className="w-5 h-5" />
               ) : (
                 <>
                   <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                   </svg>
                   Continue with Google
                 </>
               )}
            </button>

            <div className="text-center mt-8">
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-xs font-bold text-brand-accent hover:text-brand-primary transition-colors uppercase tracking-widest"
                >
                    {isLogin ? 'New to Veda? Sign Up' : 'Have an account? Sign In'}
                </button>
            </div>
            
            {(error || message) && (
              <div className={`mt-6 p-4 rounded-xl text-xs font-medium text-center animate-slide-up ${error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                  {error || message}
              </div>
            )}
        </div>
        
        <p className="mt-8 text-[10px] text-brand-text-secondary font-bold uppercase tracking-[0.2em] opacity-40">
            Powered by Gemini 2.5 Flash
        </p>
    </div>
  );
};
