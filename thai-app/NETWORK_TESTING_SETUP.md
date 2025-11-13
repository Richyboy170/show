# 🌐 Network Testing Setup Guide

## Problem

When testing Google OAuth from another device on your network, the redirect goes to `localhost:3000`, which doesn't work because localhost only refers to the current machine.

## Solution

You need to use your computer's **network IP address** instead of localhost.

---

## 🔍 Your Network IP Address

**Your IP**: `192.168.2.135`

---

## 📝 Step-by-Step Fix

### Step 1: Update Google Cloud Console

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Navigate to**: APIs & Services → Credentials

3. **Click on**: Your OAuth 2.0 Client ID

4. **Add to Authorized redirect URIs**:
   ```
   http://192.168.2.135:3000/api/auth/callback/google
   ```

5. **Keep the existing localhost URI** (so local testing still works):
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. **Your Authorized redirect URIs should have BOTH**:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://192.168.2.135:3000/api/auth/callback/google`

7. **Click**: Save

---

### Step 2: Update Environment Variable

You have two options:

#### **Option A: Temporary Change (For Network Testing Only)**

Update `.env` file:

```bash
# Change this line:
NEXTAUTH_URL="http://localhost:3000"

# To this:
NEXTAUTH_URL="http://192.168.2.135:3000"
```

**Pros**: Simple, quick
**Cons**: Breaks localhost testing, need to change back

#### **Option B: Use Environment-Based URL (Recommended)**

Keep `.env` as is, but use a script that detects the URL:

Create `.env.local` (this file is gitignored):
```bash
# For network testing
NEXTAUTH_URL="http://192.168.2.135:3000"
```

Keep `.env` for localhost:
```bash
# For local testing
NEXTAUTH_URL="http://localhost:3000"
```

Next.js will automatically use `.env.local` if it exists, otherwise use `.env`.

---

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)

# Restart
npm run dev
```

---

### Step 4: Access from Network Device

On your other device (phone, tablet, etc.):

1. **Open browser**
2. **Go to**: `http://192.168.2.135:3000`
3. **Sign in with Google**
4. **Should redirect correctly** ✓

---

## 🎯 Quick Setup Commands

### Option 1: Update .env for Network Testing

```bash
# Stop server
# Press Ctrl+C

# Update NEXTAUTH_URL
# Edit .env file and change NEXTAUTH_URL to:
# NEXTAUTH_URL="http://192.168.2.135:3000"

# Restart server
npm run dev
```

Then access from network device: `http://192.168.2.135:3000`

---

### Option 2: Use .env.local (Recommended)

```bash
# Create .env.local file
cd thai-app

# Windows Command Prompt:
echo NEXTAUTH_URL="http://192.168.2.135:3000" > .env.local

# Or manually create .env.local with content:
# NEXTAUTH_URL="http://192.168.2.135:3000"

# Restart server
npm run dev
```

Then access from network device: `http://192.168.2.135:3000`

When you want to test locally again, just delete `.env.local`.

---

## 🔧 Google Cloud Console Setup (Detailed)

### Current Redirect URIs Needed:

```
Authorized JavaScript origins:
  http://localhost:3000
  http://192.168.2.135:3000

Authorized redirect URIs:
  http://localhost:3000/api/auth/callback/google
  http://192.168.2.135:3000/api/auth/callback/google
```

### How to Add:

