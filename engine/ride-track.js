import {THREE} from './visuals.js';
import {trackCountAt,trackHeight,trackOffset} from './ride-run.js';

export function buildRideTracks(scene,curve,length,iron,wood){
 const spacing=2.8,count=Math.ceil((length+240)/spacing),dummy=new THREE.Object3D();
 const ties=new THREE.InstancedMesh(new THREE.BoxGeometry(3.35,.18,.5),wood,count*5);
 const rails=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.2,3),iron,count*10);
 const supports=new THREE.InstancedMesh(new THREE.BoxGeometry(.24,1.3,.24),wood,count*5);
 let tieIndex=0,railIndex=0,supportIndex=0;
 for(let i=0;i<count;i++){
  const d=i*spacing-80,x=curve(d),sample=((d%length)+length)%length,tracks=trackCountAt(sample);
  const slope=-Math.atan(curve(d+1)-x);
  for(let lane=0;lane<tracks;lane++){
   const offset=trackOffset(lane,tracks),height=trackHeight(lane,tracks);
   dummy.position.set(x+offset,height+.02,-d);dummy.rotation.set(0,slope,0);dummy.updateMatrix();ties.setMatrixAt(tieIndex++,dummy.matrix);
   for(const side of [-1,1]){dummy.position.set(x+offset+side*.82,height+.18,-d);dummy.rotation.set(0,slope,0);dummy.updateMatrix();rails.setMatrixAt(railIndex++,dummy.matrix)}
   if(height>0&&i%8===0){dummy.position.set(x+offset,height/2-.08,-d);dummy.rotation.set(0,slope,0);dummy.scale.set(1,height/1.3,1);dummy.updateMatrix();supports.setMatrixAt(supportIndex++,dummy.matrix);dummy.scale.set(1,1,1)}
  }
 }
 ties.count=tieIndex;rails.count=railIndex;supports.count=supportIndex;
 scene.add(ties,rails,supports);
 return {ties,rails,supports};
}
