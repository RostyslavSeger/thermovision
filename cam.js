let mode='OPTICAL',pal='IRON',baseN=35,waveHist=new Array(40).fill(0),started=false;
function paintIron(o,i,v){
  if(v<64){o.data[i]=v*1.5;o.data[i+1]=0;o.data[i+2]=v*2.5;}
  else if(v<128){o.data[i]=96+(v-64)*2.4;o.data[i+1]=0;o.data[i+2]=160-(v-64)*2;}
  else if(v<192){o.data[i]=255;o.data[i+1]=(v-128)*3.2;o.data[i+2]=0;}
  else{o.data[i]=255;o.data[i+1]=205+(v-192)*0.8;o.data[i+2]=(v-192)*4;}
  o.data[i+3]=255;
}
document.getElementById('go').onclick=async()=>{
  document.getElementById('s0').style.display='none';
  document.getElementById('main').style.display='flex';
  if(started)return;started=true;
  const vid=document.getElementById('v'),ar=document.getElementById('ar'),ax=ar.getContext('2d');
  let an=null,dt=null,bW=23.4,pF=null,cL=0,sm=0;
  document.getElementById('pal-btn').onclick=function(){pal=pal==='IRON'?'RAINBOW':(pal==='RAINBOW'?'OFF':'IRON');this.textContent='FLIR: '+pal};
  document.getElementById('md-btn').onclick=function(){mode=mode==='OPTICAL'?'AIRFLOW':'OPTICAL';this.textContent=mode};
  document.getElementById('cal-btn').onclick=function(){baseN=cL+4;this.textContent='CAL ('+Math.round(baseN)+')'};
  try{vid.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){}
  try{const aS=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}),cx=new(window.AudioContext||window.webkitAudioContext)();if(cx.state==='suspended')await cx.resume();const sr=cx.createMediaStreamSource(aS);an=cx.createAnalyser();an.fftSize=2048;sr.connect(an);dt=new Uint8Array(an.frequencyBinCount);bW=cx.sampleRate/an.fftSize}catch(e){}
  const off=document.createElement('canvas');off.width=96;off.height=96;const ox=off.getContext('2d',{willReadFrequently:true});
  const thC=document.createElement('canvas');thC.width=96;thC.height=96;const thX=thC.getContext('2d');
  document.getElementById('snap').onclick=()=>{const a=document.createElement('a');a.download='ThermoVision-'+Date.now()+'.png';a.href=ar.toDataURL();a.click()};
  function lp(){
    requestAnimationFrame(lp);if(document.getElementById('main').style.display==='none')return;
    ar.width=innerWidth;ar.height=innerHeight;const cx=ar.width/2,cy=ar.height/2;let rw=0,cLum=0,bLum=0;
    if(vid.readyState>=2){
      ox.drawImage(vid,0,0,96,96);const im=ox.getImageData(0,0,96,96).data;
      if(pal!=='OFF'){const out=thX.createImageData(96,96);for(let i=0;i<im.length;i+=4){const lum=im[i]*.299+im[i+1]*.587+im[i+2]*.114;if(pal==='IRON')paintIron(out,i,lum);else{out.data[i]=lum;out.data[i+1]=255-Math.abs(lum-128)*2;out.data[i+2]=255-lum;out.data[i+3]=255}}thX.putImageData(out,0,0);ax.drawImage(thC,0,0,ar.width,ar.height)}else ax.drawImage(vid,0,0,ar.width,ar.height);
      let cD=0,bD=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4,lum=im[i]*.3+im[i+1]*.6+im[i+2]*.1;if(x>=34&&x<=62&&y>=34&&y<=62){cLum+=lum;if(pF)cD+=Math.abs(im[i]-pF[i])+Math.abs(im[i+1]-pF[i+1])}else{bLum+=lum;if(pF)bD+=Math.abs(im[i]-pF[i])+Math.abs(im[i+1]-pF[i+1])}}
      if(mode==='OPTICAL'&&pF)rw=Math.min(100,Math.round(Math.max(0,(cD/841)-((bD/8375)*1.5)-sens)*4.5));pF=new Uint8ClampedArray(im);
    }
    if(mode==='AIRFLOW'&&an){an.getByteFrequencyData(dt);const b1=Math.max(1,Math.floor(20/bW)),b2=Math.floor(220/bW),b3=Math.floor(3000/bW);let lS=0,mS=0;for(let i=b1;i<=b2;i++)lS+=dt[i];for(let i=b2+1;i<=b3;i++)mS+=dt[i];cL=lS/(b2-b1+1);if(cL>baseN&&(cL/((mS/(b3-b2))||1))>1.35)rw=Math.min(100,Math.round((cL-baseN)*3))}
    sm=Math.round(sm*.75+rw*.25);waveHist.push(sm);waveHist.shift();
    const d=D[L],pl=document.getElementById('pill');document.getElementById('v1').textContent=sm+'%';document.getElementById('v2').textContent=(sm*.035).toFixed(2)+' m/s';document.getElementById('v3').textContent=(100-sm)+'%';
    ax.strokeStyle='rgba(255,255,255,.7)';ax.lineWidth=1.5;ax.strokeRect(cx-60,cy-60,120,120);
    const dT=((cLum/841)-(bLum/8375))*0.08;ax.fillStyle='#ffcc00';ax.font='bold 11px sans-serif';ax.fillText('ΔT: '+(dT>=0?'+':'')+dT.toFixed(1)+'°C',cx-55,cy-66);
    ax.beginPath();ax.strokeStyle='#00e5ff';waveHist.forEach((v,idx)=>{const px=cx-55+(idx*2.8),py=cy+50-(v*.4);idx===0?ax.moveTo(px,py):ax.lineTo(px,py)});ax.stroke();
    if(sm>12){pl.textContent=d.lk;pl.style.color='#ffcc00';const r=65+sm*1.2,g=ax.createRadialGradient(cx,cy,5,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.4,'rgba(255,204,0,.6)');g.addColorStop(1,'rgba(255,0,0,0)');ax.fillStyle=g;ax.beginPath();ax.arc(cx,cy,r,0,Math.PI*2);ax.fill()}else{pl.textContent=d.ok;pl.style.color='#00e5ff'}
  }lp();
};
