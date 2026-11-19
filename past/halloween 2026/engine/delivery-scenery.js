import {THREE,box,cylinder,material,pumpkin,deadTree,planeText,batchStatic,lantern} from './visuals.js';
import {gableGeometry} from './delivery-roof.js';
import {nearestRoad} from './delivery-world.js';
import {rng} from './physics.js';
function facade(n){const cv=document.createElement('canvas');cv.width=128;cv.height=128;const c=cv.getContext('2d'),r=rng(n*71+101),pal=['#54454d','#424953','#5a4643','#494357','#4c5057'];c.fillStyle=pal[n%5];c.fillRect(0,0,128,128);c.strokeStyle='#242735';for(let y=0;y<128;y+=8){c.beginPath();c.moveTo(0,y);c.lineTo(128,y);c.stroke();for(let x=(y/8%2)*8;x<128;x+=16)c.fillRect(x,y,1,8)}for(let y=20;y<110;y+=39)for(let x=15;x<120;x+=34){c.fillStyle='#151d2d';c.fillRect(x,y,18,24);if(r()>.2){c.fillStyle=r()>.3?'#b57f4e':'#9d845f';c.fillRect(x+2,y+2,14,20);c.fillStyle='#382e3b';c.fillRect(x+8,y,2,24);c.fillRect(x,y+11,18,2)}c.fillStyle='#79737d';c.fillRect(x-2,y+24,22,3)}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapLinearFilter;return new THREE.MeshStandardMaterial({map:t,roughness:.85,emissive:0x8a5839,emissiveMap:t,emissiveIntensity:.25})}
export function buildDeliveryScenery(scene,world){
 const random=rng(world.seed),landmarks=new Map(),bridges=[],facades=Array.from({length:5},(_,i)=>facade(i)),stone=material(0x555668,'stone'),roof=material(0x454052,'roof'),road=material(0x4b4a59,'road',{roughness:.72}),curb=material(0x77717a,'stone'),iron=material(0x343542),gold=material(0xc39b59,'roadmark'),glass=material(0x457b78,null,{metalness:.4,roughness:.3}),warm=new THREE.MeshBasicMaterial({color:0xd5a36c}),cold=new THREE.MeshBasicMaterial({color:0x7bd6c4});
 box(scene,850,-.6,400,5200,1,4000,material(0x333d3e,'earth'),false);const sea=material(0x182d3c,'earth');for(const [x,z,w,h]of [[1920,1030,220,1080],[3150,1030,180,1180],[2545,400,1070,180],[2545,1660,1070,180]])box(scene,x,-.035,z,w,.07,h,sea,false);box(scene,550,-.04,0,590,.06,165,material(0x182d3c),false);box(scene,1090,-.04,500,420,.06,435,material(0x162e38),false);box(scene,550,-.04,-430,780,.06,115,material(0x182d3c),false);for(const [x,z,w,h]of [[100,520,200,240],[320,780,240,180],[610,950,250,140]])box(scene,x,-.04,z,w,.06,h,material(0x213c3d),false);
 function strip(e,offset,width,height,mat,y=.1,length=e.length){const dx=e.b.x-e.a.x,dz=e.b.y-e.a.y,n={x:-dz/e.length,y:dx/e.length},m=box(scene,(e.a.x+e.b.x)/2+n.x*offset,y,(e.a.y+e.b.y)/2+n.y*offset,width,height,length,mat,false);m.rotation.y=Math.atan2(dx,dz);return m}
 function buildHiddenHighwayBridge(e){
  const group=new THREE.Group(),angle=Math.atan2(e.b.x-e.a.x,e.b.y-e.a.y),mid={x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2},tangent={x:(e.b.x-e.a.x)/e.length,y:(e.b.y-e.a.y)/e.length},normal={x:-(e.b.y-e.a.y)/e.length,y:(e.b.x-e.a.x)/e.length};
  scene.add(group);
  const deck=box(group,mid.x,.06,mid.y,e.width,.08,e.length,road,false);deck.rotation.y=angle;
  for(const side of [-1,1]){
   const edge=box(group,mid.x+normal.x*side*(e.width/2+.55),.15,mid.y+normal.y*side*(e.width/2+.55),1.1,.22,e.length,curb,false);edge.rotation.y=angle;
   for(let d=-e.length/2+18;d<e.length/2-8;d+=54){
    const x=mid.x+tangent.x*d+normal.x*side*(e.width/2+3.1),z=mid.y+tangent.y*d+normal.y*side*(e.width/2+3.1);
    box(group,x,3.4,z,.18,.18,6.8,iron,false).rotation.y=angle;
    box(group,x,6.7,z,.72,.8,.72,e.district==='rookhaven'?cold:warm,false).rotation.y=angle;
   }
  }
  for(let d=-e.length/2+8;d<e.length/2-5;d+=11){
   const stripe=box(group,mid.x+tangent.x*d,.115,mid.y+tangent.y*d,.16,.02,3.6,gold,false);stripe.rotation.y=angle;
  }
  group.visible=false;bridges.push(group);
 }
 for(const e of world.roads){if(e.type==='shadow-bridge'){buildHiddenHighwayBridge(e);continue}strip(e,0,e.width,.08,road,.06);for(const side of [-1,1])strip(e,side*(e.width/2+.55),1.1,.22,curb,.15,Math.max(1,e.length-20));if(e.width>=13)for(let d=8;d<e.length-7;d+=11){const t=d/e.length,m=box(scene,e.a.x+(e.b.x-e.a.x)*t,.115,e.a.y+(e.b.y-e.a.y)*t,.15,.02,3.6,gold,false);m.rotation.y=Math.atan2(e.b.x-e.a.x,e.b.y-e.a.y)}
 for(let d=17;d<e.length;d+=55){const t=d/e.length,n={x:-(e.b.y-e.a.y)/e.length,y:(e.b.x-e.a.x)/e.length},x=e.a.x+(e.b.x-e.a.x)*t+n.x*(e.width/2+1.7),z=e.a.y+(e.b.y-e.a.y)*t+n.y*(e.width/2+1.7);cylinder(scene,x,3.4,z,.1,.16,6.8,iron,6);box(scene,x,6.7,z,.65,.8,.65,e.district==='rookhaven'?cold:warm,false);if(e.type==='street'&&random()<.5)pumpkin(scene,x,.2,z+1.6,1.1)}}
 for(const n of world.nodes){const edges=world.roads.filter(e=>(e.a.id===n.id||e.b.id===n.id)&&e.type!=='shadow-bridge');if(!edges.length)continue;const r=Math.max(...edges.map(e=>e.width))/2,m=new THREE.Mesh(new THREE.CircleGeometry(r,16),road);m.rotation.x=-Math.PI/2;m.position.set(n.x,.11,n.y);scene.add(m)}
 for(const b of world.solids.slice(world.buildings.length)){if(b.type==='segment'){const e={a:b.a,b:b.b,length:Math.hypot(b.b.x-b.a.x,b.b.y-b.a.y)};strip(e,0,.65,1.3,iron,.9);for(let d=0;d<e.length;d+=12){const t=d/e.length;box(scene,e.a.x+(e.b.x-e.a.x)*t,1,e.a.y+(e.b.y-e.a.y)*t,.8,2,.8,stone)}}else box(scene,b.x+b.w/2,.85,b.y+b.h/2,b.w,1.7,b.h,stone)}
 for(const b of world.buildings){const h=b.height,k=b.architecture,haunted=b.district==='rookhaven'||b.district==='gloaming',body=box(scene,b.x,h/2,b.y,b.w,h,b.h,k==='greenhouse'?glass:facades[b.style]),flat=['hotel','apartment','warehouse','workshop','theatre','diner','firestation','station','school','greenhouse'].includes(k),glow=haunted?cold:warm;
 if(!flat){const m=new THREE.Mesh(gableGeometry(b.w+1.5,b.h+1.5,Math.min(5,b.w*.23)),roof);m.position.set(b.x,h,b.y);scene.add(m);box(scene,b.x-b.w*.25,h+2,b.y+3,1.4,4,1.4,stone)}else{box(scene,b.x,h+.3,b.y,b.w+1,.6,b.h+1,roof);for(const side of [-1,1])box(scene,b.x+side*b.w/2,h+1,b.y,.5,1.7,b.h,stone)}
 if(k==='hotel'||k==='apartment')for(let level=4;level<h;level+=4)for(const side of [-1,1]){box(scene,b.x,level,b.y+side*(b.h/2+1),b.w+1,.35,2,stone);box(scene,b.x,level+.7,b.y+side*(b.h/2+1.8),b.w,1,.15,iron)}
 if(k==='chapel'){box(scene,b.x,h+5,b.y-5,5,10,5,stone);const spire=new THREE.Mesh(new THREE.ConeGeometry(4,8,4),roof);spire.position.set(b.x,h+14,b.y-5);scene.add(spire);box(scene,b.x,h+19,b.y-5,.45,4,.45,gold);box(scene,b.x,h+19.5,b.y-5,2.5,.4,.45,gold)}
 if(k==='tower'){cylinder(scene,b.x,h+1,b.y,7,7,2,stone,12);const dome=new THREE.Mesh(new THREE.SphereGeometry(7,12,6,0,Math.PI*2,0,Math.PI/2),glass);dome.position.set(b.x,h+2,b.y);scene.add(dome);const scope=cylinder(scene,b.x+3,h+6,b.y,1,1.3,9,iron,8);scope.rotation.z=-.8}
 if(k==='greenhouse'){for(let x=-b.w/2;x<=b.w/2;x+=3)box(scene,b.x+x,h/2,b.y,.22,h+.8,b.h+.5,stone);for(let z=-b.h/2;z<=b.h/2;z+=4)box(scene,b.x,h+.6,b.y+z,b.w,.2,.2,stone)}
 if(k==='theatre'){box(scene,b.x,h+1,b.y,6,2,b.h,material(0x653953));planeText(scene,'MIDNIGHT MATINEE',b.x,h-1,b.y+b.h/2+.3,b.w-2,3,{bg:'#4b293d',color:'#e7bc77'});for(let x=-b.w/2+1;x<b.w/2;x+=2)box(scene,b.x+x,2,b.y+b.h/2+2,.4,3,.4,glow)}
 if(k==='diner'){box(scene,b.x,3,b.y,b.w+.6,.5,b.h+.6,material(0xaa5751));box(scene,b.x,h+1,b.y,8,2,3,glow);for(let x=-8;x<9;x+=4)cylinder(scene,b.x+x,h+1.4,b.y+5,1,1,.7,iron,8)}
 if(k==='firestation'||k==='warehouse'){for(let x=-b.w/2+4;x<b.w/2;x+=7){box(scene,b.x+x,2.4,b.y+b.h/2+.15,5,4.8,.3,iron);for(let y=1;y<4.5;y++)box(scene,b.x+x,y,b.y+b.h/2+.35,4.8,.12,.12,stone)}if(k==='warehouse'){box(scene,b.x-6,h+5,b.y,1,10,1,gold);box(scene,b.x,h+10,b.y,13,.8,.8,gold);box(scene,b.x+5,h+6,b.y,.12,7,.12,iron)}}
 if(k==='station'){box(scene,b.x,h+2,b.y,4,4,4,stone);planeText(scene,'XII',b.x,h+2.2,b.y+2.05,2.5,2.5,{bg:'#222638',color:'#dfc998'});box(scene,b.x,2,b.y+b.h/2+1,b.w+2,.4,4,roof)}
 if(k==='witchshop'){const hat=new THREE.Mesh(new THREE.ConeGeometry(5,10,7),material(0x514264));hat.position.set(b.x,h+5,b.y);hat.rotation.z=.22;scene.add(hat);cylinder(scene,b.x,h+.3,b.y,6,6,.5,iron,12)}
 if(k==='school')planeText(scene,'COSTUME NIGHT',b.x,h+1,b.y+b.h/2+.2,b.w,2,{bg:'#442b3e',color:'#e9be7f'});
 if(['shop','pub','rowhouse'].includes(k))for(let x=-b.w/2+2;x<b.w/2;x+=4)box(scene,b.x+x,3,b.y+b.h/2+1,3,.25,2,material(x%2?0x805345:0x62536c));
 if(b.stop){const s=b.stop,axis=s.door.axis,sign=s.door.sign,door=box(scene,s.door.x,1.5,s.door.y,axis==='x'?.25:1.9,3,axis==='x'?1.9:.25,material(0x49364b));door.userData.noBatch=true;
 const bay=box(scene,s.x,.13,s.y,6,.05,12,road,false);bay.rotation.y=Math.atan2(s.tangent.x,s.tangent.y);for(const side of [-1,1]){const m=box(scene,s.x+s.tangent.x*side*5.3,.17,s.y+s.tangent.y*side*5.3,6,.04,.22,gold,false);m.rotation.y=Math.atan2(s.tangent.x,s.tangent.y)}
 lantern(scene,s.door.x,3.8,s.door.y,haunted?0x7bd6c4:0xffad54);pumpkin(scene,s.door.x+s.tangent.x*2.7,.2,s.door.y+s.tangent.y*2.7,1.3);
 const signMesh=planeText(scene,s.storyOnly?'POST OFFICE':s.name.split(' · ')[0].toUpperCase(),s.door.x+(axis==='x'?sign*.35:0),5,s.door.y+(axis==='y'?sign*.35:0),9,1.7,{font:'bold 54px Georgia',bg:'#242331',color:haunted?'#a2dfcd':'#e0bc82'});signMesh.rotation.y=axis==='x'?sign*Math.PI/2:sign<0?Math.PI:0;
 const porch=new THREE.PointLight(haunted?0x71cdbb:0xffaa5c,5,13,1.5);porch.position.set(s.x,3.8,s.y);scene.add(porch);landmarks.set(s.id,{door,porch,body});
 }else if(random()>.65)pumpkin(scene,b.x-b.w/2-.8,.15,b.y+4,.9);
 }
 for(const d of world.districts){for(let n=0;n<65;n++){const a=n/65*Math.PI*2,r=310+random()*100;if(nearestRoad({x:d.cx+Math.cos(a)*r,y:d.cy+Math.sin(a)*r}).distance>25)deadTree(scene,d.cx+Math.cos(a)*r,d.cy+Math.sin(a)*r,1.2+random()*1.5)}}

 planeText(scene,'HOLLOW LANE',-150,3,149,13,2,{font:'bold 60px Georgia'}).rotation.y=Math.PI;
 const v=[];for(const b of world.buildings){const x=b.x-b.w/2-b.height*.3,z=b.y-b.h/2+b.height*.25;v.push(x,.12,z,x+b.w,.12,z+b.h,x+b.w,.12,z,x,.12,z,x,.12,z+b.h,x+b.w,.12,z+b.h)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x090e1a,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide})));
 batchStatic(scene);return {landmarks,bridges};
}
