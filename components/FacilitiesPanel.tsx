import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FACILITY_TYPES } from '../constants';
import { getNearbyFacilities, formatDistance, openNavigation } from '../services/locationService';
import type { Coordinates, Facility, FacilityType } from '../types';

interface FacilitiesPanelProps {
    userLocation: Coordinates | null;
    onFacilitySelect?: (facility: Facility) => void;
    onShowMap?: (type: FacilityType) => void;
}

export const FacilitiesPanel: React.FC<FacilitiesPanelProps> = ({
    userLocation,
    onFacilitySelect,
    onShowMap
}) => {
    const { t } = useTranslation();
    const [selectedType, setSelectedType] = useState<FacilityType | null>(null);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedType && userLocation) {
            setLoading(true);
            const nearby = getNearbyFacilities(userLocation, selectedType, 10000);
            setFacilities(nearby);
            setLoading(false);
        }
    }, [selectedType, userLocation]);

    const handleTypeSelect = (type: FacilityType) => {
        if (selectedType === type) {
            setSelectedType(null);
            setFacilities([]);
        } else {
            setSelectedType(type);
        }
    };

    const handleNavigate = (facility: Facility) => {
        openNavigation(facility.location, facility.name);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-brand-text-primary">{t('nav.facilities')}</h2>
            </div>

            {/* Facility Type Grid */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(FACILITY_TYPES).map(([type, config]) => (
                        <button
                            key={type}
                            onClick={() => handleTypeSelect(type as FacilityType)}
                            className={`p-4 rounded-2xl text-center transition-all active:scale-95 ${selectedType === type
                                ? 'bg-brand-primary/20 border-brand-primary border-2'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-3xl mb-2">{config.icon}</div>
                            <div className="text-xs font-medium text-brand-text-primary">{t(`facilities.${type}`)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Type Header */}
            {selectedType && (
                <div className="px-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{FACILITY_TYPES[selectedType].icon}</span>
                        <span className="font-bold text-brand-text-primary">
                            {t(`facilities.${selectedType}`)}
                        </span>
                    </div>
                    {onShowMap && (
                        <button
                            onClick={() => onShowMap(selectedType)}
                            className="text-xs px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full"
                        >
                            {t('facilities.view_map')} 🗺️
                        </button>
                    )}
                </div>
            )}

            {/* Facilities List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {loading ? (
                    <div className="text-center py-8 text-brand-text-secondary">
                        {t('common.loading')}
                    </div>
                ) : !selectedType ? (
                    <div className="text-center py-8 text-brand-text-secondary">
                        <div className="text-4xl mb-2">👆</div>
                        <p>{t('facilities.select_category')}</p>
                    </div>
                ) : !userLocation ? (
                    <div className="text-center py-8 text-amber-400">
                        <div className="text-4xl mb-2">📍</div>
                        <p>{t('facilities.enable_location')}</p>
                    </div>
                ) : facilities.length === 0 ? (
                    <div className="text-center py-8 text-brand-text-secondary">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>{t('facilities.no_results', { type: t(`facilities.${selectedType}`) })}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {facilities.map((facility) => (
                            <div
                                key={facility.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-bold text-brand-text-primary">{facility.name}</div>
                                        <div className="text-sm text-brand-text-secondary">{facility.nameHi}</div>
                                        {facility.description && (
                                            <div className="text-xs text-brand-text-secondary mt-1">
                                                {facility.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {facility.distance !== undefined && (
                                            <div className="text-sm font-bold text-brand-primary">
                                                {formatDistance(facility.distance)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleNavigate(facility)}
                                        className="flex-1 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-secondary transition-all"
                                    >
                                        🧭 {t('facilities.navigate')}
                                    </button>
                                    {onFacilitySelect && (
                                        <button
                                            onClick={() => onFacilitySelect(facility)}
                                            className="py-2 px-4 bg-white/10 text-brand-text-primary rounded-xl text-sm hover:bg-white/20 transition-all"
                                        >
                                            📍 {t('nav.map')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {selectedType && facilities.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-brand-surface/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-text-secondary">
                            {facilities.length} {t(`facilities.${selectedType}`)} found
                        </span>
                        {facilities[0]?.distance !== undefined && (
                            <span className="text-brand-primary font-medium">
                                Nearest: {formatDistance(facilities[0].distance)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacilitiesPanel;
