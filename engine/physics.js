export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const damp=(a,b,rate,dt)=>lerp(a,b,1-Math.exp(-rate*dt));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function circleContact(x,y,r,b){if(b.type==='segment'){const vx=b.b.x-b.a.x,vy=b.b.y-b.a.y,t=clamp(((x-b.a.x)*vx+(y-b.a.y)*vy)/(vx*vx+vy*vy),0,1),dx=x-b.a.x-vx*t,dy=y-b.a.y-vy*t,d=Math.hypot(dx,dy),reach=r+(b.r||.4);if(d>=reach)return null;const len=Math.hypot(vx,vy)||1;return {nx:d?dx/d:-vy/len,ny:d?dy/d:vx/len,depth:reach-d}}const qx=clamp(x,b.x,b.x+b.w),qy=clamp(y,b.y,b.y+b.h),dx=x-qx,dy=y-qy,d=Math.hypot(dx,dy);if(d>=r)return null;if(d>1e-8)return {nx:dx/d,ny:dy/d,depth:r-d};const sides=[{nx:-1,ny:0,depth:x-b.x+r},{nx:1,ny:0,depth:b.x+b.w-x+r},{nx:0,ny:-1,depth:y-b.y+r},{nx:0,ny:1,depth:b.y+b.h-y+r}];return sides.sort((a,b)=>a.depth-b.depth)[0]}
export function moveCircle(body,dx,dy,r,boxes){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(r*.45,.1)));let hits=[];for(let i=0;i<steps;i++){body.x+=dx/steps;body.y+=dy/steps;for(const b of boxes){const h=circleContact(body.x,body.y,r,b);if(h){body.x+=h.nx*h.depth;body.y+=h.ny*h.depth;hits.push({...h,box:b})}}}return hits}
export function lineBlocked(a,b,boxes){const d=dist(a,b),n=Math.ceil(d/12);for(let k=1;k<n;k++){const x=lerp(a.x,b.x,k/n),y=lerp(a.y,b.y,k/n);if(boxes.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))return true}return false}
export const carForward=angle=>({x:Math.sin(angle),y:-Math.cos(angle)});
export const carModelYaw=angle=>-angle;
export function updateCar(car,input,dt,solids){
 let collision=0;const steps=Math.max(1,Math.ceil(dt/.008)),step=dt/steps;
 for(let j=0;j<steps;j++){
 const f=carForward(car.angle),right={x:Math.cos(car.angle),y:Math.sin(car.angle)};let longitudinal=car.vx*f.x+car.vy*f.y,lateral=car.vx*right.x+car.vy*right.y;
 const throttle=input.throttle||0,maxSpeed=(input.speedLimit??(input.highway?90:50))*(input.speedScale??1);car.pedal=damp(car.pedal||0,Math.abs(throttle),throttle?2.8:8,step);const braking=throttle<0&&longitudinal>.15||throttle>0&&longitudinal<-.15,handbrake=!!input.handbrake;
 if(braking){const reduction=38*step;longitudinal=Math.abs(longitudinal)<reduction?0:longitudinal-Math.sign(longitudinal)*reduction}
 else if(throttle)longitudinal+=throttle*car.pedal*(throttle>0?(longitudinal<maxSpeed?(input.highway?32:22)*(1-.25*Math.max(0,longitudinal)/maxSpeed)*(input.accelerationScale??1):0):5)*step;
 const drag=(.5+(input.highway?.0025:.006)*longitudinal*longitudinal)*(input.offroad?3.5:1);longitudinal=Math.sign(longitudinal)*Math.max(0,Math.abs(longitudinal)-drag*step);
 if(handbrake)longitudinal*=Math.exp(-1.25*step);if(longitudinal>maxSpeed)longitudinal-=(longitudinal-maxSpeed)*Math.min(1,step*2.5);longitudinal=clamp(longitudinal,-6,120);car.ghostKnock=Math.max(0,(car.ghostKnock||0)-step);lateral*=Math.exp(-(car.ghostKnock>0?1.4:handbrake?2:input.wet?6:9)*(input.gripScale??1)*step);
 const steerTarget=(input.steer||0)*(longitudinal<0?-1:1)*(longitudinal<0?.43:input.highway?.24:.61)*(input.handlingScale??1)/(1+Math.abs(longitudinal)*.045);car.steering=damp(car.steering||0,steerTarget,8,step);
 const yaw=clamp(longitudinal/3.15*Math.tan(car.steering)*(handbrake?1.3:1),-2.1,2.1);const direction=Math.sign(longitudinal);if(car.motionDirection&&direction&&car.motionDirection!==direction)car.yawRate=0;if(direction)car.motionDirection=direction;if((car.yawRate||0)*yaw<0)car.yawRate=0;car.yawRate=damp(car.yawRate||0,yaw,longitudinal<0?15:10,step);if(Math.abs(longitudinal)<.35)car.yawRate=0;if(longitudinal<0)car.yawRate=clamp(car.yawRate,-1.15,1.15);
 car.angle+=car.yawRate*step;if(input.highway&&!input.steer&&Math.abs(longitudinal)>20){const road=input.roadAngle??Math.PI/2,target=Math.cos(car.angle-road)>=0?road:road+Math.PI,error=Math.atan2(Math.sin(target-car.angle),Math.cos(target-car.angle));car.angle+=error*Math.min(1,step*1.4)}car.vx=f.x*longitudinal+right.x*lateral;car.vy=f.y*longitudinal+right.y*lateral;
 car.x+=car.vx*step;car.y+=car.vy*step;const bodyForward=carForward(car.angle);
 for(const offset of [-1.2,0,1.2])for(const b of solids){const h=circleContact(car.x+bodyForward.x*offset,car.y+bodyForward.y*offset,1.2,b);if(!h)continue;car.x+=h.nx*h.depth;car.y+=h.ny*h.depth;const normal=car.vx*h.nx+car.vy*h.ny;if(normal<0){collision=Math.max(collision,-normal);car.vx-=1.12*normal*h.nx;car.vy-=1.12*normal*h.ny;car.vx*=.82;car.vy*=.82;car.yawRate*=.4}}
 car.braking=braking||handbrake;car.reversing=longitudinal<-.2;car.skid=Math.abs(lateral);
 }
 return collision;
}
export function sweptVehicleContact(a0,a1,b0,b1,radius=2.6){const x=a0.x-b0.x,y=a0.y-b0.y,dx=a1.x-b1.x-x,dy=a1.y-b1.y-y,len=dx*dx+dy*dy,t=len?clamp(-(x*dx+y*dy)/len,0,1):0;return Math.hypot(x+dx*t,y+dy*t)<radius?t:null}
export const vehicleImpactDamage=impact=>impact<3?0:Math.min(48,3+impact*1.65);
