# Crowd Commander

Et selvstændigt, reklamefrit 3D crowd-runner browserspil med 10 baner, touchstyring, porte, fjender, fælder og bosser. Designet til iPhone/iPad og desktop. Bygget med Three.js og Vite.

## Start lokalt

```bash
npm install
npm run dev
```

Åbn adressen fra Vite i browseren. På iPhone skal du bruge en offentlig HTTPS-adresse eller en adresse på samme lokale netværk.

## Deploy på Vercel

1. Upload projektet til et GitHub-repository.
2. Importér repository i Vercel.
3. Vercel registrerer Vite automatisk. Build command: `npm run build`, output directory: `dist`.
4. Deploy og åbn HTTPS-linket i Safari.
5. I Safari: Del → Føj til hjemmeskærm.

Ingen backend, brugerregistrering eller reklamer. Niveauprogression gemmes lokalt i browseren. Lyde genereres lokalt med Web Audio API.

## Kontrol

`npm run build` verificerer produktionsbygningen.
