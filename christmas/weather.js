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
  'Ice halo':[0,0,0], 'Spindrift':[135,0,144], 'Sleet':[290,205,45], 'Feather snow':[120,24,5], 'Clear':[0,0,0], 'Lake mist':[0,0,0], 'Diamond dust':[160,13,4],
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
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const powder=[],flakes=[];
  let width=0,height=0,mode='Clear',frame=0,last=0;
  function size(){
    width=canvas.width=innerWidth;height=canvas.height=innerHeight;
    flakes.length=0;
    const density=weatherProfiles[mode][0];
    const count=Math.min(1100,Math.round(density*Math.max(.55,width*height/950000)));
    for(let i=0;i<count;i++)flakes.push({x:Math.random()*width,y:Math.random()*height,z:.18+Math.random()*.82,phase:Math.random()*6.28,sprite:i%6===0?flake:soft});
  }
  function draw(now){
    frame=0;
    const dt=Math.min(.05,(now-last)/1000);last=now;
    ctx.clearRect(0,0,width,height);
    if(document.hidden||reduced.matches)return;
    const wind=weatherProfiles[mode][2]*(1+.38*Math.sin(now/4600)+.16*Math.sin(now/1300));
    for(const f of flakes){
      f.x+=dt*(wind+Math.sin(now/2100+f.phase)*11)*f.z;
      f.y+=dt*(weatherProfiles[mode][1]*(.35+f.z));
      if(f.y>height+10){f.y=-10;f.x=Math.random()*width;}
      if(f.x>width+10)f.x=-10;if(f.x< -10)f.x=width+10;
      let sprite=f.sprite,s=2.3+f.z*f.z*(mode==='Snowstorm'?13:10);
      ctx.globalAlpha=.46+f.z*.52;
      if(mode==='Diamond dust'){
        const flash=(1+Math.sin(now/460+f.phase*7))*.5;
        sprite=glint;s=3+f.z*11*flash;ctx.globalAlpha=.34+.66*flash;
      }
      if(mode==='Feather snow'){sprite=flake;s*=1.65;}
      const w=mode==='Sleet'?s*.34:s,h=mode==='Sleet'?s*1.75:s;
      if(mode==='Spindrift'){
        const band=height*(.78+.21*f.z);
        const lift=Math.sin(now/780+f.phase)*Math.min(10,height*.019);
        ctx.globalAlpha=.19+.42*f.z;
        ctx.drawImage(soft,f.x,band+lift,s*2.6,s*.64);
      }else ctx.drawImage(sprite,f.x-w/2,f.y-h/2,w,h);
    }
    for(let i=powder.length-1;i>=0;i--){
      const p=powder[i];p.age+=dt;
      if(p.age>=p.duration){powder.splice(i,1);continue;}
      const t=p.age/p.duration;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;
      ctx.globalAlpha=(1-t*t)*p.opacity;
      const s=p.size*(1+t*p.growth);
      ctx.drawImage(p.sprite,p.x-s/2,p.y-s/2,s,s);
    }
    ctx.globalAlpha=1;
    if(flakes.length||powder.length)frame=requestAnimationFrame(draw);
  }
  function wake(){if(!frame&&!document.hidden&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(draw);}}
  addEventListener('resize',size);document.addEventListener('visibilitychange',wake);
  reduced.addEventListener('change',()=>{ctx.clearRect(0,0,width,height);wake();});
  return {
    set(value){if(mode===value&&width)return;mode=value in weatherProfiles?value:'Clear';size();wake();},
    brush(x,y,dx,dy){
      const force=Math.min(1,Math.hypot(dx,dy)/22);
      for(let i=0;i<5+force*9&&powder.length<180;i++){
        const puff=i%4===0,t=Math.random();
        powder.push({sprite:puff?soft:clump,x:x-dx*t+(Math.random()-.5)*8,y:y-dy*t,
          vx:Math.max(-130,Math.min(130,dx*2.4))+(Math.random()-.5)*56,
          vy:-22-Math.random()*(35+force*90),gravity:puff?58:250,age:0,
          duration:.4+Math.random()*.42,size:puff?12+force*12:3+Math.random()*7,
          growth:puff?1.7:-.35,opacity:puff?.65:.98});
      }
      wake();
    }
  };
}


