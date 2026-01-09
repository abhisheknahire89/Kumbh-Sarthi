# 🙏 Kumbh Sarthi - Your Guide for Kumbh Mela Nashik 2026

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🌟 Overview

**Kumbh Sarthi** is a comprehensive AI-powered assistant and control system designed for the Kumbh Mela Nashik 2026. It provides pilgrims with real-time information, emergency services, and navigation assistance in 6 languages, while offering authorities a powerful control dashboard for monitoring and managing emergencies.

### 🎯 Key Features

#### For Pilgrims (Web App)
- 🤖 **AI Chat Assistant** - Powered by Google Gemini for instant answers
- 🗺️ **Interactive Maps** - Find toilets, water, food, medical facilities, temples, and more
- 🆘 **Emergency SOS** - One-tap access to ambulance, police, fire, and helplines
- 🌐 **Multi-language Support** - English, Hindi, Marathi, Gujarati, Telugu, Tamil
- 🔍 **Lost & Found** - Report and search for lost persons
- 📱 **PWA Support** - Install as a mobile app, works offline

#### For Authorities (Control Dashboard)
- 📊 **Real-time SLA Metrics** - Detection, Dispatch, Response, Resolution times
- 🚨 **Live Incident Feed** - Monitor all emergencies as they happen
- 🗺️ **Control Room Map** - Visualize incidents across zones
- 📡 **MQTT Integration** - Serverless real-time updates
- 📈 **Analytics Dashboard** - Track trends and performance

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/abhisheknahire89/Kumbh-Sarthi.git
cd Kumbh-Sarthi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your VITE_GEMINI_API_KEY

# Run the development server
npm run dev
```

The app will be available at:
- **Pilgrim App:** http://localhost:3000/
- **Control Dashboard:** http://localhost:3000/?mode=admin

### Optional: Run Socket.IO Server

```bash
# In a separate terminal
node server/index.js
```

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abhisheknahire89/Kumbh-Sarthi)

Or manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Important:** Set the `VITE_GEMINI_API_KEY` environment variable in your Vercel project settings.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🏗️ Project Structure

```
kumbh-sarthi/
├── components/          # React components
│   ├── admin/          # Control dashboard components
│   ├── ChatInterface.tsx
│   ├── MapView.tsx
│   ├── EmergencyPanel.tsx
│   └── ...
├── pages/              # Page components
├── services/           # API and service integrations
│   ├── emergencyService.ts  # MQTT emergency handling
│   ├── locationService.ts   # Geolocation services
│   └── ragService.ts        # AI chat service
├── locales/            # i18n translations (6 languages)
├── server/             # Socket.IO server (optional)
├── App.tsx             # Main app component
├── constants.ts        # App configuration
└── types.ts            # TypeScript types
```

---

## 🌍 Supported Languages

- 🇬🇧 English (en)
- 🇮🇳 हिंदी (hi)
- 🇮🇳 मराठी (mr)
- 🇮🇳 ગુજરાતી (gu)
- 🇮🇳 తెలుగు (te)
- 🇮🇳 தமிழ் (ta)

---

## 🔧 Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **AI:** Google Gemini API
- **Maps:** Leaflet.js
- **Real-time:** MQTT (HiveMQ), Socket.IO
- **i18n:** i18next, react-i18next
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Optional:** Supabase (authentication)

---

## 📡 Real-time Architecture

```
Pilgrim App (SOS) → MQTT Broker → Control Dashboard
                  ↓
            Local Cache
                  ↓
        Socket.IO Server (backup)
```

- **MQTT Broker:** HiveMQ Public Broker (`wss://broker.hivemq.com:8000/mqtt`)
- **Topic:** `kumbh-sarthi/emergencies/v1`
- **Serverless:** No backend required for real-time features

---

## 🎨 Screenshots

### Pilgrim Web App
- Multi-language chat interface
- Interactive facility maps
- Emergency SOS panel
- Lost & Found system

### Control Dashboard
- Real-time SLA metrics
- Live incident feed
- Interactive control map
- Emergency detail panels

---

## 🔒 Security & Privacy

- ✅ Environment variables for sensitive data
- ✅ No personal data stored without consent
- ✅ Secure HTTPS connections
- ✅ MQTT over WSS (WebSocket Secure)
- ✅ Content Security Policy headers
- ✅ XSS protection

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Kumbh Mela Nashik 2026** organizing committee
- **Google Gemini AI** for powering the chat assistant
- **HiveMQ** for the public MQTT broker
- **Leaflet** for mapping capabilities
- **Open Source Community** for amazing tools and libraries

---

## 📞 Support

For questions, issues, or feedback:
- 📧 Email: support@kumbhsarthi.com
- 🐛 Issues: [GitHub Issues](https://github.com/abhisheknahire89/Kumbh-Sarthi/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/abhisheknahire89/Kumbh-Sarthi/discussions)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ for Kumbh Mela Nashik 2026** 🙏
