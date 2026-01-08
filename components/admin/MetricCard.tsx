import React from 'react';
import { SLAMetricStatus } from './types';

interface MetricCardProps {
    label: string;
    value: string;
    subValue?: string;
    status: SLAMetricStatus;
    trend?: 'up' | 'down' | 'flat';
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, status, trend }) => {
    const statusColors = {
        green: 'bg-green-500/10 border-green-500/50 text-green-400',
        amber: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
        red: 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse',
    };

    return (
        <div className={`p-4 rounded-xl border ${statusColors[status]} transition-all`}>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{label}</div>
            <div className="flex items-end gap-2">
                <div className="text-3xl font-mono font-bold">{value}</div>
                {subValue && <div className="text-sm opacity-70 mb-1">{subValue}</div>}
            </div>
            {trend && (
                <div className="text-[10px] mt-2 opacity-60">
                    {trend === 'up' ? '↗ Increasing' : trend === 'down' ? '↘ Decreasing' : '→ Stable'}
                </div>
            )}
        </div>
    );
};
