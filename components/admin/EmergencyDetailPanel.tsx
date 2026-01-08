import React from 'react';
import { EmergencyCase } from './types';

interface EmergencyDetailPanelProps {
    data: EmergencyCase | null;
    onClose: () => void;
}

export const EmergencyDetailPanel: React.FC<EmergencyDetailPanelProps> = ({ data, onClose }) => {
    if (!data) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl animate-slide-left z-20 flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold text-lg text-white">CASE #{data.id}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Status Badge */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Current Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${data.status === 'New' ? 'bg-red-500 text-white animate-pulse' :
                            data.status === 'Resolved' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                        {data.status}
                    </span>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">Type</div>
                        <div className="font-bold">{data.type}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">Zone</div>
                        <div className="font-bold">{data.zone}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">Language</div>
                        <div className="font-bold">{data.language}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">Detection</div>
                        <div className="font-bold">{data.metrics.detectionTime}s</div>
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">Audit Timeline</h3>
                    <div className="space-y-4 border-l-2 border-slate-700 ml-2 pl-4 relative">
                        {/* Event 1 */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-500"></div>
                            <div className="text-sm text-slate-300">Voice Trigger Detected</div>
                            <div className="text-xs text-slate-500 font-mono">{new Date(data.timeline.voiceTrigger).toLocaleTimeString()}</div>
                        </div>
                        {/* Event 2 */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="text-sm text-slate-300">Emergency Classified</div>
                            <div className="text-xs text-slate-500 font-mono">{new Date(data.timeline.classified).toLocaleTimeString()}</div>
                        </div>
                        {/* Mock Future Events */}
                        <div className="relative opacity-50">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"></div>
                            <div className="text-sm text-slate-400">Dispatch Pending...</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm">
                        📞 Dispatch Control Room
                    </button>
                    <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-sm">
                        📍 View on Master Map
                    </button>
                    <button className="w-full py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded font-bold text-sm">
                        ⚠️ Escalate to Supervisor
                    </button>
                </div>

            </div>
        </div>
    );
};
