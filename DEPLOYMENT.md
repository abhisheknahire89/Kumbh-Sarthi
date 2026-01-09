# Kumbh Sarthi - Deployment Guide

## 🚀 Deploying to Vercel

This guide covers deploying both the **Pilgrim Web App** and the **Control Room Dashboard** to Vercel.

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Google Gemini API key](https://aistudio.google.com/apikey)
3. (Optional) [Supabase account](https://supabase.com) for authentication

---

## 📦 Deployment Steps

### 1. Push to GitHub

```bash
# Add all changes
git add .

# Commit changes
git commit -m "feat: Add multi-language support and control dashboard"

# Push to GitHub
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `abhisheknahire89/Kumbh-Sarthi`
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required:
```
VITE_GEMINI_API_KEY=your_actual_gemini_api_key
```

#### Optional (for authentication):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🌐 Accessing the Applications

After deployment, you'll get a URL like: `https://kumbh-sarthi.vercel.app`

### Pilgrim Web App
- **URL:** `https://your-domain.vercel.app/`
- **Features:** Chat, Map, Facilities, Lost & Found, SOS

### Control Room Dashboard
- **URL:** `https://your-domain.vercel.app/?mode=admin`
- **Features:** Live incident monitoring, SLA metrics, real-time map

---

## 🔧 Build Configuration

The project uses Vite with the following configuration:

```javascript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet'],
          'mqtt-vendor': ['mqtt']
        }
      }
    }
  }
})
```

---

## 🌍 Multi-Language Support

The app supports 6 languages:
- English (en)
- Hindi (hi)
- Marathi (mr)
- Gujarati (gu)
- Telugu (te)
- Tamil (ta)

All translations are stored in `/locales/*.json` files.

---

## 📡 Real-time Features

### MQTT Configuration
The app uses HiveMQ public broker for real-time emergency alerts:
- **Broker:** `wss://broker.hivemq.com:8000/mqtt`
- **Topic:** `kumbh-sarthi/emergencies/v1`

No additional configuration needed - works out of the box!

### Socket.IO Server (Optional)
For local development, you can run the Socket.IO server:

```bash
node server/index.js
```

This is **not required for production** as the app uses MQTT for real-time features.

---

## 🔒 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** in Vercel for sensitive data
3. **Rotate API keys** regularly
4. **Enable Supabase RLS** (Row Level Security) if using authentication

---

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `VITE_GEMINI_API_KEY` is set in Vercel environment variables

### MQTT Not Connecting
- Check browser console for WebSocket errors
- Ensure the broker URL is correct: `wss://broker.hivemq.com:8000/mqtt`
- Some corporate networks may block WebSocket connections

### Map Not Loading
- Check that Leaflet CSS is imported in `index.html`
- Verify network requests are not blocked

---

## 📊 Performance Optimization

The app is optimized for production with:
- ✅ Code splitting
- ✅ Lazy loading
- ✅ PWA support (offline capability)
- ✅ Optimized bundle size
- ✅ CDN delivery via Vercel

---

## 🎯 Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `kumbhsarthi.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

## 📞 Support

For issues or questions:
- GitHub Issues: [abhisheknahire89/Kumbh-Sarthi](https://github.com/abhisheknahire89/Kumbh-Sarthi/issues)
- Email: support@kumbhsarthi.com

---

## 🙏 Credits

Built for **Kumbh Mela Nashik 2026**  
Powered by Google Gemini AI, Leaflet Maps, and MQTT
