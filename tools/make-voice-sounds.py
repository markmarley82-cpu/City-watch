# Prepares dist/assets/voices-v1 from CC0 OpenGameArt downloads (see CREDITS.txt there):
# trims silence, levels each clip, adds short fades, mono 44.1 kHz MP3; troll voices are pitched down.
#   python3 tools/make-voice-sounds.py <downloads dir> dist/assets/voices-v1
import subprocess, sys, wave, os, json, numpy as np
SR=44100; SRC=sys.argv[1]; OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
def load(p,rate=1.0):
    af=['-af','asetrate=%d,aresample=%d'%(int(SR*rate),SR)] if rate!=1.0 else []
    raw=subprocess.run(['ffmpeg','-v','error','-i',os.path.join(SRC,p),*af,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32).astype(np.float64)
def trim(x,thr=-38):
    w=int(.005*SR);e=np.array([np.sqrt(np.mean(x[i:i+w]**2)) for i in range(0,len(x)-w,w)]);db=20*np.log10(e+1e-9);on=np.where(db>db.max()+thr)[0]
    a=max(0,on[0]*w-int(.01*SR));b=min(len(x),(on[-1]+1)*w+int(.04*SR));return x[a:b]
def save(name,x,rms_db=-17.0,peak_db=-2.0):
    x=trim(x-np.mean(x));fi=int(.004*SR);fo=min(len(x)//3,int(.05*SR));x[:fi]*=np.linspace(0,1,fi);x[-fo:]*=np.linspace(1,0,fo)**2
    rms=np.sqrt(np.mean(x[np.abs(x)>.02*np.abs(x).max()]**2));x*=10**(rms_db/20)/rms
    pk=np.abs(x).max();lim=10**(peak_db/20)
    if pk>lim:x=np.tanh(x/lim)*lim
    tmp=os.path.join(OUT,name+'.wav')
    with wave.open(tmp,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-b:a','96k',os.path.join(OUT,name+'.mp3')],check=True);os.remove(tmp)
    return {'file':name+'.mp3','duration':round(len(x)/SR,3)}
plan={
 'suspect':[('tinyworlds/x/mp3/hit%d.mp3'%i,1.0) for i in range(1,6)]+[('emopreben/x/Painsounds v2 - Track 5 - Urggh.ogg',1.0),('emopreben/x/Painsounds v2 - Track 1 - Arrrch.ogg',1.0),('emopreben/x/Painsounds v2 - Track 4 - Arrggh .ogg',1.0)],
 'officer':[('haeldb/x/yelling sounds/3grunt3.wav',1.0),('haeldb/x/yelling sounds/3grunt4.wav',1.0),('haeldb/x/yelling sounds/3grunt5.wav',1.0),('ezduzziteh/hurt_03.mp3',1.0),('ezduzziteh/hurt_05.mp3',1.0),('qubodup-strain/x/slightscream-05.flac',1.0),('qubodup-strain/x/slightscream-07.flac',1.0)],
 'down':[('tinyworlds/x/mp3/die1.mp3',1.0),('qubodup-strain/x/slightscream-10.flac',1.0)],
 'troll':[('emopreben/x/Painsounds v2 - Track 1 - Arrrch.ogg',2**(-7/12)),('emopreben/x/Painsounds v2 - Track 5 - Urggh.ogg',2**(-7/12)),('tinyworlds/x/mp3/hit3.mp3',2**(-8/12))],
}
made={};sources={}
for g,items in plan.items():
    for i,(p,rate) in enumerate(items,1):
        m=save('%s-%d'%(g,i),load(p,rate));made.setdefault(g,[]).append(m['file']);sources[m['file']]={'source_file':p.split('/x/')[-1].split('/')[-1],'pitch':'%+d semitones'%round(12*np.log2(rate)) if rate!=1 else 'none'}
# The crowd: a 24-second excerpt, slightly distant (low-passed), made to loop by crossfading its end into its start.
x=load('starninjas/crowd_shouting_0.ogg');x=x[int(1.5*SR):int(26.5*SR)]
X=np.fft.rfft(x);f=np.fft.rfftfreq(len(x),1/SR);X*=1/np.sqrt(1+(f/2600)**4);x=np.fft.irfft(X,len(x))
c=int(1.0*SR);head=x[:c].copy();x=x[c:];x[-c:]=x[-c:]*np.linspace(1,0,c)**.5+head*np.linspace(0,1,c)**.5
x*=10**(-20/20)/np.sqrt(np.mean(x**2))
tmp=os.path.join(OUT,'crowd-loop.wav')
with wave.open(tmp,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-ar','22050','-b:a','48k',os.path.join(OUT,'crowd-loop.mp3')],check=True);os.remove(tmp)
made['crowd']=['crowd-loop.mp3'];sources['crowd-loop.mp3']={'source_file':'crowd_shouting_0.ogg','pitch':'none','changes':'1.5-26.5 s excerpt, low-pass 2.6 kHz, 1 s loop crossfade'}
json.dump({'id':'voices-v1','groups':made,'sources':sources},open(os.path.join(OUT,'manifest.json'),'w'),indent=1)
print(json.dumps(made))
