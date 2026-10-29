const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function createKeeperAttack(){
 let windup=0,cooldown=1.6,target=null,kind='strike',sequence=0,lastPlayer=null;
 const reach={strike:145,dash:340,pull:310,blind:285};
 const duration={strike:.9,dash:1.05,pull:1.25,blind:1.4};
 return {
  get windup(){return windup},
  get target(){return target},
  get kind(){return kind},
  update(dt,keeper,player){
   lastPlayer=player;
   player.blindTime=Math.max(0,(player.blindTime||0)-dt);
   if(windup>0){
    if(kind==='pull'){
     const dx=keeper.x-player.x,dy=keeper.y-player.y,d=Math.hypot(dx,dy)||1;
     if(d<330){const pull=Math.max(0,Math.min(d-95,76*dt));player.x+=dx/d*pull;player.y+=dy/d*pull}
    }
    windup=Math.max(0,windup-dt);
    if(windup===0){
     const d=distance(player,target||player);
     let hit=d<(kind==='strike'?72:kind==='dash'?112:kind==='pull'?170:285);
     if(kind==='dash'){
      const dx=(target?.x??player.x)-keeper.x,dy=(target?.y??player.y)-keeper.y,length=Math.hypot(dx,dy)||1,charge=Math.min(190,length);
      keeper.x+=dx/length*charge;keeper.y+=dy/length*charge;
      hit=distance(keeper,player)<125;
     }else if(kind==='pull'&&hit){
      const dx=keeper.x-player.x,dy=keeper.y-player.y,length=Math.hypot(dx,dy)||1;
      player.x+=dx/length*Math.min(90,length);player.y+=dy/length*Math.min(90,length);
     }else if(kind==='blind'&&hit)player.blindTime=1.1;
     target=null;cooldown=kind==='strike'?2.6:3.3;
     return hit?'hit':'miss';
    }
    return null;
   }
   cooldown=Math.max(0,cooldown-dt);
   if(cooldown===0){
    const kinds=['strike','dash','pull','blind'];kind=kinds[sequence++%kinds.length];
    if(distance(player,keeper)<reach[kind]){
     target={x:player.x,y:player.y};windup=duration[kind];return 'tell';
    }
    cooldown=.35;
   }
   return null;
  },
  reset(){windup=0;cooldown=1.6;target=null;kind='strike';sequence=0;if(lastPlayer)lastPlayer.blindTime=0}
 };
}
