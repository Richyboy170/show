# 🌐 Network Testing with ngrok - Solution for OAuth

## ❌ The Problem

Google OAuth **rejects local IP addresses** like `http://192.168.2.135:3000` with these errors:
- "Must end with a public top-level domain"
- "Must use a valid top private domain"

**Why?** OAuth 2.0 security requirements don't allow local IP addresses in production OAuth apps.

---

## ✅ The Solution: Use ngrok

**ngrok** creates a secure tunnel from a public URL to your local development server. This gives you a real HTTPS URL that Google OAuth accepts.

**Your setup:**
- Local server: `http://localhost:3000`
- ngrok tunnel: `https://abc123.ngrok.io` → tunnels to your localhost:3000
- Accessible from ANY device with internet connection

---

## 📦 Step 1: Install ngrok

### Option A: Download Installer (Recommended)
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract the ZIP file
4. Move `ngrok.exe` to a convenient location (e.g., `C:\ngrok\ngrok.exe`)

### Option B: Using npm (Alternative)
```bash
npm install -g ngrok
```

---

## 🔐 Step 2: Create Free ngrok Account (Optional but Recommended)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up for free account
3. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken
4. Run this once to authenticate:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

**Benefits of free account:**
- Longer session times
- Custom subdomain (paid plans)
- More concurrent tunnels

**Without account:**
- Still works but URL changes every time you restart ngrok
- Limited session time

---

## 🚀 Step 3: Start ngrok Tunnel

### 1. Start Your Development Server First
```bash
cd C:\Users\HP\Desktop\Special Code\show\thai-app
npm run dev
```

### 2. Open New Terminal and Start ngrok
```bash
# If you extracted ngrok.exe:
C:\path\to\ngrok.exe http 3000

# If installed via npm:
ngrok http 3000
```

### 3. You'll See Output Like This:
```
ngrok

Session Status                online
Account                       your@email.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**IMPORTANT:** Copy the HTTPS URL from the "Forwarding" line:
```
https://abc123def456.ngrok-free.app
```

This is your **public URL** that works from any device!

---

## 🔧 Step 4: Update Environment Variables

### Update `.env` or `.env.local`:
```bash
# Replace with YOUR ngrok URL (the one from the terminal output)
NEXTAUTH_URL="https://abc123def456.ngrok-free.app"
```

### Restart Your Dev Server
```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

---

## 🌐 Step 5: Update Google Cloud Console

### Add ngrok URL to OAuth Redirect URIs

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Navigate to**: APIs & Services → Credentials

3. **Click on**: Your OAuth 2.0 Client ID

4. **Add to Authorized JavaScript origins**:
   ```
   https://abc123def456.ngrok-free.app
   ```

5. **Add to Authorized redirect URIs**:
   ```
   https://abc123def456.ngrok-free.app/api/auth/callback/google
   ```

6. **Keep your localhost URIs** (for local testing):
   ```
   http://localhost:3000
   http://localhost:3000/api/auth/callback/google
   ```

7. **Your full list should be**:
   ```
   Authorized JavaScript origins:
     http://localhost:3000
     https://abc123def456.ngrok-free.app

   Authorized redirect URIs:
     http://localhost:3000/api/auth/callback/google
     https://abc123def456.ngrok-free.app/api/auth/callback/google
   ```

8. **Click**: Save

9. **Wait 5 minutes** for changes to propagate

---

## 📱 Step 6: Test from Any Device

### On Host Computer (Running Dev Server):
1. Dev server running: ✓
2. ngrok tunnel running: ✓
3. Access site at: `https://abc123def456.ngrok-free.app`

