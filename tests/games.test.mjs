import test from 'node:test';
import assert from 'node:assert/strict';
import {circleContact,moveCircle,lineBlocked,updateCar} from '../engine/physics.js';

test('fast movement cannot tunnel through a thin building wall',()=>{const p={x:0,y:0};moveCircle(p,100,0,1,[{x:5,y:-10,w:.5,h:20}]);assert.ok(p.x<=4.001);});
test('corner contacts resolve outward, including a body starting inside a collider',()=>{const h=circleContact(5,5,1,{x:0,y:0,w:10,h:10});assert.ok(h&&h.depth>0);const p={x:5,y:5};moveCircle(p,0,0,1,[{x:0,y:0,w:10,h:10}]);assert.equal(circleContact(p.x,p.y,1,{x:0,y:0,w:10,h:10}),null);});
test('vehicle controls are stable across frame rates',()=>{function simulate(dt){const car={x:0,y:0,vx:0,vy:0,angle:0};for(let t=0;t<3-1e-8;t+=dt)updateCar(car,{throttle:1,steer:.2},dt,[]);return car}const a=simulate(1/30),b=simulate(1/120);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1.5);assert.ok(Math.abs(a.angle-b.angle)<.1);});
test('car collides with buildings and loses forward momentum',()=>{const p={x:0,y:0,vx:0,vy:-35,angle:0};let impact=0;for(let n=0;n<100;n++)impact=Math.max(impact,updateCar(p,{throttle:1},.016,[{x:-10,y:-8,w:20,h:1}]));assert.ok(impact>5);assert.ok(p.y>-5.6);});
test('AI sight is blocked by grave architecture but not open lanes',()=>{const boxes=[{x:40,y:0,w:20,h:100}];assert.ok(lineBlocked({x:0,y:50},{x:100,y:50},boxes));assert.equal(lineBlocked({x:0,y:120},{x:100,y:120},boxes),false);});
