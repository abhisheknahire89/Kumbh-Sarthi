import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MissingPerson {
    id: string;
    name: string;
    age: string;
    description: string;
    photoPlaceholder: string; // Emoji or generic avatar
    status: 'lost' | 'found';
    contact: string;
    timestamp: Date;
}

// Mock initial data
const INITIAL_DATA: MissingPerson[] = [
    { id: '1', name: 'Raju Sharma', age: '8', description: 'Wearing yellow kurta', photoPlaceholder: '👦', status: 'lost', contact: '9876543210', timestamp: new Date() },
    { id: '2', name: 'Meena Devi', age: '65', description: 'Red saree, glasses', photoPlaceholder: '👵', status: 'lost', contact: '9876543211', timestamp: new Date() },
];

export const LostAndFound: React.FC = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'list' | 'report'>('list');
    const [people, setPeople] = useState<MissingPerson[]>(INITIAL_DATA);
    const [formData, setFormData] = useState({ name: '', age: '', description: '', contact: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPerson: MissingPerson = {
            id: Date.now().toString(),
            ...formData,
            photoPlaceholder: '👤',
            status: 'lost',
            timestamp: new Date()
        };
        setPeople([newPerson, ...people]);
        setView('list');
        setFormData({ name: '', age: '', description: '', contact: '' });
    };

    return (
        <div className="flex flex-col h-full bg-brand-bg/90 rounded-t-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-white/10 bg-brand-surface/50 backdrop-blur-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text-primary">{t('facilities.lost_found')}</h2>
                        <p className="text-sm text-brand-text-secondary">Find My Family • अपनों को ढूंढें</p>
                    </div>
                    {view === 'list' ? (
                        <button onClick={() => setView('report')} className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-brand-secondary transition-all">
                            📢 Report Lost
                        </button>
                    ) : (
                        <button onClick={() => setView('list')} className="px-4 py-2 bg-white/10 text-brand-text-primary rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                            🔙 Back
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {view === 'report' ? (
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                            <h3 className="text-lg font-bold mb-4">Report Missing Person</h3>
                            <input
                                placeholder="Name (नाम)"
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Age (उम्र)"
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Description (Appearance, Clothes) - विवरण"
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                            <input
                                placeholder="Contact Number (संपर्क)"
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                required
                            />
                            <button type="submit" className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all">
                                📢 Submit Report
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid gap-4">
                        {people.map(person => (
                            <div key={person.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                                <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center text-3xl border-2 border-brand-primary/30">
                                    {person.photoPlaceholder}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-brand-text-primary">{person.name} <span className="text-xs font-normal opacity-70">({person.age} yrs)</span></h3>
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold uppercase rounded-full border border-red-500/30">
                                            {person.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-text-secondary mt-1">{person.description}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs opacity-60">
                                        <span>📅 {person.timestamp.toLocaleTimeString()}</span>
                                        <span>📞 {person.contact}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
