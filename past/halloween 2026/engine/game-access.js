export function canLaunchGame({now,unlockAt=0,authorized=false,preview=false,testMode=false}){
 if(authorized&&(preview||testMode))return true;
 return now>=unlockAt;
}

export function shouldStartGraveInvestigation(stage){
 return Number.isInteger(stage)&&stage>=1&&stage<=4;
}
