# Xiaomi Motion Generator — Human × Car × Home

Generator video motion graphic vertikal **9:16 · 1080×1920 · 60 FPS · 30 detik (1.800 frame)**,
dibangun dengan Vite + React 19 + Tailwind v4 dan *frame engine* deterministik ala Remotion:
setiap piksel adalah fungsi murni dari nomor frame, jadi preview, scrub, dan ekspor MP4 identik.

```bash
npm install
npm run dev        # player di http://localhost:5173
npm run qa         # audit otomatis: safe zone, frame bounds, benchmark, kontras, screenshot → qa-out/
npm run render     # ekspor MP4 frame-perfect + audio → out/xiaomi-human-car-home.mp4
```

`npm run render -- --from 300 --to 660 --out out/timeline.mp4` merender potongan scene tertentu.
Render dan QA memakai Chrome/Edge yang terpasang (set `CHROME_PATH` bila perlu) dan butuh dev server berjalan.

## Struktur

```
src/
  engine/
    timing.ts      FPS, durasi, tabel 10 scene, safe zone TikTok/Reels
    easing.ts      cubic-bezier solver (CSS-compatible), spring fisika closed-form,
                   interpolate, velocity → kinetic motion blur
    audio.ts       SFX sintetis Web Audio (whoosh, tick, chime, impact, click, pop,
                   riser, motor, kick/hat, sub, chord, pad) — live & OfflineAudioContext
    random.ts      PRNG ber-seed (partikel deterministik)
  assets/
    palette.ts     #FF6900 · #0D0F14 · #FFFFFF · #00E5FF
    svg.tsx        squircle superellipse (n=3) + "mi", siluet SU7, HyperOS, smartphone,
                   Smart Living, wearable, 20 glyph ekosistem — semuanya inline SVG matematis
  composition/
    Composition.tsx  urutan scene + daftar cue SFX global (transisi + music bed 120 BPM)
    Layers.tsx       background ambient, HUD, light-streak transisi, filter motion blur, safe overlay
  scenes/Scene01–10.tsx   tiap scene: komponen + cue SFX lokal + jendela "hold" untuk audit
  qa/audit.ts      audit safe-margin (sadar overflow clip) & tabel kontras WCAG
  automation.ts    API window.__xiaomi (seek, auditAll, bench, wav) untuk QA/render
scripts/  qa.mjs · render.mjs · browser.mjs
```

## Storyboard

| # | Waktu | Scene |
|---|-------|-------|
| 1 | 0.0–2.5s | Tipografi kinetik + directional motion blur "Sejak 2010… Inovasi untuk Semua Orang." |
| 2 | 2.5–5.0s | Squircle memantul (spring), ripple impact, "Human × Car × Home" |
| 3 | 5.0–11.0s | Timeline scrubber 2010→2026, odometer tahun + motion blur, kartu milestone |
| 4 | 11.0–14.5s | Counter 600.000.000+ meledak, grid 70 ikon menyala sinkron counter |
| 5 | 14.5–18.0s | Orbit HyperOS: SU7, smartphone, Smart Living, wearable + data pulse |
| 6 | 18.0–21.0s | Mockup HyperOS: kursor klik pre-cooling, kabin 34,0 → 21,5 °C |
| 7 | 21.0–24.0s | HyperEngine V8s 27.200 RPM (SFX motor ikut kurva counter) + pabrik net zero 2040 |
| 8 | 24.0–26.5s | Xiaomi Foundation 150.000+ beasiswa, ring progress |
| 9 | 26.5–28.0s | CTA "Jelajahi Ekosistem Xiaomi HyperOS →" pulse ripple + neon glow |
| 10 | 28.0–30.0s | Lockup final + mikro dolly-zoom, fade ke Obsidian |

## Hasil QA terakhir

- Safe zone (110 px kiri/kanan, 220 atas, 400 bawah) saat layout diam: **0 pelanggaran**
- Teks keluar kanvas 1080×1920 di seluruh frame termasuk transisi: **0**
- Render per frame (React + style + layout): p50 1,5 ms · p95 3,1 ms · maks < 8 ms, budget 16,6 ms
- Kontras: semua pasangan teks ≥ AA. Putih di atas oranye (2,89:1) gagal, karena itu CTA memakai teks Obsidian (6,64:1).
- Audio: puncak −1,0 dB (tanpa clipping), rata-rata −18,2 dB

Catatan: logo dan wordmark di sini adalah rekonstruksi geometris untuk keperluan demo/edukasi.
Untuk publikasi komersial, gunakan aset resmi dan pedoman merek Xiaomi.
