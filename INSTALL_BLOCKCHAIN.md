# Install Blockchain Dependencies

## ⚠️ Current Status

The blockchain files have been created but dependencies are not yet installed. You'll see TypeScript errors in:
- `hardhat.config.ts`
- `scripts/deploy.ts`

**This is expected and will be fixed after installation.**

## 🚀 Quick Install

Run this command to install all blockchain dependencies:

```bash
npm install --legacy-peer-deps
```

This will install:
- Hardhat (smart contract development framework)
- OpenZeppelin Contracts (secure, audited contract libraries)
- Hardhat Toolbox (testing, deployment, verification tools)
- dotenv (environment variable management)

## ✅ Verify Installation

After installation, the TypeScript errors should disappear. Verify by running:

```bash
npx hardhat --version
```

Expected output:
```
2.22.0
```

## 📝 Next Steps

After installation:

1. **Follow Setup Guide**: See `BLOCKCHAIN_SETUP.md`
2. **Get Test ETH**: From Base Sepolia faucet
3. **Deploy Contracts**: `npm run deploy:testnet`
4. **Test Integration**: Create a test contract from your app

## 🆘 Troubleshooting

### "Cannot find module 'hardhat'"
- Run: `npm install --legacy-peer-deps`
- Make sure you're in the project root directory

### "Peer dependency warnings"
- Use `--legacy-peer-deps` flag
- These warnings are safe to ignore

### "Out of memory"
- Increase Node memory: `export NODE_OPTIONS="--max-old-space-size=4096"`
- Or use: `node --max-old-space-size=4096 node_modules/.bin/hardhat compile`

## 📚 Documentation

- Quick Setup: `BLOCKCHAIN_SETUP.md`
- Full Guide: `BLOCKCHAIN_INTEGRATION_GUIDE.md`
- Summary: `BLOCKCHAIN_SUMMARY.md`
