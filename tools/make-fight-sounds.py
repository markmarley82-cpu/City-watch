# Builds the fight sounds in dist/assets/fight-v1 from real recordings only: CC0 packs from
# OpenGameArt (see dist/assets/fight-v1/CREDITS.txt) and the game's own CC0 cloth and wood
# recordings. Each sound is cut from a recording, sometimes layered with a second recording,
# levelled and given short fades. Nothing is synthesised. The crossbow shots come from
# tools/make-crossbow-sounds.py.
#
#   python3 tools/make-fight-sounds.py <downloads> dist/assets/echo-all-v012 dist/assets/fight-v1
#
# <downloads> holds the unpacked packs in these folders (download links in CREDITS.txt):
#   qubodup-punch/   qubodupPunch01-05.flac              "Punch" - qubodup
#   indep-hits/      hit01-37.mp3.flac                   "37 hits/punches" - Independent.nu
#   thwack/          thwack-01-10.wav                    "Thwack Sounds" - AntumDeluge
#   towel/           wet_towel_on_floor-01-12.flac       "12 wet towel hitting/falling/punching floor sounds" - qubodup
#   rubberduck75/    bfh1_*.ogg                          "75 CC0 breaking/falling/hit sfx" - rubberduck
#   stillnorth/      Katana Swing.wav, Axe Spear Haft on Haft.wav   Still North Media
#   jaggedstone/     magical_3.ogg                       "Magic spell SFX" - JaggedStone
import subprocess, sys, wave, os, json, glob, numpy as np
SR=44100; DL, GAME, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(OUT, exist_ok=True)

def find(name):
    hits = glob.glob(os.path.join(DL, '**', name), recursive=True)
    if not hits: raise SystemExit('missing ' + name)
    return hits[0]
def load(path, semitones=0):
    af = ['-af', 'asetrate=%d,aresample=%d' % (int(SR * 2 ** (semitones / 12)), SR)] if semitones else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, *af, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64); return x / (np.abs(x).max() + 1e-9)
def rec(name, semitones=0): return load(find(name), semitones)
def game(name): return load(os.path.join(GAME, name))
def onset(x, thr=-30):
    w = int(.002 * SR); e = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, len(x) - w, w)])
    return max(0, int(np.argmax(20 * np.log10(e + 1e-9) > 20 * np.log10(e.max()) + thr)) * w - int(.004 * SR))
def cut(x, start=None, dur=None, fade=.05):
    a = onset(x) if start is None else int(start * SR); y = x[a:] if dur is None else x[a:a + int(dur * SR)]
    y = y.copy(); fi = min(len(y) // 4, int(.003 * SR)); fo = min(len(y) // 3, int(fade * SR))
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo) ** 2; return y
def lowpass(x, hz):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X / np.sqrt(1 + (f / hz) ** 4), len(x))
def mix(*parts):  # (signal, offset seconds, gain)
    n = max(int(o * SR) + len(s) for s, o, g in parts); y = np.zeros(n)
    for s, o, g in parts: y[int(o * SR):int(o * SR) + len(s)] += g * s
    return y
def trim_tail(y, thr=-50):
    w = int(.005 * SR); e = np.array([np.sqrt(np.mean(y[i:i + w] ** 2)) for i in range(0, len(y) - w, w)])
    on = np.where(20 * np.log10(e + 1e-9) > 20 * np.log10(e.max()) + thr)[0]
    return y[:min(len(y), (on[-1] + 1) * w + int(.03 * SR))] if len(on) else y