### On Network Devices (Phone, Tablet, Other Computer):
1. **Connect to internet** (doesn't have to be same WiFi!)
2. **Open browser**
3. **Go to**: `https://abc123def456.ngrok-free.app`
4. **Sign in with Google**: Should work perfectly ✓

### On Any Device Anywhere:
- Your friend in another city can test your site
- Works from mobile data, different WiFi networks, anywhere with internet
- Perfect for remote testing

---

## ✅ Testing Checklist

### Before Testing:
- [ ] Dev server running: `npm run dev`
- [ ] ngrok tunnel running: `ngrok http 3000`
- [ ] Copied ngrok HTTPS URL from terminal
- [ ] Updated `NEXTAUTH_URL` in `.env` or `.env.local`
- [ ] Restarted dev server
- [ ] Added ngrok URL to Google Cloud Console
- [ ] Waited 5 minutes after saving Google Console changes

### During Testing:
- [ ] Can access site via ngrok URL from host computer
- [ ] Can access site via ngrok URL from phone/tablet
- [ ] "Sign In" button works
- [ ] "Continue with Google" works
- [ ] OAuth redirect works (no localhost error)
- [ ] Successfully signed in and redirected to home page

---

## 🎯 Example Full Setup

**Your terminal should have TWO windows running:**

**Terminal 1 - Dev Server:**
```bash
C:\Users\HP\Desktop\Special Code\show\thai-app> npm run dev

> thai-app@0.1.0 dev
> next dev

   ▲ Next.js 15.0.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.2.135:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Terminal 2 - ngrok:**
```bash
C:\Users\HP> ngrok http 3000

ngrok

Session Status                online
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

🌐 Your public URL: https://abc123def456.ngrok-free.app
```

**Your `.env.local`:**
```bash
NEXTAUTH_URL="https://abc123def456.ngrok-free.app"
```

**Google Cloud Console Redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://abc123def456.ngrok-free.app/api/auth/callback/google
```

---

## 🔄 Important Notes

### ngrok URL Changes Each Time
**Without paid account**, the ngrok URL is **random every time** you restart ngrok.

**Example:**
- First run: `https://abc123.ngrok-free.app`
- Second run: `https://xyz789.ngrok-free.app` ← Different!

**Solution:**
Each time you restart ngrok, you need to:
1. Copy new ngrok URL
2. Update `NEXTAUTH_URL` in `.env.local`
3. Update Google Cloud Console redirect URIs
4. Restart dev server

### To Keep Same URL (Paid Plans)
ngrok paid plans allow **custom subdomains**:
```bash
ngrok http 3000 --subdomain=my-thai-app
# Always: https://my-thai-app.ngrok.io
```

Then you only need to set up Google OAuth once!

---

## 🚨 Troubleshooting

### Issue: "ngrok: command not found"

**Solution**: Use full path to ngrok.exe:
```bash
C:\path\to\ngrok.exe http 3000
```

Or add ngrok to your PATH environment variable.

---

### Issue: "tunnel not found" or "ERR_TUNNEL_CONNECTION_FAILED"

**Cause**: ngrok tunnel closed or expired

**Solution**:
1. Check if ngrok terminal is still running
2. Restart ngrok if needed
3. Copy new URL and update `.env.local`
4. Restart dev server

---

### Issue: "redirect_uri_mismatch" Error

**Cause**: Google OAuth redirect URI doesn't match

**Solution**:
1. Check Google Cloud Console has **exact** ngrok URL with callback path:
   ```
   https://abc123def456.ngrok-free.app/api/auth/callback/google
   ```
2. Check `NEXTAUTH_URL` in `.env.local` matches ngrok URL (without callback path):
   ```
   NEXTAUTH_URL="https://abc123def456.ngrok-free.app"
   ```
3. Make sure you restarted dev server after changing `.env.local`
4. Wait 5 minutes for Google OAuth changes to propagate

---

### Issue: Still redirects to localhost

**Cause**: Old `NEXTAUTH_URL` still in use

**Solution**:
```bash
# Stop dev server (Ctrl+C)

# Check .env.local exists and has ngrok URL
cat .env.local
# Should show: NEXTAUTH_URL="https://your-ngrok-url.ngrok-free.app"

# Restart dev server
npm run dev
```

---

### Issue: ngrok "Account limit reached"

**Cause**: Free account has connection limits

**Solution**:
1. Close other ngrok sessions
2. Restart ngrok
3. Or upgrade to paid plan for more connections

---

### Issue: "ngrok browser warning page" appears

**Cause**: ngrok free tier shows warning page before tunneling

**Solution**: Click "Visit Site" button to continue. This is normal for free accounts.

---

## 💡 Alternatives to ngrok

If ngrok doesn't work for you, here are alternatives:

### 1. LocalTunnel
```bash
npm install -g localtunnel
lt --port 3000
```

### 2. Cloudflare Tunnel
```bash
# Download cloudflared
cloudflared tunnel --url http://localhost:3000
```

### 3. serveo.net (No installation)
```bash
ssh -R 80:localhost:3000 serveo.net
```

### 4. Tailscale Funnel
- Install Tailscale
- Use Funnel feature to expose local service

All of these provide a public URL that Google OAuth will accept.

---

## 📊 Comparison: Local IP vs ngrok

| Feature | Local IP (192.168.2.135) | ngrok URL |
|---------|-------------------------|-----------|
| **Works with Google OAuth** | ❌ Rejected | ✅ Accepted |
| **Same Network Only** | ✓ | ✗ (works everywhere) |
| **HTTPS** | ❌ HTTP only | ✅ HTTPS included |
| **Setup Complexity** | Simple | Moderate |
| **URL Changes** | Never | Each restart (free) |
| **Remote Testing** | ❌ No | ✅ Yes |
| **Cost** | Free | Free (basic) |

---

## 🎉 Success Criteria

Your network testing setup is working when:

- [ ] ngrok tunnel running and showing HTTPS URL
- [ ] Dev server running
- [ ] `NEXTAUTH_URL` set to ngrok URL
- [ ] Google OAuth has ngrok redirect URI
- [ ] Can access site from any device via ngrok URL
- [ ] Google sign-in works from any device
- [ ] No "localhost" or "redirect_uri_mismatch" errors

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start dev server
cd C:\Users\HP\Desktop\Special Code\show\thai-app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Copy the HTTPS URL from ngrok output
# Update .env.local with: NEXTAUTH_URL="https://your-ngrok-url.ngrok-free.app"
# Add URL to Google Cloud Console OAuth settings
# Restart dev server (Ctrl+C, then npm run dev)
# Test from any device: https://your-ngrok-url.ngrok-free.app
```

---

## 📝 Summary

**Problem**: Google OAuth rejects local IP addresses (192.168.2.135)

**Solution**: Use ngrok to get a public HTTPS URL

**Benefits**:
- ✅ Works with Google OAuth
- ✅ HTTPS included
- ✅ Test from any device anywhere
- ✅ Free tier available
- ✅ Easy to set up

**Steps**:
1. Install ngrok
2. Start dev server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy ngrok URL
5. Update `NEXTAUTH_URL` in `.env.local`
6. Add URL to Google Cloud Console
7. Restart dev server
8. Test from any device! 🎉

---

**Your next action**: Download and install ngrok, then follow the steps above!

**Download ngrok**: https://ngrok.com/download

---

**Status**: 🔧 SOLUTION READY
**Alternative**: Network IP testing not possible with Google OAuth
**Recommended**: Use ngrok for network/remote testing
**Benefit**: Test from ANY device with internet, not just local network

---

**Made for network testing Thai Lyrics Website** 🎵
