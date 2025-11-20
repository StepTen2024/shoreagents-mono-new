# ✅ Update Release Checklist

Print this and check off items as you go!

---

## 📝 Pre-Release
- [ ] All code changes committed and tested
- [ ] Decided on version number (current: _____ → new: _____)
- [ ] Release notes written

---

## 🔢 Update Version Numbers

- [ ] **package.json** → Line 3: `"version": "1.0.1"`
- [ ] **electron-builder.yml** → Line 60: `version: 1.0.1`
- [ ] **components/staff/desktop-app-download.tsx** → Lines 7 & 11:
  - [ ] `appVersion = "1.0.1"`
  - [ ] `downloadUrl = ".../v1.0.1/...1.0.1.exe"`

---

## 🔨 Build

- [ ] Run: `npm run electron:build:railway`
- [ ] Wait for completion (~3-5 minutes)
- [ ] Verify `dist/` folder contains:
  - [ ] `ShoreAgentsAI-Setup-1.0.1.exe`
  - [ ] `latest.yml`

---

## 📦 GitHub Release

- [ ] Go to: https://github.com/StepTen2024/shoreagents-mono-new/releases
- [ ] Click "Draft a new release"
- [ ] Tag: `v1.0.1` (with 'v' prefix)
- [ ] Title: `v1.0.1 - [Description]`
- [ ] Description: Add release notes
- [ ] Upload files:
  - [ ] `ShoreAgentsAI-Setup-1.0.1.exe`
  - [ ] `latest.yml` ⚠️ **CRITICAL**
- [ ] Click "Publish release" (not draft)

---

## 🌐 Update Website

```bash
git add package.json electron-builder.yml components/staff/desktop-app-download.tsx
git commit -m "Release v1.0.1"
git push origin deployed
```

- [ ] Changes committed
- [ ] Changes pushed
- [ ] Railway deployment started
- [ ] Railway deployment completed (check dashboard)
- [ ] Website updated: https://shoreagents.ai/login/staff

---

## ✅ Verify

- [ ] GitHub release is published and visible
- [ ] Both files (.exe and .yml) uploaded to release
- [ ] Website download button works
- [ ] Test new installation (optional)
- [ ] Test auto-update from previous version

---

## 📊 Quick URLs

- **GitHub Releases:** https://github.com/StepTen2024/shoreagents-mono-new/releases
- **Railway Dashboard:** https://railway.app
- **Website:** https://shoreagents.ai/login/staff
- **This Release:** https://github.com/StepTen2024/shoreagents-mono-new/releases/tag/v_____

---

## ⚠️ Emergency Rollback

If something goes wrong:

1. Delete the problematic GitHub release
2. Revert website changes:
   ```bash
   git revert HEAD
   git push origin deployed
   ```
3. Users on old version will continue working normally

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on download | Check tag name matches in download URL |
| Auto-update not working | Verify latest.yml is uploaded |
| Railway not deploying | Check build logs in Railway dashboard |
| Users not seeing update | Check they're on Electron app, not web |

---

## 🎯 Version History

Track your releases:

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2025-11-12 | Initial release |
| 1.0.1 | _____ | _____ |
| 1.0.2 | _____ | _____ |

---

**Next Version:** _____  
**Planned Release Date:** _____  
**Main Changes:** _____

