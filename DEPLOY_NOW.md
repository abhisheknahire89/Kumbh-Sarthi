# 🚀 Quick Deployment Guide

## ✅ Code Successfully Pushed to GitHub!

Your code has been pushed to: **https://github.com/abhisheknahire89/Kumbh-Sarthi**

---

## 📦 Deploy to Vercel (2 Options)

### **Option 1: Deploy via Vercel Dashboard (Easiest)**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login with your GitHub account

2. **Import Project**
   - Click **"Add New Project"**
   - Select **"Import Git Repository"**
   - Choose: `abhisheknahire89/Kumbh-Sarthi`

3. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_GEMINI_API_KEY = AIzaSyD5uu9Tgfdi62qs8y7DQpIYsX3fLHlfHuM
   ```
   
   *(Optional - for authentication):*
   ```
   VITE_SUPABASE_URL = your_supabase_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://kumbh-sarthi.vercel.app`

---

### **Option 2: Deploy via CLI**

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy (production)
npx vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (first time) or Yes (subsequent)
# - What's your project's name? kumbh-sarthi
# - In which directory is your code located? ./
```

**Important:** After deployment, go to Vercel Dashboard → Your Project → Settings → Environment Variables and add `VITE_GEMINI_API_KEY`

---

## 🌐 Accessing Your Deployed Apps

Once deployed, you'll have:

### **Pilgrim Web App**
```
https://your-domain.vercel.app/
```
Features:
- Multi-language chat assistant
- Interactive maps
- Emergency SOS
- Lost & Found

### **Control Room Dashboard**
```
https://your-domain.vercel.app/?mode=admin
```
Features:
- Real-time SLA metrics
- Live incident monitoring
- Control room map
- Emergency management

---

## 🔧 Post-Deployment Checklist

- [ ] Verify the Pilgrim App loads correctly
- [ ] Test language switching (6 languages)
- [ ] Check the map displays properly
- [ ] Test SOS emergency panel
- [ ] Access Control Dashboard with `?mode=admin`
- [ ] Verify MQTT connection (check browser console)
- [ ] Test emergency reporting from app to dashboard

---

## 📊 Monitoring

After deployment, monitor your app:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Analytics:** View traffic and performance
- **Logs:** Check deployment and runtime logs
- **Domains:** Add custom domain if needed

---

## 🐛 Troubleshooting

### Build Fails
- Check that `VITE_GEMINI_API_KEY` is set in environment variables
- Verify all dependencies are in `package.json`

### App Loads but Chat Doesn't Work
- Verify `VITE_GEMINI_API_KEY` is correctly set
- Check browser console for API errors

### MQTT Not Connecting
- Check browser console for WebSocket errors
- Some corporate networks block WebSocket connections
- The app will still work, but real-time updates may be delayed

### Map Not Loading
- Check browser console for Leaflet errors
- Verify network requests are not blocked

---

## 🎯 Custom Domain (Optional)

To add a custom domain like `kumbhsarthi.com`:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning (automatic)

---

## 📱 Share Your App

Once deployed, share these URLs:

**For Pilgrims:**
```
https://your-domain.vercel.app/
```

**For Control Room Staff:**
```
https://your-domain.vercel.app/?mode=admin
```

---

## 🔄 Continuous Deployment

Good news! Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically build and deploy! 🚀
```

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Deployment Guide:** See `DEPLOYMENT.md` in your repo
- **GitHub Issues:** https://github.com/abhisheknahire89/Kumbh-Sarthi/issues

---

**🙏 Your Kumbh Sarthi app is ready to deploy!**

Choose Option 1 (Dashboard) for the easiest deployment experience.