made = []
def save(group, k, y, rms_db=-17.0, peak_db=-2.0):
    y = trim_tail(y - np.mean(y)); fo = min(len(y) // 3, int(.03 * SR)); y[-fo:] *= np.linspace(1, 0, fo) ** 2
    loud = y[np.abs(y) > .05 * np.abs(y).max()]; y *= 10 ** (rms_db / 20) / np.sqrt(np.mean(loud ** 2))
    lim = 10 ** (peak_db / 20)
    if np.abs(y).max() > lim: y = np.tanh(y / lim) * lim
    name = '%s-%d' % (group, k); tmp = os.path.join(OUT, name + '.wav')
    with wave.open(tmp, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-b:a', '96k', os.path.join(OUT, name + '.mp3')], check=True); os.remove(tmp)
    made.append((group, {'file': name + '.mp3', 'duration': round(len(y) / SR, 3)}))

katana = rec('Katana Swing.wav'); haft = rec('Axe Spear Haft on Haft.wav')
swing = lambda t, d=.42: cut(katana, t, d, .12)
# Fists: four takes of qubodup's punch.
for k, n in enumerate(['qubodupPunch02.flac', 'qubodupPunch03.flac', 'qubodupPunch04.flac', 'qubodupPunch05.flac'], 1):
    save('punch', k, cut(rec(n)))
# A troll's heavy swing landing: a heavy hit, pitched down a little, over a wet towel slapping the floor.
for k, (h, t) in enumerate([('hit08.mp3.flac', 'wet_towel_on_floor-03.flac'), ('hit02.mp3.flac', 'wet_towel_on_floor-10.flac')], 1):
    save('heavy', k, mix((cut(rec(h, -3)), 0, 1.0), (cut(rec(t)), .005, .7)), -15.5, -1.5)
# A truncheon blow: a thwack (a stick hitting something) with a punch under it for the body.
for k, (t, p) in enumerate([('thwack-02.wav', 'qubodupPunch02.flac'), ('thwack-05.wav', 'qubodupPunch03.flac'), ('thwack-06.wav', 'qubodupPunch04.flac')], 1):
    save('club', k, mix((cut(rec(t)), 0, 1.0), (cut(rec(p)), .003, .55)))
# A sword strike with the flat of the blade: a katana swing, then the slap.
for k, (t, h) in enumerate([(1.27, 'thwack-07.wav'), (5.70, 'qubodupPunch01.flac')], 1):
    save('blade', k, mix((swing(t, .30), 0, .8), (cut(rec(h)), .13, 1.0)))
# A swing that misses: katana swings.
for k, t in enumerate([0.30, 2.24, 3.40], 1):
    save('swish', k, swing(t), -19, -5)
# A blow taken on Guard: wood haft on wood haft.
for k, t in enumerate([0.11, 0.68], 1):
    save('block', k, cut(haft, t, .45, .1))
# Taking up Guard: cloth, then a light tap of wood (the game's own recordings).
wood = game('F10-16.mp3'); cloth = {i: game('F11-0%d.mp3' % i) for i in range(1, 8)}
save('guard', 1, mix((cut(cloth[2], .22, .38), 0, .8), (cut(wood, 0, .1, .06), .16, .45)), -21, -8)
# A shove: cloth and a soft towel slap.
for k, (c, o, t) in enumerate([(2, .22, 'wet_towel_on_floor-05.flac'), (6, .30, 'wet_towel_on_floor-08.flac')], 1):
    save('shove', k, mix((cut(cloth[c], o, .45), 0, .9), (cut(rec(t)), .08, .5)), -17, -4)
# Someone going down: cloth, then a wet towel hitting the floor with a low hit under it.
for k, (c, o, t, h) in enumerate([(6, .30, 'wet_towel_on_floor-10.flac', 'hit02.mp3.flac'), (3, .20, 'wet_towel_on_floor-07.flac', 'hit07.mp3.flac')], 1):
    save('fall', k, mix((cut(cloth[c], o, .45), 0, .45), (cut(rec(t)), .12, 1.0), (lowpass(cut(rec(h, -4)), 900), .12, .5)), -15, -2)
# The bolt landing: dull thunks.
for k, n in enumerate(['bfh1_hit_07.ogg', 'bfh1_hit_02.ogg'], 1):
    save('bolt', k, cut(rec(n), None, .45, .12))
# The rogue wizard's dazzle.
save('spell', 1, cut(rec('magical_3.ogg'), None, 1.4, .4), -18, -5)
# Thrown grit: a faint swing and a scatter of small stones.
save('grit', 1, mix((swing(4.52, .3), 0, .35), (cut(rec('bfh1_rock_falling_04.ogg')), .08, .8), (cut(rec('bfh1_rock_falling_07.ogg')), .15, .6)), -19, -6)
# A bandage: cloth.
save('bandage', 1, cut(cloth[1], .3, .7, .15), -22, -7)
made += [('crossbow', {'file': 'crossbow-%d.mp3' % k, 'duration': 0.549}) for k in (1, 2, 3)]  # tools/make-crossbow-sounds.py
groups = {}
for g, m in made: groups.setdefault(g, []).append(m['file'])
json.dump({'id': 'fight-v1', 'groups': groups, 'files': [m for g, m in made]}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print(json.dumps(groups))
