# Builds the fight sounds in dist/assets/fight-v1 from synthesis plus slices of the game's
# own CC0 recordings (echo-all-v012: F10-14/15/16 timber and hammer-on-wood, F11 cloth).
#   python3 tools/make-fight-sounds.py dist/assets/echo-all-v012 dist/assets/fight-v1
import subprocess, sys, wave, numpy as np, os, json
SR=44100; SRC=sys.argv[1]; OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
def load(name):
    raw=subprocess.run(['ffmpeg','-v','error','-i',os.path.join(SRC,name),'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    x=np.frombuffer(raw,dtype=np.float32).astype(np.float64); return x/ (np.abs(x).max()+1e-9)
def sl(x,a,b):
    y=x[int(a*SR):int(b*SR)].copy(); fi=min(len(y)//4,int(.004*SR)); fo=min(len(y)//3,int(.04*SR))
    if fi: y[:fi]*=np.linspace(0,1,fi)
    if fo: y[-fo:]*=np.linspace(1,0,fo)**2
    return y
def T(d): return np.arange(int(d*SR))/SR
def biquad(x,kind,f0,Q=.707):
    w=2*np.pi*f0/SR; c=np.cos(w); a=np.sin(w)/(2*Q)
    if kind=='lp': b=[(1-c)/2,1-c,(1-c)/2]
    elif kind=='hp': b=[(1+c)/2,-(1+c),(1+c)/2]
    else: b=[a,0,-a]
    A=[1+a,-2*c,1-a]; b=[v/A[0] for v in b]; a1,a2=A[1]/A[0],A[2]/A[0]
    y=np.zeros_like(x); x1=x2=y1=y2=0.0
    for i,v in enumerate(x):
        o=b[0]*v+b[1]*x1+b[2]*x2-a1*y1-a2*y2; x2,x1,y2,y1=x1,v,y1,o; y[i]=o
    return y
def svf_bp(x,fc,q=1.4):
    y=np.zeros_like(x); low=band=0.0
    for i,v in enumerate(x):
        f=2*np.sin(np.pi*min(fc[i],SR/6)/SR); low+=f*band; high=v-low-band/q; band+=f*high; y[i]=band
    return y
def pad(x,n): return np.pad(x,(0,max(0,n-len(x))))[:n]
def mix(n,*parts):
    y=np.zeros(n)
    for off,sig,g in parts:
        s=int(off*SR); sig=sig[:max(0,n-s)]; y[s:s+len(sig)]+=g*sig
    return y
def thump(d,base,sweep,tau,rng):
    t=T(d); f=base+sweep*np.exp(-t/.025); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*(1-np.exp(-t/.002))*np.exp(-t/tau)
def noise(d,rng): return rng.standard_normal(int(d*SR))
def env_exp(d,tau,att=.001): t=T(d); return (1-np.exp(-t/att))*np.exp(-t/tau)
def finish(name,y,peak=-3.0):
    y=y-np.mean(y); n=len(y); fade=min(int(.03*SR),n//4); y[-fade:]*=np.linspace(1,0,fade)
    y=np.tanh(1.4*y/ (np.abs(y).max()+1e-9))/np.tanh(1.4); y*=10**(peak/20)
    tmp=os.path.join(OUT,name+'.wav')
    with wave.open(tmp,'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-ac','1','-ar','44100','-b:a','96k',os.path.join(OUT,name+'.mp3')],check=True); os.remove(tmp)
    return {'file':name+'.mp3','duration':round(n/SR,3)}
wood=load('F10-16.mp3'); crack=load('F10-14.mp3'); fallrec=load('F10-15.mp3')
cloth={k:load('F11-0%d.mp3'%k) for k in range(1,8)}
made=[]
def body_hit(rng,d=.4,base=55,sweep=90,tau=.07,smack=1500,smackg=.55,clothg=.3,cl=(5,.08)):
    n=int(d*SR); c=biquad(pad(sl(cloth[cl[0]],cl[1],cl[1]+.25),int(.25*SR)),'hp',300)*np.linspace(1,0,int(.25*SR))**2
    sm=biquad(noise(d,rng),'bp',smack,.8)*env_exp(d,.010); sl_=biquad(noise(d,rng),'hp',3000)*env_exp(d,.004)
    lo=biquad(noise(d,rng),'lp',200)*env_exp(d,.04)
    return mix(n,(0,thump(d,base,sweep,tau,rng),1.0),(0,sm/ (np.abs(sm).max()+1e-9),smackg),(0,sl_/(np.abs(sl_).max()+1e-9),.25),(0,lo/(np.abs(lo).max()+1e-9),.45),(0.004,c,clothg))
# Fists (suspects' empty hands; unarmed officers)
for i,(b,s,tau,sm,cl) in enumerate([(58,95,.065,1400,(5,.08)),(52,110,.08,1100,(4,.15)),(64,80,.055,1900,(7,.15)),(55,100,.07,1600,(6,.33))],1):
    made.append(('punch',finish('punch-%d'%i,body_hit(np.random.default_rng(10+i),.38,b,s,tau,sm,cl=cl))))
# Troll's heavy swing landing
for i in (1,2):
    rng=np.random.default_rng(30+i); d=.75; n=int(d*SR)
    y=mix(n,(0,body_hit(rng,d,40+4*i,70,.16,800,.4,.35,(2,.25)),1.0),(0.01,biquad(pad(sl(fallrec,.02,.5),int(.48*SR)),'lp',1500),.55))
    made.append(('heavy',finish('heavy-%d'%i,y,-1.5)))
# Truncheon on body: hammer-on-wood knock over a body thump
for i,(g,b) in enumerate([(.75,58),(.6,52),(.85,62)],1):
    rng=np.random.default_rng(50+i); d=.4; n=int(d*SR); k=biquad(pad(sl(wood,.0,.3),int(.3*SR)),'hp',250)
    made.append(('club',finish('club-%d'%i,mix(n,(0,body_hit(rng,d,b,85,.06,1300,.35,.25,(4+i,.12)),.9),(0,k,g)))))
# Sword (flat of the blade): short swish, a ring, and the thump
def swish(rng,d=.26,lo=500,hi=2600,g=1.0):
    t=T(d); fc=lo+(hi-lo)*np.sin(np.pi*t/d)**2; e=np.sin(np.pi*t/d)**1.5
    y=svf_bp(noise(d,rng),fc,1.6)*e; y2=biquad(noise(d,rng),'lp',400)*e*.4
    y=y/(np.abs(y).max()+1e-9)+y2/(np.abs(y2).max()+1e-9)*.3; return y*g
for i,f0 in enumerate([1180,1350],1):
    rng=np.random.default_rng(70+i); d=.7; n=int(d*SR); t=T(.6)
    ring=sum(a*np.sin(2*np.pi*f0*r*t+rng.uniform(0,6))*np.exp(-t/td) for r,a,td in [(1,1,.22),(2.76,.6,.12),(5.4,.35,.07),(8.93,.2,.04)])
    made.append(('blade',finish('blade-%d'%i,mix(n,(0,swish(rng,.16,700,3200),.55),(.13,body_hit(rng,.4,60,80,.05,1800,.4,.2,(3,.23)),.9),(.13,ring/np.abs(ring).max(),.22)))))
# A miss: the swish of a fist or truncheon through air
for i,(d,lo,hi) in enumerate([(.24,450,2400),(.3,380,2000),(.2,600,3000)],1):
    made.append(('swish',finish('swish-%d'%i,swish(np.random.default_rng(90+i),d,lo,hi),-6)))
# A blow taken on a raised truncheon (Guard): wood on wood
for i in (1,2):
    rng=np.random.default_rng(110+i); d=.35; n=int(d*SR)
    k=biquad(pad(sl(wood,.0,.14),int(.14*SR)),'hp',500)*np.linspace(1,0,int(.14*SR))
    cr=biquad(pad(sl(crack,.02,.2),int(.18*SR)),'hp',400)
    made.append(('block',finish('block-%d'%i,mix(n,(0,k,1.0),(0.003*i,cr,.45),(0,thump(d,90,60,.03,rng),.35),(0,swish(rng,.12,800,3000),.2)))))
# Taking up Guard: cloth and a light tap of the truncheon
rng=np.random.default_rng(130); d=.45; n=int(d*SR)
made.append(('guard',finish('guard-1',mix(n,(0,biquad(pad(sl(cloth[2],.22,.6),int(.38*SR)),'hp',200),.8),(.16,biquad(pad(sl(wood,0,.1),int(.1*SR)),'hp',800)*np.linspace(1,0,int(.1*SR)),.45)),-8)))
# A shove: cloth, scuffle and a soft thump
for i,(c,o) in enumerate([(2,.22),(6,.3)],1):
    rng=np.random.default_rng(150+i); d=.55; n=int(d*SR)
    made.append(('shove',finish('shove-%d'%i,mix(n,(0,biquad(pad(sl(cloth[c],o,o+.45),int(.45*SR)),'hp',150),.9),(.08,thump(.4,60,50,.09,rng),.6),(.08,biquad(noise(.3,rng),'lp',300)*env_exp(.3,.06),.25)),-4)))
# Knocked down: body fall
for i in (1,2):
    rng=np.random.default_rng(170+i); d=1.0; n=int(d*SR)
    y=mix(n,(0,biquad(pad(sl(cloth[6],.3,.8),int(.5*SR)),'hp',150),.45),(.12,thump(.6,42+3*i,60,.18,rng),1.0),(.12,biquad(pad(sl(fallrec,0,.68),int(.68*SR)),'lp',2200),.5),(.38,thump(.3,55,40,.06,rng),.35))
    made.append(('fall',finish('fall-%d'%i,y,-2)))
# Crossbow: release click and a plucked string (Karplus-Strong)
rng=np.random.default_rng(190); d=.6; n=int(d*SR); N=int(SR/150); buf=rng.uniform(-1,1,N); out=np.zeros(n)
for j in range(n): out[j]=buf[j%N]; buf[j%N]=.5*(buf[j%N]+buf[(j+1)%N])*.996
out*=np.exp(-T(d)/.18)
made.append(('crossbow',finish('crossbow-1',mix(n,(0,biquad(noise(.02,rng),'hp',2500)*env_exp(.02,.003),.8),(0.004,out/np.abs(out).max(),.8),(0,swish(rng,.18,1500,4500),.25)),-5)))
for i in (1,2):
    rng=np.random.default_rng(200+i); d=.35; n=int(d*SR)
    made.append(('bolt',finish('bolt-%d'%i,mix(n,(0,body_hit(rng,d,62,70,.05,2200,.5,.15,(5,.08)),1.0),(0,biquad(pad(sl(wood,0,.08),int(.08*SR)),'hp',1500),.3)))))
# The rogue wizard's dazzle: a rising octarine shimmer
rng=np.random.default_rng(220); d=1.0; n=int(d*SR); t=T(d); y=np.zeros(n)
for k in range(14):
    f=rng.uniform(900,3800); on=rng.uniform(0,.35); tt=np.clip(t-on,0,None)
    y+=np.sin(2*np.pi*f*(1+.25*tt)*tt+rng.uniform(0,6))*(t>on)*(1-np.exp(-tt/.02))*np.exp(-tt/.25)*(1+.5*np.sin(2*np.pi*rng.uniform(9,17)*tt))
fw=biquad(noise(d,rng),'lp',500)*env_exp(d,.15,.03)
made.append(('spell',finish('spell-1',y/np.abs(y).max()*.7+fw/np.abs(fw).max()*.5,-6)))
# The gnoll's grit: a thrown scatter
rng=np.random.default_rng(240); d=.45; n=int(d*SR); clicks=np.zeros(n)
for j in rng.integers(int(.05*SR),int(.4*SR),90): clicks[j]+=rng.uniform(.3,1)
y=biquad(clicks,'hp',2500)+biquad(noise(d,rng),'bp',4500,.9)*env_exp(d,.09,.02)*.5
made.append(('grit',finish('grit-1',mix(n,(0,swish(rng,.18,900,3500),.5),(.06,y/np.abs(y).max(),.8)),-6)))
# A bandage: cloth
made.append(('bandage',finish('bandage-1',biquad(pad(sl(cloth[1],.3,1.0),int(.7*SR)),'hp',120),-7)))
groups={}
for g,m in made: groups.setdefault(g,[]).append(m['file'])
json.dump({'id':'fight-v1','groups':groups,'files':[m for g,m in made]},open(os.path.join(OUT,'manifest.json'),'w'),indent=1)
print(json.dumps(groups))
