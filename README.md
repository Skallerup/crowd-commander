# Crowd Commander 3.0 – GLB Animation Edition

Denne version bygger på fase 5 og indeholder en **ægte glTF 2.0/GLB-figur** (`public/models/commander.glb`) med indlejrede keyframe-animationer: `Run`, `Idle`, `Celebrate`. Figuren er original og fremstillet til dette projekt (ingen tredjepartsaktiver).

## Integration
- `GLTFLoader` indlæser GLB-filen lokalt fra `public/models`. Ingen ekstern CDN eller API.
- De første 18 synlige soldater bruger GLB-kloner og `AnimationMixer` til rigtig keyframe-animation.
- Resten af hæren bruger den eksisterende GPU-instancing, så store hære stadig er hurtige.
- Ved indlæsningsfejl fortsætter spillet med de tidligere animerede instanced-soldater.
- De 10 baner, Mikkel-bosserne, sværhedsgrad og touchstyring er bevaret.

## Lokal test
```bash
npm install
npm run build
npm run dev
```
Åbn i Safari og kontrollér især de første 18 soldater, deres løbeanimation og FPS ved store hære.

## Begrænsninger
Modellen er en original stiliseret low-poly GLB-model med ægte animationer, **ikke** en kommerciel AAA-karakter eller en fuldt skinned humanoid rig. For en større visuel forbedring kan GLB-modellen senere udskiftes med en kunstnerproduceret, skinned/rigget karakter. `Idle` og `Celebrate` er indlejret og klar til senere at blive aktiveret ved pause/sejr; under gameplay afspilles `Run`.

Der er ikke foretaget fysisk iPhone-test.
