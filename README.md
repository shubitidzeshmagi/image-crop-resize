# Image Crop & Resize — Electron Desktop App

## პირველი გაშვება

### 1. Prerequisites
- **Node.js 18+** — https://nodejs.org (LTS)
- **Windows 10/11 x64**

### 2. Dependencies დაინსტალირება
```bash
npm install
```

### 3. Build + Installer შექმნა
```bash
npm run electron:build:win
```

ეს ბრძანება:
1. React app-ს build-ავს (`dist/` ფოლდერში)
2. Electron-ს პაკეტავს
3. `release/` ფოლდერში ქმნის:
   - `Image Crop & Resize Setup 1.0.0.exe` — installer
   - `ImageCropResize-portable.exe` — portable (ინსტალაციის გარეშე)

---

## Development რეჟიმი (კოდის ცვლილებებისთვის)
```bash
npm run electron:dev
```
ეს Vite dev server-ს + Electron-ს ერთდროულად უშვებს, hot-reload-ით.

---

## ფაილების სტრუქტურა
```
electron-app/
├── electron/
│   ├── main.cjs      ← Electron main process
│   └── preload.cjs   ← Preload script
├── src/              ← React app (იდენტური web ვერსიასთან)
├── public/
│   └── icon.ico      ← App icon (შეცვალე შენი ლოგოთი)
├── dist/             ← Vite build output
├── release/          ← Electron installer output
└── package.json
```

---

## Icon შეცვლა
1. შექმენი `.ico` ფაილი (256x256px) — https://convertio.co
2. ჩაანაცვლე `public/icon.ico`
3. ხელახლა გაუშვი `npm run electron:build:win`

---

## Troubleshooting

**"electron-builder" ვერ პოულობს icon-ს**
→ დარწმუნდი რომ `public/icon.ico` არსებობს

**Build ნელია**
→ პირველი build ყოველთვის ნელია (~5 წუთი) — Electron (~150MB) ჩამოიტვირთება

**Antivirus ბლოკავს**
→ Code signing გარეშე ზოგი antivirus აფრთხილებს — ნორმალურია unsigned app-ებისთვის
