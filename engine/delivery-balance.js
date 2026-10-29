export const DELIVERY_CARS=[
 {id:'standard',name:'The Standard',description:'Balanced speed, handling, and crash resistance.',speed:1,acceleration:1,handling:1,grip:1,resistance:1,points:1,color:0xb45d32,scale:[1,1,1]},
 {id:'blackbird',name:'Blackbird Coupe',description:'Fast and high-scoring, but fragile and harder to handle.',speed:1.16,acceleration:1.12,handling:.86,grip:.9,resistance:.72,points:1.3,color:0x613f71,scale:[.91,.86,1.05]},
 {id:'hearse',name:'Ironwood Hearse',description:'Slow, steady, and built to absorb hard crashes.',speed:.88,acceleration:.9,handling:1.1,grip:1.12,resistance:1.4,points:.95,color:0x3e5554,scale:[1.08,1.08,1.16]},
 {id:'witchlight',name:'Witchlight Taxi',description:'Responsive steering and extra grip for narrow streets.',speed:.98,acceleration:1,handling:1.22,grip:1.18,resistance:1,points:1,color:0xa38b44,scale:[1,1,1]}
];

export function deliveryCar(id){return DELIVERY_CARS.find(car=>car.id===id)||DELIVERY_CARS[0]}
export const ROOKHAVEN_REWARD_MULTIPLIER=2.5;
