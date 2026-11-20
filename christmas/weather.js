// Paint the materials once. All weather and pointer effects share one canvas.
function texture(width,height,paint){
  const tile=document.createElement('canvas');
  tile.width=width;tile.height=height;paint(tile.getContext('2d'));return tile;
}
function bloom(ctx,x,y,radius,color){
  const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
  gradient.addColorStop(0,color);gradient.addColorStop(1,'rgba(224,238,243,0)');
  ctx.fillStyle=gradient;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
function crystal(ctx){
  ctx.translate(16,16);ctx.strokeStyle='#fffdf2';ctx.lineWidth=2;
  ctx.beginPath();
  for(let arm=0;arm<6;arm++){
    ctx.moveTo(0,0);ctx.lineTo(0,-12);ctx.moveTo(-3,-8);ctx.lineTo(0,-5);ctx.lineTo(3,-8);
    ctx.rotate(Math.PI/3);
  }
  ctx.stroke();
}
const weatherProfiles={
  'Graupel':[185,173,26], 'Light pillars':[0,0,0],
  'Ice halo':[0,0,0], 'Spindrift':[205,0,178], 'Sleet':[290,205,45], 'Feather snow':[120,24,5], 'Clear':[0,0,0], 'Lake mist':[0,0,0], 'Diamond dust':[160,13,4],
  'Snowfall':[240,54,10], 'Flurries':[340,76,43], 'Snowstorm':[720,132,118]
};
export function winterAir(){
  const canvas=document.createElement('canvas');
  canvas.className='winter-air';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  const soft=texture(32,32,c=>bloom(c,16,16,15,'rgba(255,253,244,.98)'));
  const flake=texture(32,32,crystal);
  const clump=texture(32,32,c=>{
    c.fillStyle='#bfd3d8';c.beginPath();c.ellipse(16,19,10,6,-.28,0,2*Math.PI);c.fill();
    c.fillStyle='#fffdf3';c.beginPath();c.ellipse(15,15,10,6,-.28,0,2*Math.PI);c.fill();
  });
  const glint=texture(40,40,c=>{
    bloom(c,20,20,18,'rgba(196,232,255,.8)');c.fillStyle='#fffbe8';
    c.beginPath();c.moveTo(20,1);c.lineTo(22,17);c.lineTo(35,20);c.lineTo(22,22);
    c.lineTo(20,39);c.lineTo(18,22);c.lineTo(4,20);c.lineTo(18,18);c.fill();
  });
  const streamer=texture(80,20,c=>{
    c.fillStyle='rgba(106,146,160,.66)';c.beginPath();c.moveTo(1,16);
    c.bezierCurveTo(22,17,45,2,75,9);c.bezierCurveTo(49,7,37,22,1,16);c.fill();
    c.fillStyle='#fffaf0';c.beginPath();c.moveTo(5,14);c.bezierCurveTo(31,13,47,0,77,7);
    c.bezierCurveTo(50,5,37,18,5,14);c.fill();
    for(const [x,y,r] of [[66,4,1.4],[74,2,1],[78,5,.8],[54,5,1]]){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();}
  });
  const pellet=texture(18,18,c=>{
    c.fillStyle='#819aa5';c.beginPath();c.ellipse(9,10,6,5.5,-.4,0,2*Math.PI);c.fill();
    c.fillStyle='#f1f3e8';c.beginPath();c.ellipse(8,8,5.6,4.6,-.5,0,2*Math.PI);c.fill();
    c.fillStyle='#fffdf1';c.fillRect(6,5,3,2);
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const powder=[],flakes=[];
  let width=0,height=0,mode='Clear',frame=0,last=0,cameraX=0,cameraY=0;
  const margin=80;
  const wrap=(value,span)=>((value+margin)%span+span)%span-margin;
  function size(){
    width=canvas.width=innerWidth;height=canvas.height=innerHeight;
    flakes.length=0;
    const density=weatherProfiles[mode][0];
    const count=Math.min(1100,Math.round(density*Math.max(.55,width*height/950000)));
    for(let i=0;i<count;i++)flakes.push({x:Math.random()*width,y:Math.random()*height,z:.18+Math.random()*.82,phase:Math.random()*6.28,bounce:0,sprite:i%6===0?flake:soft});
  }
  function draw(now){
    frame=0;
    const dt=reduced.matches?0:Math.min(.05,(now-last)/1000);last=now;
    ctx.clearRect(0,0,width,height);
    if(document.hidden)return;
    const wind=weatherProfiles[mode][2]*(1+.38*Math.sin(now/4600)+.16*Math.sin(now/1300));
    for(const f of flakes){
      f.x+=dt*(wind+Math.sin(now/2100+f.phase)*11)*f.z;
      f.y+=dt*(weatherProfiles[mode][1]*(.35+f.z));
      // World positions survive a pan. Wrap only the projected position at
      // the screen edge, so a flake never jumps inside the visible area.
      const depth=.12+1.35*f.z*f.z;
      const x=wrap(f.x+cameraX*depth,width+2*margin);
      let y=wrap(f.y+cameraY*depth,height+2*margin);
      let sprite=f.sprite,s=2.3+f.z*f.z*(mode==='Snowstorm'?13:10);
      ctx.globalAlpha=.46+f.z*.52;
      if(mode==='Diamond dust'){
        const flash=(1+Math.sin(now/460+f.phase*7))*.5;
        sprite=glint;s=3+f.z*11*flash;ctx.globalAlpha=.34+.66*flash;
      }
      if(mode==='Feather snow'){sprite=flake;s*=1.65;}
      const w=mode==='Sleet'?s*.34:s,h=mode==='Sleet'?s*1.75:s;
      if(mode==='Spindrift'){
        const gust=(1+Math.sin(f.x/135+now/1300+f.phase))*.5;
        const band=height*(.72+.26*f.z)-gust*gust*(5+22*f.z)+cameraY*depth;
        ctx.globalAlpha=.42+.47*f.z;
        if(f.phase<2.2)ctx.drawImage(streamer,x,band,26+s*3.3,6+s*1.15);
        else ctx.drawImage(clump,x,band+Math.sin(f.phase*4)*6,2.5+s*.76,2+s*.4);
      }else if(mode==='Graupel'){
        const ground=height*(.73+.26*f.z);
        if(f.y>=ground){
          f.bounce+=dt*(3.1+f.z);
          y=ground-4*f.bounce*(1-f.bounce)*(5+12*f.z)+cameraY*depth;
          if(f.bounce>=1){f.y=-margin;f.bounce=0;f.x=Math.random()*width;}
        }
        const size=2+5*f.z;
        ctx.drawImage(pellet,x,y,size,size);
      }else ctx.drawImage(sprite,x-w/2,y-h/2,w,h);
    }
    for(let i=powder.length-1;i>=0;i--){
      const p=powder[i];p.age+=dt;
      if(p.age>=p.duration){powder.splice(i,1);continue;}
      const t=p.age/p.duration;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;
      ctx.globalAlpha=(1-t*t)*p.opacity;
      const s=p.size*(1+t*p.growth);
      ctx.drawImage(p.sprite,p.x+cameraX-s/2,p.y+cameraY-s/2,s,s);
    }
    ctx.globalAlpha=1;
    if(!reduced.matches&&(flakes.length||powder.length))frame=requestAnimationFrame(draw);
  }
  function wake(){if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}}
  addEventListener('resize',()=>{size();wake();});document.addEventListener('visibilitychange',wake);
  reduced.addEventListener('change',()=>{powder.length=0;wake();});
  return {
    camera(x,y){cameraX=x;cameraY=y;},
    set(value){if(mode===value&&width)return;mode=value in weatherProfiles?value:'Clear';size();wake();},
    brush(x,y,dx,dy){
      const force=Math.min(1,Math.hypot(dx,dy)/22);
      for(let i=0;i<5+force*9&&powder.length<180;i++){
        const puff=i%4===0,t=Math.random();
        powder.push({sprite:puff?soft:clump,x:x-cameraX-dx*t+(Math.random()-.5)*8,y:y-cameraY-dy*t,
          vx:Math.max(-130,Math.min(130,dx*2.4))+(Math.random()-.5)*56,
          vy:-22-Math.random()*(35+force*90),gravity:puff?58:250,age:0,
          duration:.4+Math.random()*.42,size:puff?12+force*12:3+Math.random()*7,
          growth:puff?1.7:-.35,opacity:puff?.65:.98});
      }
      wake();
    }
  };
}


