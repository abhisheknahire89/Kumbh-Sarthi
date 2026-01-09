// Kumbh Sarthi Constants - Kumbh Mela Nashik 2026

// Supabase Configuration (optional - for user authentication)
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const APP_NAME = 'Kumbh Sarthi';
export const APP_NAME_HINDI = 'कुंभ सारथी';
export const APP_TAGLINE = 'Your Spiritual Guide for Kumbh Mela Nashik 2026';

// Nashik Kumbh Mela Center Location (Ramkund)
export const KUMBH_CENTER = {
    lat: 19.9975,
    lng: 73.7898,
    name: 'Ramkund',
    nameHi: 'रामकुंड'
};

// Emergency Numbers
export const EMERGENCY_CONTACTS = [
    { name: 'Ambulance', nameHi: 'एम्बुलेंस', number: '108', type: 'ambulance' as const },
    { name: 'Police', nameHi: 'पुलिस', number: '100', type: 'police' as const },
    { name: 'Fire', nameHi: 'अग्निशामक', number: '101', type: 'fire' as const },
    { name: 'Kumbh Control Room', nameHi: 'कुंभ कंट्रोल रूम', number: '1800-233-4444', type: 'helpdesk' as const },
    { name: 'Women Helpline', nameHi: 'महिला हेल्पलाइन', number: '1091', type: 'helpdesk' as const },
];

// Key Ghats and Religious Sites
export const GHATS = [
    { id: 'ramkund', name: 'Ramkund', nameHi: 'रामकुंड', lat: 19.9975, lng: 73.7898, description: 'The most sacred ghat where Lord Rama is believed to have bathed' },
    { id: 'tapovan', name: 'Tapovan', nameHi: 'तपोवन', lat: 20.0012, lng: 73.7945, description: 'Ancient site of meditation and penance' },
    { id: 'panchavati', name: 'Panchavati', nameHi: 'पंचवटी', lat: 19.9989, lng: 73.7912, description: 'Sacred place where Lord Rama spent time during exile' },
    { id: 'someshwar', name: 'Someshwar Ghat', nameHi: 'सोमेश्वर घाट', lat: 19.9945, lng: 73.7867, description: 'Ghat near the ancient Someshwar temple' },
];

// Facility Types with Icons
export const FACILITY_TYPES = {
    toilet: { icon: '🚻', name: 'Toilets', nameHi: 'शौचालय', color: '#4B5563' },
    water: { icon: '💧', name: 'Drinking Water', nameHi: 'पीने का पानी', color: '#3B82F6' },
    food: { icon: '🍲', name: 'Food Stalls', nameHi: 'भोजन', color: '#22C55E' },
    medical: { icon: '⚕️', name: 'First Aid', nameHi: 'प्राथमिक चिकित्सा', color: '#EF4444' },
    temple: { icon: '🛕', name: 'Temples', nameHi: 'मंदिर', color: '#F59E0B' },
    ghat: { icon: '🌊', name: 'Ghats', nameHi: 'घाट', color: '#06B6D4' },
    parking: { icon: '🅿️', name: 'Parking', nameHi: 'पार्किंग', color: '#8B5CF6' },
    helpdesk: { icon: '📞', name: 'Help Desk', nameHi: 'सहायता केंद्र', color: '#EC4899' },
    lostfound: { icon: '🔍', name: 'Lost & Found', nameHi: 'खोया-पाया', color: '#F97316' },
} as const;

// Kumbh Mela 2026 Important Dates (Shahi Snan)
export const SHAHI_SNAN_DATES = [
    { date: '2026-08-27', name: 'Pratham Shahi Snan', nameHi: 'प्रथम शाही स्नान', description: 'First royal bath' },
    { date: '2026-09-12', name: 'Dwitiya Shahi Snan', nameHi: 'द्वितीय शाही स्नान', description: 'Second royal bath' },
    { date: '2026-09-25', name: 'Tritiya Shahi Snan', nameHi: 'तृतीय शाही स्नान', description: 'Third royal bath' },
];

// Supported Languages
export const SUPPORTED_LANGUAGES = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

// Voice Assistant Greeting URL (to be updated with Kumbh-specific greeting)
export const GREETING_URL = '';

// Default Map Settings
export const MAP_CONFIG = {
    defaultZoom: 15,
    minZoom: 12,
    maxZoom: 18,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
};
