import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: 'en', label: 'English', native: 'ENG' },
        { code: 'hi', label: 'Hindi', native: 'हिंदी' },
        { code: 'mr', label: 'Marathi', native: 'मराठी' }
    ];

    // Handle language change
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        // Optionally save to local storage or analytics
    };

    return (
        <div className="flex gap-1 bg-brand-surface/30 p-1 rounded-lg backdrop-blur-md border border-brand-primary/20">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${i18n.language.startsWith(lang.code)
                            ? 'bg-brand-primary text-white shadow-lg scale-105'
                            : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/10'
                        }`}
                    aria-label={`Switch to ${lang.label}`}
                >
                    {lang.native}
                </button>
            ))}
        </div>
    );
};
