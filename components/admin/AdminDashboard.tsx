import React, { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { LiveOperationsFeed } from './LiveOperationsFeed';
import { ControlRoomMap } from './ControlRoomMap';
import { EmergencyDetailPanel } from './EmergencyDetailPanel';
import { EmergencyCase, MOCK_ZONES } from './types';
// Will import other components as we build them

export const AdminDashboard: React.FC = () => {
    // Mock Data State
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulate basic metrics
    const metrics = {
        detection: { val: '4.2s', status: 'green' as const },
        dispatch: { val: '45s', status: 'green' as const },
        response: { val: '3m 12s', status: 'amber' as const },
        resolution: { val: '12m', status: 'green' as const },
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-mono flex flex-col">
            {/* Control Room Header */}
            <header className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h1 className="text-xl font-bold uppercase tracking-widest text-white">
                        Kumbh Sarthi Control Room <span className="text-xs px-2 py-1 bg-slate-800 rounded ml-2">LIVE</span>
                    </h1>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                        <div className="text-gray-400 text-xs">Active Emergencies</div>
                        <div className="text-xl font-bold text-red-400">03</div>
                    </div>
                    <div className="text-right border-l border-slate-700 pl-6">
                        <div className="text-gray-400 text-xs">Standard Time</div>
                        <div className="text-xl font-bold text-white">{currentTime.toLocaleTimeString()}</div>
                    </div>
                </div>
            </header>

            {/* SLA Metrics Bar */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/50 border-b border-slate-800">
                <MetricCard
                    label="🚨 Detection Time"
                    value={metrics.detection.val}
                    subValue="Avg"
                    status={metrics.detection.status}
                    trend="flat"
                />
                <MetricCard
                    label="📡 Dispatch Time"
                    value={metrics.dispatch.val}
                    subValue="Target < 60s"
                    status={metrics.dispatch.status}
                    trend="down"
                />
                <MetricCard
                    label="🚑 Response Time"
                    value={metrics.response.val}
                    subValue="Target < 3m"
                    status={metrics.response.status}
                    trend="up"
                />
                <MetricCard
                    label="✅ Resolution Time"
                    value={metrics.resolution.val}
                    subValue="Avg"
                    status={metrics.resolution.status}
                />
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Live Operations Feed */}
                <div className="w-1/3 border-r border-slate-800 flex flex-col max-h-[calc(100vh-180px)]">
                    <div className="p-3 bg-slate-800 font-bold text-sm uppercase flex justify-between">
                        <span>Live Incidents</span>
                        <span className="text-xs bg-slate-900 px-2 py-0.5 rounded">Real-time</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-900 border-t border-slate-800">
                        <LiveOperationsFeed onCaseSelect={setSelectedCase} />
                    </div>
                </div>

                {/* Center: Map/Situation View */}
                <div className="flex-1 bg-slate-900 relative">
                    <ControlRoomMap />

                    {/* Detail Panel Overlay */}
                    {selectedCase && (
                        <EmergencyDetailPanel
                            data={selectedCase}
                            onClose={() => setSelectedCase(null)}
                        />
                    )}

                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        {MOCK_ZONES.map(zone => (
                            <div key={zone} className="bg-black/80 backdrop-blur text-xs p-2 rounded border border-slate-700 flex justify-between min-w-[150px]">
                                <span>{zone}</span>
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
