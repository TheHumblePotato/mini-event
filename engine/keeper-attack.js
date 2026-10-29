export function createKeeperAttack({windupDuration=0.9,cooldownDuration=2.6,attackRange=132,attackRadius=58}={}){
 let windup=0,cooldown=1.6,target=null;
 return {
  get windup(){return windup},
  get target(){return target},
  update(dt,keeper,player){
   if(windup>0){
    windup=Math.max(0,windup-dt);
    if(windup===0){
     const hit=target&&Math.hypot(player.x-target.x,player.y-target.y)<attackRadius;
     target=null;
     cooldown=cooldownDuration;
     return hit?'hit':'miss';
    }
    return null;
   }
   cooldown=Math.max(0,cooldown-dt);
   if(cooldown===0&&Math.hypot(player.x-keeper.x,player.y-keeper.y)<attackRange){
    target={x:player.x,y:player.y};
    windup=windupDuration;
    return 'tell';
   }
   return null;
  },
  reset(){windup=0;cooldown=1.6;target=null}
 };
}
