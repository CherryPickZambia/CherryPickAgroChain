# 🚀 Cherry Pick - Vercel Deployment Guide

## ✅ **Rebranding Complete!**

All references to "AgroChain360" have been changed to "Cherry Pick":
- ✅ Package name: `cherry-pick`
- ✅ Page title: "Cherry Pick - Blockchain Contract Farming Platform"
- ✅ Contract IDs: `CP-` prefix
- ✅ QR codes: `https://cherrypick.co.zm/trace/`
- ✅ README updated
- ✅ Pushed to GitHub

---

## 🌐 **Deploy to Vercel (2 Options)**

### **Option 1: Vercel Dashboard (Recommended - Easiest)**

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Click "Sign Up" or "Log In"
   - Use GitHub to sign in

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose `Basezambia/cherry-pick`
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `cherry-pick`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)

4. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Coinbase CDP
   NEXT_PUBLIC_CDP_PROJECT_ID=your-cdp-project-id
   CDP_API_KEY=your-cdp-api-key
   CDP_WALLET_SECRET=your-cdp-wallet-secret

   # OpenAI (Get your own key from https://platform.openai.com/api-keys)
   OPENAI_API_KEY=your-openai-api-key

   # Pinata IPFS
   PINATA_API_KEY=your-pinata-api-key
   PINATA_API_SECRET=your-pinata-api-secret
   PINATA_JWT=your-pinata-jwt
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - ✅ Your site will be live!

---

### **Option 2: Vercel CLI (Advanced)**

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Follow Prompts:**
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **cherry-pick**
   - Directory? **./  (press Enter)**
   - Override settings? **N**

4. **Add Environment Variables:**
   After deployment, go to:
   - https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add all variables from above

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## 🔗 **Your Live URLs**

After deployment, you'll get:
- **Production:** `https://cherry-pick.vercel.app`
- **Custom Domain:** (Optional) Add `cherrypick.co.zm`

---

## 🎯 **Post-Deployment Checklist**

### **1. Test Core Features:**
- [ ] Visit your live URL
- [ ] Connect wallet
- [ ] Create a contract
- [ ] View milestones
- [ ] Generate QR code
- [ ] Browse marketplace

### **2. Configure Custom Domain (Optional):**
1. Go to Project Settings → Domains
2. Add `cherrypick.co.zm`
3. Update DNS records as instructed
4. Wait for SSL certificate

### **3. Set Up Continuous Deployment:**
- ✅ Already configured!
- Every push to `master` auto-deploys
- Preview deployments for PRs

### **4. Monitor Performance:**
- Go to Analytics tab
- Check Core Web Vitals
- Monitor errors in Logs

---

## 📊 **Deployment Status**

```
✅ Project Renamed: Cherry Pick
✅ GitHub Updated: https://github.com/Basezambia/cherry-pick
✅ Ready for Vercel: Yes
⏳ Vercel Deployment: Pending your action
```

---

## 🔐 **Security Notes**

### **Environment Variables:**
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel's Environment Variables
- ✅ Rotate keys if exposed
- ✅ Use different keys for dev/prod

### **API Keys to Protect:**
- Supabase Service Role Key
- CDP Wallet Secret
- OpenAI API Key
- Pinata JWT

---

## 🚀 **Quick Deploy Command**

If you've already logged in to Vercel CLI:

```bash
cd "c:/Users/lisel/OneDrive/Pictures/cherry pick/agrochain360"
vercel --prod
```

Then add environment variables in Vercel dashboard.

---

## 📝 **What Changed:**

### **Files Updated:**
1. ✅ `package.json` - Name changed to "cherry-pick"
2. ✅ `app/layout.tsx` - Title changed to "Cherry Pick"
3. ✅ `README.md` - All references updated
4. ✅ `components/FarmerDashboard.tsx` - QR URL updated
5. ✅ `lib/utils.ts` - Contract ID prefix changed to "CP-"
6. ✅ `lib/utils.ts` - QR code URL updated

### **New Branding:**
- **Name:** Cherry Pick
- **URL:** cherrypick.co.zm
- **Contract Prefix:** CP-
- **QR Codes:** https://cherrypick.co.zm/trace/{id}

---

## 🎉 **Next Steps:**

1. **Deploy via Vercel Dashboard** (Easiest)
   - Go to https://vercel.com
   - Import `Basezambia/cherry-pick`
   - Add environment variables
   - Click Deploy

2. **Test Your Live Site**
   - Connect wallet
   - Create contract
   - Verify all features work

3. **Add Custom Domain** (Optional)
   - Point cherrypick.co.zm to Vercel
   - Enable SSL

4. **Share Your Live URL!** 🎊

---

## 📞 **Need Help?**

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Support: https://vercel.com/support

---

*Deployment Guide Created: November 7, 2024*
*Status: READY TO DEPLOY ✅*
