# Crossbow shots for dist/assets/fight-v1 (crossbow-1..3) from Still North Media's CC0
# "Medieval sound effects - Weapon Textures" (https://opengameart.org/content/medieval-sound-effects-weapon-textures):
# one take of "Crossbow Shoot" each, with a faint bolt whizz from "Crossbow Bolt Pass" behind it.
#   python3 tools/make-crossbow-sounds.py <folder with the two WAVs> dist/assets/fight-v1
import subprocess, sys, wave, os, numpy as np
SR=44100; SRC=sys.argv[1]; OUT=sys.argv[2]
def load(name):
    raw=subprocess.run(['ffmpeg','-v','error','-i',os.path.join(SRC,name),'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32).astype(np.float64)
def cut(x,a,d):
    y=x[int(a*SR):int((a+d)*SR)].copy();fi=int(.003*SR);fo=int(.08*SR);y[:fi]*=np.linspace(0,1,fi);y[-fo:]*=np.linspace(1,0,fo)**2;return y
shoot=load('Crossbow Shoot.wav');bolt=load('Crossbow Bolt Pass.wav')
takes=[(0.325,0.555),(1.415,1.415),(2.495,2.335)]  # (shot start, bolt-pass start) in seconds
for i,(s,b) in enumerate(takes,1):
    shot=cut(shoot,s,.42);whizz=cut(bolt,b,.38)
    y=np.zeros(int(.5*SR));y[:len(shot)]+=shot/np.abs(shot).max();o=int(.04*SR);y[o:o+len(whizz)]+=.22*whizz/np.abs(whizz).max()
    y=np.tanh(2.2*y/np.abs(y).max())/np.tanh(2.2)*10**(-2/20)
    tmp=os.path.join(OUT,'crossbow-%d.wav'%i)
    with wave.open(tmp,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((y*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-b:a','96k',os.path.join(OUT,'crossbow-%d.mp3'%i)],check=True);os.remove(tmp)
    print('crossbow-%d.mp3'%i)