1. **Login**: [console.cloud.google.com](https://console.cloud.google.com/)

2. **Select your project**

3. **Navigate**:
   - Click "APIs & Services" (left sidebar)
   - Click "Credentials"

4. **Find your OAuth 2.0 Client**:
   - Look for client ID: `901162874037-bhgv3em7agh62kbto49r31laggojuok2.apps.googleusercontent.com`
   - Click on it

5. **Add URIs**:
   - Under "Authorized JavaScript origins", click "+ ADD URI"
     - Add: `http://192.168.2.135:3000`

   - Under "Authorized redirect URIs", click "+ ADD URI"
     - Add: `http://192.168.2.135:3000/api/auth/callback/google`

6. **Click "SAVE"** at the bottom

7. **Wait 5 minutes** for changes to propagate

---

## 🧪 Testing Checklist

### On Host Computer (192.168.2.135):

- [ ] Google Cloud Console updated with network IP redirect URI
- [ ] `.env` or `.env.local` has NEXTAUTH_URL with network IP
- [ ] Dev server restarted
- [ ] Can access site at `http://192.168.2.135:3000`
- [ ] Google sign-in redirects correctly

### On Network Device (Phone/Tablet/Other Computer):

- [ ] Connected to same WiFi/network
- [ ] Can access `http://192.168.2.135:3000`
- [ ] Click "Sign In" works
- [ ] "Continue with Google" works
- [ ] Redirect after Google login works ✓
- [ ] Arrives back at site (not localhost error)

---

## 🚨 Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Cause**: Google OAuth redirect URI not configured

**Solution**:
1. Check Google Cloud Console has the network IP redirect URI
2. Make sure you clicked "SAVE"
3. Wait 5 minutes for changes to propagate
4. Try again

### Issue: Still Redirecting to localhost

**Cause**: NEXTAUTH_URL still set to localhost

**Solution**:
```bash
# Check .env file
cat .env | grep NEXTAUTH_URL

# Should show:
# NEXTAUTH_URL="http://192.168.2.135:3000"

# If not, update it and restart server
```

### Issue: Can't Access Site from Network

**Cause**: Firewall blocking or wrong IP

**Solution**:
1. **Check firewall**: Windows Firewall might be blocking port 3000
2. **Allow Node.js** through firewall
3. **Verify IP** is correct: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
4. **Check same network**: Both devices on same WiFi

### Issue: "This site can't be reached"

**Cause**: Dev server not accessible from network

**Solution**:
```bash
# Stop server
# Ctrl+C

# Start server bound to all network interfaces
npm run dev -- -H 0.0.0.0
```

Or update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

---

## 🔒 Security Notes

### For Development Only

- ✅ This setup is for **local network testing only**
- ✅ Only devices on your WiFi can access
- ❌ **NOT** accessible from internet
- ❌ **NOT** for production use

### For Production

When deploying to production:
- Use a proper domain name
- Use HTTPS (not HTTP)
- Update Google OAuth redirect URIs to production domain
- Update NEXTAUTH_URL to production URL

Example:
```bash
NEXTAUTH_URL="https://yourdomain.com"
```

---

## 📱 Common Testing Scenarios

### Scenario 1: Testing on Phone

1. **Host computer**: `192.168.2.135:3000`
2. **Phone**: Connected to same WiFi
3. **Access**: `http://192.168.2.135:3000`
4. **Sign in**: Works ✓

### Scenario 2: Testing on Another Laptop

1. **Host computer**: Running dev server on `192.168.2.135:3000`
2. **Other laptop**: Connected to same WiFi
3. **Access**: `http://192.168.2.135:3000`
4. **Sign in**: Works ✓

### Scenario 3: Testing Locally AND Remotely

**Use `.env.local` method**:

For network testing:
```bash
# Create .env.local
NEXTAUTH_URL="http://192.168.2.135:3000"

# Access from network: http://192.168.2.135:3000
```

For local testing:
```bash
# Delete .env.local
# Falls back to .env with localhost

# Access locally: http://localhost:3000
```

---

## 🎯 Quick Reference

### Your Network IP
```
192.168.2.135
```

### URLs to Use

**Local Testing**:
```
http://localhost:3000
```

**Network Testing**:
```
http://192.168.2.135:3000
```

### Google OAuth Redirect URIs (Both Needed)

```
http://localhost:3000/api/auth/callback/google
http://192.168.2.135:3000/api/auth/callback/google
```

### Environment Variable

**For Local**:
```bash
NEXTAUTH_URL="http://localhost:3000"
```

**For Network**:
```bash
NEXTAUTH_URL="http://192.168.2.135:3000"
```

---

## ✅ Recommended Setup

**Best practice for easy switching**:

1. **Keep `.env` for localhost**:
   ```bash
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Create `.env.local` for network testing**:
   ```bash
   NEXTAUTH_URL="http://192.168.2.135:3000"
   ```

3. **Add both redirect URIs to Google Console**

4. **Switch by renaming files**:
   - Network testing: Keep `.env.local`
   - Local testing: Delete or rename `.env.local`

---

## 🚀 Next Steps

1. [ ] Add `http://192.168.2.135:3000/api/auth/callback/google` to Google Cloud Console
2. [ ] Update NEXTAUTH_URL in `.env` or create `.env.local`
3. [ ] Restart dev server
4. [ ] Test from network device: `http://192.168.2.135:3000`
5. [ ] Verify Google sign-in redirects correctly

---

**Your network IP**: `192.168.2.135`
**Network URL**: `http://192.168.2.135:3000`
**Callback URL**: `http://192.168.2.135:3000/api/auth/callback/google`

Update Google OAuth settings and restart your server!
