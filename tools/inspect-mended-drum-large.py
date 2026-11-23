"""Read-only PNG geometry/alpha audit. Never edits artwork."""
import json, math
from pathlib import Path
from PIL import Image
packet=Path("art-review/mended-drum-large-v1")
reg=json.loads((packet/"registration.json").read_text())
im=Image.open(packet/"source.png").convert("RGBA")
alpha=im.getchannel("A")
hist=alpha.histogram()
points=reg["observedFoundation"]
left,corner,right=[points[k] for k in ("left","corner","right")]
angles=[math.degrees(math.atan2(abs(corner[1]-p[1]),abs(corner[0]-p[0]))) for p in (left,right)]
door=reg["door"]["heightPixels"]
report={"source":reg["source"],"dimensions":list(im.size),"transparentPixels":hist[0],"opaquePixels":hist[255],"partialAlphaPixels":sum(hist[1:255]),"maxAlpha":max(i for i,n in enumerate(hist) if n),"nearOpaquePixels":sum(hist[250:]),"interiorAlphaSamples":{str(p):alpha.getpixel(p) for p in ((480,750),(900,600),(700,300))},"cornersAlpha":[alpha.getpixel(p) for p in ((0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1))],"sampledAnglesDegrees":angles,"angleSampleTolerancePixels":5,"foundationPass":all(abs(a-26.565051177)<=1 for a in angles),"hasTransparentBackground":hist[0]>im.width*im.height*.1,"doorScaleAt70px":70/door,"estimatedCanvasWidthAt70pxDoor":im.width*70/door,"mapPlacementVerified":False,"creativeApproval":False,"runtimeVerified":False,"physicalPhoneVerified":False}
report["readyForIntegration"]=report["foundationPass"] and report["hasTransparentBackground"] and report["mapPlacementVerified"]
out=Path("qa-results");out.mkdir(exist_ok=True)
(out/"mended-drum-large.json").write_text(json.dumps(report,indent=2)+"\n")
(out/"mended-drum-large.md").write_text("# Mended Drum source inspection\n\nStatus: HOLD\n\n`readyForIntegration` is false unless all geometry, alpha and placement gates pass.\n\n```json\n"+json.dumps(report,indent=2)+"\n```\n")
print(json.dumps(report,indent=2))
