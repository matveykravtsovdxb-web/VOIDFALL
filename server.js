
const express=require("express"),http=require("http"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server,{cors:{origin:"*"}});
app.use(express.static("public")); const PORT=process.env.PORT||3000;
const WORLD={w:4600,h:3000},MAX=4,FLOORS=60,RECONNECT_MS=30000;
const regions=["Verdant Frontier","Ember Wastes","Frostwild","Storm Reach","Iron Bastion","Bloodmoon Vale","Crystal Depths","Ascendant Citadel"];
const themes=["forest","fire","ice","storm","iron","void","crystal","celestial"];
const regionStyle=[
 {accent:"#58e6a7",fog:"#07140f",hazard:"vines",title:"OVERGROWN FRONTIER"},
 {accent:"#ff8a4c",fog:"#1b0805",hazard:"lava",title:"EMBER WASTES"},
 {accent:"#7ed9ff",fog:"#06131d",hazard:"ice",title:"FROSTWILD"},
 {accent:"#a88cff",fog:"#09091b",hazard:"storm",title:"STORM REACH"},
 {accent:"#c7b28a",fog:"#0d0e12",hazard:"steel",title:"IRON BASTION"},
 {accent:"#ff668f",fog:"#16070f",hazard:"void",title:"BLOODMOON VALE"},
 {accent:"#66c8ff",fog:"#070a1b",hazard:"crystal",title:"CRYSTAL DEPTHS"},
 {accent:"#ffe49a",fog:"#0a0d19",hazard:"stars",title:"ASCENDANT CITADEL"}
];
const bosses=[
["Abyss Warden",["Rift Volley","Graviton Rush","Abyss Nova"]],["Ash Tyrant",["Meteor Ring","Flame Charge","Inferno Burst"]],
["Frost Revenant",["Ice Lance","Glacial Sweep","Frost Prison"]],["Storm Seraph",["Chain Lightning","Tempest Ring","Skyfall"]],
["Iron Colossus",["Cannon Slam","Iron Barrage","Fortress Pulse"]],["Blood Knight",["Blood Orbs","Knight Rush","Crimson Wave"]],
["Void Hydra",["Hydra Bolts","Triple Lunge","Void Spiral"]],["Moon Eater",["Moon Blades","Lunar Dive","Gravity Well"]],
["Sunbreaker",["Solar Shots","Sun Dash","Solar Flare"]],["Grave Monarch",["Grave Bolts","Coffin Ring","Monarch Crash"]],
["Dread Kraken",["Tidal Orbs","Tentacle Sweep","Deep Surge"]],["Crystal Dragon",["Crystal Spear","Shard Storm","Prism Beam"]],
["Clockwork Prime",["Gear Barrage","Time Dash","Overclock"]],["Nightmare King",["Night Blades","Fear Ring","Dark Collapse"]],
["Thunder Titan",["Thunder Orbs","Titan Charge","Thunder Dome"]],["Ember Phoenix",["Ember Rain","Phoenix Dive","Inferno Wings"]],
["Rift Devourer",["Rift Spears","Portal Dash","Reality Break"]],["Celestial Judge",["Judgement Bolts","Halo Sweep","Heavenfall"]],
["Realmfall Core",["Core Lasers","Core Rush","Realm Pulse"]],["The Ascendant",["Ascension Blades","Phase Shift","Worldbreaker"]]
];
const cards=[
["Titan Rounds","COMMON","+8% cannon damage",90], ["Reactive Plating","COMMON","+20 armor",100], ["Thruster Tuning","COMMON","+12% speed",90], ["Rapid Loader","COMMON","+18% fire rate",100], ["Energy Cell","COMMON","+25 max energy",100], ["Magnetic Shells","COMMON","+15% projectile speed",100],
["Bulwark Frame","COMMON","+45 max HP",100], ["Cooling Fins","COMMON","+10% cooldown recovery",110], ["Targeting Lens","COMMON","+8% critical chance",110], ["Scavenger Rig","COMMON","+4 gold per kill",100],
["Vampiric Core","RARE","heal 2 HP on kill",160], ["Execution Protocol","RARE","+35% damage to low-HP enemies",170], ["Overdrive","RARE","dash cooldown -30%",170], ["Fortified Hull","RARE","+60 max HP",160], ["Tank Doctrine","RARE","+35 armor and +25 HP",180], ["Salvage Engine","RARE","kills restore 3 energy",170], ["Adrenal Plating","RARE","below 40% HP: +20% damage",180], ["Boss Hunter","RARE","+25% boss damage",190],
["EMP Amplifier","EPIC","EMP radius +45%",240], ["Missile Guidance","EPIC","missile damage +40%",250], ["Twin Loader","EPIC","fire rate +30%",240], ["Precision Core","EPIC","+12% critical chance",250], ["Missile Overcharge","EPIC","+35% missile damage",250], ["Reactive Shield","EPIC","dash grants 55 shield",250], ["Heat Siphon","EPIC","shots restore 1 energy",240], ["Chain Reactor","EPIC","every 5th shot deals +100% damage",270],
["Ability Reactor","MYTHIC","+30 energy and +6 energy/sec",350], ["Fortress Mode","MYTHIC","+50 armor, -8% speed",360], ["Glass Reactor","MYTHIC","+55% damage, -40% max HP",380], ["Gravity Shells","MYTHIC","shots pull nearby enemies",390], ["Critical Mass","MYTHIC","crit chance +18%, crit damage +35%",390],
["Shield Matrix","LEGENDARY","start each floor with 120 shield",500], ["Phoenix Circuit","LEGENDARY","once per floor survive a lethal hit",500], ["Chrono Engine","LEGENDARY","cooldowns recover 20% faster",520], ["Royal Arsenal","LEGENDARY","+25% damage and +15 armor",550], ["Aegis Protocol","LEGENDARY","revive with 70% HP and 120 shield",560],
["Reality Core","SECRET","all card bonuses amplified",900], ["Infinite Battery","SECRET","energy regeneration doubled",950], ["Worldbreaker","SECRET","+70% damage, +20% boss damage, -15% speed",1000]
];
const relics=[
["Solar Core","Every 10th shot deals 2x bonus damage"],["Void Battery","Start each floor with full energy and +10 energy/sec"],["Aegis Plate","Reviving grants 120 shield"],["Hunter Lens","Elites take 30% more damage"],["Royal Sigil","Boss kills grant +100 gold"],["Chrono Shard","Cooldowns recover 18% faster"],["Overlord Crest","Boss damage received is reduced by 22%"],["War Drum","After killing an enemy, fire rate improves for 2 seconds"],["Emergency Capacitor","Below 25% HP, instantly gain 40 energy once per floor"],["Molten Heart","Missiles leave a damaging impact zone"],["Frost Engine","Enemies near you move 12% slower"],["Prism Eye","Every 8th shot pierces an additional target"],["Bounty Seal","Elite kills grant 20 gold"],["Fortune Gear","Shop purchases cost 15% less"],["Second Wind","First revive each floor is faster"],["Titan Core","Gain 8% max HP and 8 armor each boss defeated"]
];
const abilities=[
 ["nova","NOVA CANNON","RARE","Heavy explosive shell",180,4,25], ["rail","RAIL SHOT","EPIC","Piercing high-damage shot",260,5,30], ["barrier","AEGIS BARRIER","EPIC","Gain 180 shield",240,8,35], ["blackhole","VOID WELL","MYTHIC","Gravity well damages nearby foes",420,11,45], ["meteor","METEOR CALL","LEGENDARY","Strike the cursor area",600,13,55], ["overclock","OVERDRIVE","MYTHIC","Speed and fire-rate surge",380,10,35], ["repair","NANITE REPAIR","RARE","Instantly repair 25% max HP",210,9,40], ["volley","ORBITAL VOLLEY","LEGENDARY","Launch a radial barrage",520,12,50]
];
const enemyTypes={
drone:[70,100,12,18,"#62e7ff"],scout:[95,145,16,20,"#9cff6a"],bruiser:[220,70,25,30,"#ffb35c"],
gunner:[120,75,13,22,"#c99cff"],warden:[340,52,35,38,"#ff6f8e"],hunter:[155,110,20,24,"#fff36a"]
};
const rooms=new Map(); const rand=(a,b)=>Math.random()*(b-a)+a, pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const uid=()=>Math.random().toString(36).slice(2,9);
function def(n){
 let i=Math.min(7,Math.floor((n-1)/8)),boss=n%3===0;
 let pattern=["COMBAT","GAUNTLET","BOSS","ELITE","TREASURE","EVENT","SHOP","CHALLENGE","COMBAT","MINI"];
 let type=boss?"BOSS":pattern[(n-1)%pattern.length]; if(n===60)type="FINAL_BOSS";
 const objectives={COMBAT:"CLEAR ALL HOSTILES",GAUNTLET:"SURVIVE THE GAUNTLET",BOSS:"DEFEAT THE GUARDIAN",ELITE:"DESTROY ELITE HOSTILES",TREASURE:"SECURE THE TREASURE CACHE",EVENT:"COMPLETE THE EVENT",SHOP:"RESTOCK AND UPGRADE",CHALLENGE:"CLEAR THE SPECIAL CHALLENGE",MINI:"DEFEAT THE MINI-BOSS",FINAL_BOSS:"DEFEAT THE ASCENDANT"};
 return {n,type,region:regions[i],theme:themes[i],regionStyle:regionStyle[i],bossIndex:boss?((Math.floor(n/3)-1)%20):-1,objective:objectives[type],layout:(n*17)%5};
}
function player(id,name,token){return{id,token:token||uid(),online:true,name:name||"Pilot",ready:false,x:WORLD.w/2,y:WORLD.h-330,hp:450,maxHp:450,energy:120,maxEnergy:120,damage:44,armor:20,speed:260,fireRate:.16,gold:160,xp:0,level:1,kills:0,downed:false,revive:0,invuln:1,dashCd:0,empCd:0,missileCd:0,shot:0,shield:0,cards:[],relics:[],abilities:["nova"],equippedAbility:"nova",abilityCd:0,abilityBuff:0,abilityBuffBaseSpeed:260,abilityBuffBaseFire:.16,abilityBuffBaseEnergy:0,abilityCount:0,abilityUsed:false,abilityFloor:0,abilityName:"NOVA CANNON",weapon:"CANNON",crit:0,critDamage:1.8,missileMult:1,empRadius:1,regen:0,energyRegen:15,fireBonus:0,damageBoss:1,goldKill:6,projectileSpeed:1,shots:0,chainShot:0,heatSiphon:0,adrenal:1,bounty:0,secondWind:false,emergency:false,titanStacks:0,stats:{shots:0,damage:0,damageTaken:0}}}
function enemy(type,elite=false){let t=enemyTypes[type],m=elite?1.7:1;return{id:uid(),type,elite,x:rand(180,WORLD.w-180),y:rand(180,WORLD.h-500),hp:t[0]*m,maxHp:t[0]*m,speed:t[1]*(elite?1.08:1),damage:t[2]*m,r:t[3]*(elite?1.12:1),color:t[4],cd:rand(.2,1.2)}}
function reset(r){r.victory=false;for(let p of Object.values(r.players)){p.x=WORLD.w/2+rand(-240,240);p.y=WORLD.h-330;p.hp=p.maxHp;p.energy=p.maxEnergy;p.phoenixUsed=false;p.downed=false;p.revive=0;p.invuln=2;p.dashCd=p.empCd=p.missileCd=p.abilityCd=0;p.abilityFloor=r.floor;p.abilityUsed=false;p.emergencyUsed=false;p.secondWindUsed=false}}
function spawn(r){r.enemies=[];r.projectiles=[];r.effects=[];r.mapObjects=[];for(let i=0;i<18;i++)r.mapObjects.push({x:rand(220,WORLD.w-220),y:rand(180,WORLD.h-560),w:rand(70,180),h:rand(40,120),kind:(i+r.floor)%4});r.boss=null;r.completed=false;r.started=true;r.gameOver=false;r.victory=false;r.floorStartedAt=Date.now();r.treasureClaimed=false;
let f=def(r.floor); if(f.type==="BOSS"||f.type==="FINAL_BOSS"){let b=f.type==="FINAL_BOSS"?bosses[19]:bosses[f.bossIndex];r.boss={name:f.type==="FINAL_BOSS"?"THE ASCENDANT • FINAL FORM":b[0],moves:b[1],x:WORLD.w/2,y:600,r:f.type==="FINAL_BOSS"?190:155,hp:(f.type==="FINAL_BOSS"?24000:6500)+r.floor*450,maxHp:((f.type==="FINAL_BOSS"?24000:6500)+r.floor*450)*(r.mode==="HARD"?1.3:r.mode==="NIGHTMARE"?1.7:1),phase:1,cd:1.3,ability:0,vx:0,vy:0,final:f.type==="FINAL_BOSS",index:f.type==="FINAL_BOSS"?19:f.bossIndex}}
else if(f.type!=="SHOP"&&f.type!=="TREASURE"){let n=f.type==="EVENT"?6:f.type==="MINI"?11:f.type==="CHALLENGE"?18:Math.min(34,9+Math.floor(r.floor*.7)),types=Object.keys(enemyTypes);for(let i=0;i<n;i++)r.enemies.push(enemy(pick(types),f.type==="ELITE"?true:Math.random()<.16));if(f.type==="MINI")r.enemies.push(enemy("warden",true));let mult=r.mode==="HARD"?1.25:r.mode==="NIGHTMARE"?1.55:1;for(let e of r.enemies){e.hp*=mult;e.maxHp*=mult;e.damage*=mult}}
}
function reality(p,v){return p.reality?v*1.18:v}
function apply(p,c){let n=c[0];
 if(n==="Titan Rounds")p.damage+=reality(p,p.damage*.08); if(n==="Reactive Plating")p.armor+=reality(p,20); if(n==="Thruster Tuning")p.speed*=1.12; if(n==="Rapid Loader")p.fireRate*=.82;
 if(n==="Energy Cell"){p.maxEnergy+=25;p.energy=p.maxEnergy} if(n==="Magnetic Shells")p.projectileSpeed*=1.15; if(n==="Bulwark Frame"){p.maxHp+=45;p.hp+=45}
 if(n==="Cooling Fins")p.chrono=(p.chrono||1)*.9; if(n==="Targeting Lens")p.crit+=.08; if(n==="Scavenger Rig")p.goldKill+=4; if(n==="Vampiric Core")p.regen+=2;
 if(n==="Execution Protocol")p.execute=1.35; if(n==="Overdrive")p.dashBonus=.3; if(n==="Fortified Hull"){p.maxHp+=60;p.hp+=60}
 if(n==="Tank Doctrine"){p.armor+=35;p.maxHp+=25;p.hp+=25} if(n==="Salvage Engine")p.salvage=3; if(n==="Adrenal Plating")p.adrenal=1.2; if(n==="Boss Hunter")p.damageBoss*=1.25;
 if(n==="EMP Amplifier")p.empRadius=1.45; if(n==="Missile Guidance")p.missileMult=1.4; if(n==="Twin Loader")p.fireRate*=.7; if(n==="Precision Core")p.crit+=.12; if(n==="Missile Overcharge")p.missileMult*=1.35;
 if(n==="Reactive Shield")p.reactiveShield=55; if(n==="Heat Siphon")p.heatSiphon=1; if(n==="Chain Reactor")p.chainShot=5; if(n==="Ability Reactor"){p.maxEnergy+=30;p.energy=p.maxEnergy;p.energyRegen+=6}
 if(n==="Fortress Mode"){p.armor+=50;p.speed*=.92} if(n==="Glass Reactor"){p.damage*=1.55;p.maxHp=Math.max(120,Math.round(p.maxHp*.6));p.hp=Math.min(p.hp,p.maxHp)}
 if(n==="Gravity Shells")p.gravity=1; if(n==="Critical Mass"){p.crit+=.18;p.critDamage+=.35} if(n==="Shield Matrix")p.floorShield=120; if(n==="Phoenix Circuit")p.phoenix=true;
 if(n==="Chrono Engine")p.chrono=.8; if(n==="Royal Arsenal"){p.damage*=1.25;p.armor+=15} if(n==="Aegis Protocol")p.aegis=1;
 if(n==="Reality Core")p.reality=true; if(n==="Infinite Battery")p.energyRegen*=2; if(n==="Worldbreaker"){p.damage*=1.7;p.damageBoss*=1.2;p.speed*=.85}
}
function synergy(p){
 const has=n=>p.cards.includes(n);
 if(has("Titan Rounds")&&has("Twin Loader"))p.damage*=1.12; if(has("Missile Guidance")&&has("Missile Overcharge"))p.missileMult*=1.2;
 if(has("Energy Cell")&&has("Ability Reactor"))p.energyRegen+=8; if(has("Reactive Plating")&&has("Fortress Mode"))p.shield=Math.max(p.shield,100);
 if(has("Chain Reactor")&&has("Heat Siphon"))p.energyRegen+=5; if(has("Critical Mass")&&has("Precision Core"))p.crit+=.06;
}
function giveCard(p,c=pick(cards)){p.cards.push(c[0]);apply(p,c);synergy(p);return c}
function giveRelic(p,r=pick(relics)){if(p.relics.includes(r[0]))return r;p.relics.push(r[0]);
 if(r[0]==="Solar Core")p.solar=0; if(r[0]==="Void Battery"){p.energy=p.maxEnergy;p.energyRegen+=10} if(r[0]==="Chrono Shard")p.chrono=(p.chrono||1)*.82;
 if(r[0]==="Overlord Crest")p.damageBoss=.78; if(r[0]==="Hunter Lens")p.eliteBonus=1.3; if(r[0]==="Emergency Capacitor")p.emergency=true;
 if(r[0]==="Second Wind")p.secondWind=true; if(r[0]==="Fortune Gear")p.shopDiscount=.85; if(r[0]==="War Drum")p.warDrum=true; if(r[0]==="Molten Heart")p.molten=true;
 if(r[0]==="Frost Engine")p.frostAura=true; if(r[0]==="Prism Eye")p.prism=true; if(r[0]==="Bounty Seal")p.bounty=20; if(r[0]==="Titan Core")p.titanRelic=true; return r}
function level(p){while(p.xp>=p.level*100){p.xp-=p.level*100;p.level++;p.maxHp+=30;p.hp=p.maxHp;p.damage+=5}}
function hurt(r,p,d){if(p.downed||p.invuln>0)return;let a=Math.max(1,d-p.armor*.2);if(r.boss)a*=p.damageBoss;if(p.shield){let s=Math.min(a,p.shield);p.shield-=s;a-=s}p.stats.damageTaken+=a;p.hp-=a;
 if(p.emergency&&p.hp>0&&p.hp<p.maxHp*.25&&!p.emergencyUsed){p.emergencyUsed=true;p.energy=Math.min(p.maxEnergy,p.energy+40);r.effects.push({type:"pulse",x:p.x,y:p.y,t:.7})}
 if(p.hp<=0){if(p.phoenix&&!p.phoenixUsed){p.phoenixUsed=true;p.hp=Math.round(p.maxHp*.35);p.shield=100;p.invuln=2;return}p.hp=0;p.downed=true;p.revive=0}}
function projectile(r,p,t,kind="shell"){let dx=t.x-p.x,dy=t.y-p.y,l=Math.hypot(dx,dy)||1,s=(kind==="missile"?760:kind==="rail"?1200:900)*(p.projectileSpeed||1),d=p.damage*(p.chainShot&&p.shots%p.chainShot===0?2:1)*(kind==="missile"?(p.missileMult||1):kind==="rail"?2.4:1);
 if(p.relics.includes("Solar Core")){p.solar=(p.solar||0)+1;if(p.solar%10===0)d*=2} if(p.crit&&Math.random()<p.crit)d*=p.critDamage||1.8; if(p.hp<p.maxHp*.4)d*=p.adrenal||1;
 r.projectiles.push({id:uid(),x:p.x,y:p.y,vx:dx/l*s,vy:dy/l*s,owner:p.id,damage:d,life:2.4,r:kind==="missile"?10:kind==="rail"?5:6,kind,homing:kind==="missile"})}
function ability(r,p,t){if(!p.equippedAbility||p.abilityCd>0)return false;let a=abilities.find(x=>x[0]===p.equippedAbility);if(!a||p.energy<a[6])return false;p.energy-=a[6];p.abilityCd=a[5]*(p.chrono||1);p.abilityUsed=true;p.abilityCount++;let dx=t.x-p.x,dy=t.y-p.y,l=Math.hypot(dx,dy)||1;
 if(a[0]==="nova")projectile(r,p,t,"missile");
 else if(a[0]==="rail")projectile(r,p,t,"rail");
 else if(a[0]==="barrier")p.shield=Math.max(p.shield,180);
 else if(a[0]==="blackhole"){r.effects.push({type:"blackhole",x:t.x,y:t.y,t:3.2});for(let e of r.enemies)if(dist(e,t)<250)e.hp-=p.damage*2.2;if(r.boss&&dist(r.boss,t)<300)r.boss.hp-=p.damage*2}
 else if(a[0]==="meteor"){r.effects.push({type:"meteor",x:t.x,y:t.y,t:.8});for(let e of r.enemies)if(dist(e,t)<260)e.hp-=p.damage*3;if(r.boss&&dist(r.boss,t)<300)r.boss.hp-=p.damage*3}
 else if(a[0]==="overclock"){p.abilityBuff=5;p._preAbilitySpeed=p.speed;p._preAbilityFire=p.fireRate;p.speed*=1.35;p.fireRate*=.62}
 else if(a[0]==="repair"){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.25);r.effects.push({type:"heal",x:p.x,y:p.y,t:.7})}
 else if(a[0]==="volley"){for(let i=0;i<16;i++){let q=i*Math.PI*2/16;r.projectiles.push({id:uid(),x:p.x,y:p.y,vx:Math.cos(q)*680,vy:Math.sin(q)*680,owner:p.id,damage:p.damage*1.35,life:1.7,r:7,kind:"orbital"})}}
 r.effects.push({type:"ability",x:p.x,y:p.y,t:.5});return true}
function reward(r){for(let p of Object.values(r.players)){p.gold+=45+r.floor*5;if(r.floor%10===0)p.gold+=100;p.xp+=60+r.floor*10;level(p);if(r.floor%2===0)giveCard(p);if(r.floor%5===0)giveRelic(p);if(r.floor%7===0&&p.abilities.length<abilities.length){let a=pick(abilities.filter(x=>!p.abilities.includes(x[0])));if(a)p.abilities.push(a[0])}}}
function bossAttack(r,b){let ps=Object.values(r.players).filter(p=>!p.downed);if(!ps.length)return;let t=pick(ps),a=b.ability++%3,idx=b.index%6,phase=b.phase;
 const orb=(x,y,ang,speed,damage,radius=9)=>r.projectiles.push({id:uid(),x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,owner:"boss",damage,life:4,r:radius,kind:"boss"});
 if(idx===0){if(a===0){for(let i=0;i<24;i++)orb(b.x,b.y,i*Math.PI*2/24+(phase===2?.08:0),430,30+r.floor)}else if(a===1){let q=Math.atan2(t.y-b.y,t.x-b.x);for(let i=-6;i<=6;i++)orb(b.x,b.y,q+i*.09,650,38+r.floor)}else{r.effects.push({type:"nova",x:b.x,y:b.y,t:.7});for(let i=0;i<12;i++)orb(b.x,b.y,i*Math.PI/6,520,45+r.floor)}}
 else if(idx===1){if(a===0){for(let i=0;i<8;i++)orb(b.x,b.y,i*Math.PI/4,330,36)}else if(a===1){b.vx=(t.x-b.x)/Math.max(1,dist(b,t))*900;b.vy=(t.y-b.y)/Math.max(1,dist(b,t))*900}else{for(let i=0;i<20;i++){let ang=i*Math.PI*2/20;orb(t.x+Math.cos(ang)*300,t.y+Math.sin(ang)*300,ang+Math.PI,260,34)}}}
 else if(idx===2){if(a===0){for(let i=0;i<11;i++)orb(b.x,b.y,Math.atan2(t.y-b.y,t.x-b.x)+(i-5)*.1,600,32)}else if(a===1){r.effects.push({type:"ice",x:t.x,y:t.y,t:1.5})}else{for(let i=0;i<5;i++)orb(b.x,b.y,Math.random()*Math.PI*2,380,52,14)}}
 else if(idx===3){if(a===0){for(let i=0;i<18;i++)orb(b.x,b.y,i*Math.PI/9,520,28)}else if(a===1){r.effects.push({type:"storm",x:t.x,y:t.y,t:1.1});for(let i=0;i<6;i++)orb(t.x+rand(-180,180),t.y-500,Math.PI/2,760,48)}else{b.vx=(t.x-b.x)*2;b.vy=(t.y-b.y)*2}}
 else if(idx===4){if(a===0){for(let i=0;i<6;i++)orb(b.x,b.y,i*Math.PI/3,300,60,15)}else if(a===1){r.effects.push({type:"slam",x:b.x,y:b.y,t:.8});for(let p of ps)if(dist(p,b)<420)hurt(r,p,75)}else{for(let i=0;i<14;i++)orb(b.x,b.y,i*Math.PI*2/14,260,44)}}
 else {if(a===0){for(let i=0;i<16;i++)orb(b.x,b.y,i*Math.PI*2/16+(phase===2?Math.PI/16:0),470,38)}else if(a===1){r.effects.push({type:"void",x:t.x,y:t.y,t:2});for(let i=0;i<9;i++)orb(t.x,t.y,i*Math.PI*2/9,380,42)}else{b.vx=(t.x-b.x)/Math.max(1,dist(b,t))*780;b.vy=(t.y-b.y)/Math.max(1,dist(b,t))*780;for(let i=0;i<10;i++)orb(b.x,b.y,Math.random()*Math.PI*2,600,50)}}}
function tick(r,dt){if(!r.started)return;
for(let p of Object.values(r.players)){p.invuln=Math.max(0,p.invuln-dt);p.dashCd=Math.max(0,p.dashCd-dt*(p.chrono||1));p.empCd=Math.max(0,p.empCd-dt*(p.chrono||1));p.missileCd=Math.max(0,p.missileCd-dt*(p.chrono||1));p.abilityCd=Math.max(0,p.abilityCd-dt*(p.chrono||1));p.shot=Math.max(0,p.shot-dt);if(p.abilityBuff>0){p.abilityBuff-=dt;if(p.abilityBuff<=0){p.speed=p._preAbilitySpeed||p.speed;p.fireRate=p._preAbilityFire||p.fireRate}}p.energy=clamp(p.energy+(p.energyRegen||15)*dt,0,p.maxEnergy);if(p.floorShield&&p.shield<=0&&p.hp===p.maxHp){p.shield=p.floorShield;p.floorShield=0}
if(p.regen)p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);if(p.downed){let live=Object.values(r.players).some(x=>x.id!==p.id&&!x.downed);if(live)p.revive+=dt*(p.secondWind&&!p.secondWindUsed?1.8:1);if(p.revive>=7){p.downed=false;p.hp=Math.round(p.maxHp*(p.aegis?.7:.4));p.invuln=2;p.revive=0;if(p.secondWind&&!p.secondWindUsed)p.secondWindUsed=true;if(p.relics.includes("Aegis Plate"))p.shield=100}}}
for(let e of r.enemies){e.cd-=dt;let ps=Object.values(r.players).filter(p=>!p.downed);if(!ps.length)continue;let t=ps.reduce((a,b)=>dist(a,e)<dist(b,e)?a:b),dx=t.x-e.x,dy=t.y-e.y,l=Math.hypot(dx,dy)||1;let aura=t.relics.includes("Frost Engine")&&l<260?.88:1;
if(e.type==="gunner"||e.type==="hunter"){if(l>390){e.x+=dx/l*e.speed*dt;e.y+=dy/l*e.speed*dt}if(e.cd<=0&&l<950){e.cd=1.35;r.projectiles.push({id:uid(),x:e.x,y:e.y,vx:dx/l*420,vy:dy/l*420,owner:"enemy",damage:e.damage,life:3,r:7,kind:"enemy"})}}
else{e.x+=dx/l*e.speed*aura*dt;e.y+=dy/l*e.speed*aura*dt;if(l<e.r+26&&e.cd<=0){e.cd=1.05;hurt(r,t,e.damage)}}}
if(r.boss){let b=r.boss;b.cd-=dt;if(b.cd<=0){b.cd=1.65;b.vx*=.5;b.vy*=.5;bossAttack(r,b)}b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.9;b.vy*=.9;b.x=clamp(b.x,300,WORLD.w-300);b.y=clamp(b.y,250,WORLD.h-500);if(b.hp<b.maxHp*.5)b.phase=2}
for(let q of r.projectiles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.owner==="boss"||q.owner==="enemy"){for(let p of Object.values(r.players))if(!p.downed&&dist(q,p)<q.r+24){hurt(r,p,q.damage);q.life=0;break}}
else{for(let e of r.enemies)if(e.hp>0&&dist(q,e)<q.r+e.r){let p=r.players[q.owner];let mult=e.elite&&p?.eliteBonus?p.eliteBonus:1;let low=e.hp<e.maxHp*.25&&p?.execute?p.execute:1;e.hp-=q.damage*mult*low;if(p&&p.gravity){for(let z of r.enemies)if(z!==e&&dist(z,e)<120)z.x+=(e.x-z.x)*.05}if(p&&p.heatSiphon)p.energy=Math.min(p.maxEnergy,p.energy+1);if(p&&p.salvage)p.energy=Math.min(p.maxEnergy,p.energy+p.salvage);q.life=0;if(p){p.stats.damage+=q.damage;if(p.relics.includes("Prism Eye")&&p.shots%8===0){q.life=.35}if(e.hp<=0){p.kills++;p.xp+=e.xp||12;p.gold+=p.goldKill+(e.elite?p.bounty||0:0);if(p.regen)p.hp=Math.min(p.maxHp,p.hp+p.regen);if(p.relics.includes("War Drum")){p.fireRate=Math.max(.05,p.fireRate*.9);setTimeout(()=>{if(p.fireRate<.16)p.fireRate=Math.min(.16,p.fireRate/0.9)},2000)}}level(p)}break}
if(r.boss&&q.life>0&&dist(q,r.boss)<q.r+r.boss.r){r.boss.hp-=q.damage;if(p&&p.relics.includes("Molten Heart")&&q.kind==="missile")r.effects.push({type:"molten",x:r.boss.x,y:r.boss.y,t:1.1});q.life=0}}}
r.projectiles=r.projectiles.filter(q=>q.life>0&&q.x>-150&&q.x<WORLD.w+150&&q.y>-150&&q.y<WORLD.h+150);
r.enemies=r.enemies.filter(e=>e.hp>0);r.effects.forEach(e=>e.t-=dt);r.effects=r.effects.filter(e=>e.t>0);
if(!Object.values(r.players).some(p=>!p.downed)){r.gameOver=true;r.started=false;return}
let fdef=def(r.floor),treasure=fdef.type==="TREASURE"&&Date.now()-r.floorStartedAt>2500,clear=!r.boss&&r.enemies.length===0&&!["SHOP","TREASURE"].includes(fdef.type),bc=r.boss&&r.boss.hp<=0;
if((clear||treasure||bc)&&!r.completed){r.completed=true;reward(r);if(bc){for(let p of Object.values(r.players)){p.gold+=150;if(p.relics.includes("Royal Sigil"))p.gold+=100}r.boss=null;if(r.floor===FLOORS){r.victory=true;r.started=false}for(let p of Object.values(r.players)){if(p.titanRelic){p.maxHp=Math.round(p.maxHp*1.08);p.hp=p.maxHp;p.armor+=8}}if(treasure){for(let p of Object.values(r.players)){giveCard(p);giveRelic(p);p.gold+=180}}}}}
function pub(r){return{floor:r.floor,floorDef:def(r.floor),started:r.started,completed:r.completed,gameOver:r.gameOver,victory:r.victory||false,host:r.host,mode:r.mode||"NORMAL",world:WORLD,
players:Object.values(r.players).map(p=>({...p,online:p.online})),enemies:r.enemies,boss:r.boss,projectiles:r.projectiles,effects:r.effects,mapObjects:r.mapObjects||[],cards,relics,abilities}}
io.on("connection",s=>{
s.on("createRoom",(data,cb)=>{let name=typeof data==="string"?data:data?.name,token=data?.token||uid();let code;do{code=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(code));let r={code,host:s.id,players:{},floor:1,started:false,completed:false,gameOver:false,victory:false,enemies:[],projectiles:[],effects:[],boss:null,mode:"NORMAL"};rooms.set(code,r);r.players[s.id]=player(s.id,String(name||"Pilot").slice(0,16),token);s.join(code);cb({ok:true,code,token})});
s.on("reconnect",(d,cb)=>{for(let r of rooms.values())for(let p of Object.values(r.players))if(p.token===d.token){delete r.players[p.id];p.id=s.id;p.online=true;r.players[s.id]=p;s.join(r.code);return cb?.({ok:true,code:r.code})}cb?.({ok:false})});
s.on("setReady",(code,ready)=>{let r=rooms.get(code),p=r?.players[s.id];if(p)p.ready=!!ready});
s.on("setMode",(d)=>{let r=rooms.get(d.code);if(r&&r.host===s.id)r.mode=["NORMAL","HARD","NIGHTMARE","ENDLESS"].includes(d.mode)?d.mode:"NORMAL"});
s.on("joinRoom",(d,cb)=>{let code=String(d.code||"").toUpperCase(),r=rooms.get(code);if(!r)return cb({ok:false,error:"Lobby not found"});if(Object.keys(r.players).length>=MAX)return cb({ok:false,error:"Lobby full"});r.players[s.id]=player(s.id,String(d.name||"Pilot").slice(0,16),d.token||uid());s.join(code);cb({ok:true,code,token:r.players[s.id].token})});
s.on("start",code=>{let r=rooms.get(code);if(r&&r.host===s.id&&Object.values(r.players).every(p=>p.ready||p.id===s.id)){r.floor=1;reset(r);spawn(r)}});
s.on("input",d=>{let r=rooms.get(d.code),p=r?.players[s.id];if(!r||!p||p.downed)return;let x=+d.x||0,y=+d.y||0,l=Math.hypot(x,y)||1,dt=.033;
p.x=clamp(p.x+x/l*p.speed*dt,50,WORLD.w-50);p.y=clamp(p.y+y/l*p.speed*dt,50,WORLD.h-50);
if(d.dash&&p.dashCd<=0&&p.energy>=25){p.x=clamp(p.x+x/l*270,50,WORLD.w-50);p.y=clamp(p.y+y/l*270,50,WORLD.h-50);p.dashCd=2.4;p.energy-=25;p.invuln=.3;if(p.cards.includes("Reactive Shield"))p.shield=55;if(p.relics.includes("Aegis Plate"))p.shield=Math.max(p.shield,80)}
if(d.emp&&p.empCd<=0&&p.energy>=30){p.empCd=7;p.energy-=30;let rad=270*(p.empRadius||1);r.enemies.forEach(e=>{if(dist(e,p)<rad)e.hp-=p.damage*.8});if(r.boss&&dist(r.boss,p)<rad)r.boss.hp-=p.damage*.5;r.effects.push({type:"emp",x:p.x,y:p.y,t:.45})}
if(d.missile&&p.missileCd<=0&&p.energy>=20){p.missileCd=4;p.energy-=20;projectile(r,p,{x:+d.tx||p.x+1,y:+d.ty||p.y},"missile")}
if(d.ability)ability(r,p,{x:+d.tx||p.x+1,y:+d.ty||p.y})
if(d.fire&&p.shot<=0){p.shot=p.fireRate;p.stats.shots++;p.shots++;projectile(r,p,{x:+d.tx||p.x+1,y:+d.ty||p.y})}});
s.on("buy",(d,cb)=>{let r=rooms.get(d.code),p=r?.players[s.id];if(!p)return;let base={card:130,relic:240,heal:90,upgrade:190,treasure:260,ability:0}[d.kind];if(d.kind==="ability"){let a=abilities.find(x=>x[0]===d.id);if(!a||p.abilities.includes(a[0]))return cb?.({ok:false});base=a[4]}if(d.kind==="equipAbility"){if(!p.abilities.includes(d.id))return cb?.({ok:false});p.equippedAbility=d.id;let a=abilities.find(x=>x[0]===d.id);p.abilityName=a?.[1]||d.id;return cb?.({ok:true})}let cost=Math.ceil(base*(p.shopDiscount||1));if(p.gold<cost)return cb?.({ok:false});p.gold-=cost;if(d.kind==="card")giveCard(p);if(d.kind==="relic")giveRelic(p);if(d.kind==="heal")p.hp=p.maxHp;if(d.kind==="upgrade"){p.damage+=12;p.armor+=5}if(d.kind==="treasure"){giveCard(p);giveRelic(p)}if(d.kind==="ability")p.abilities.push(d.id);cb?.({ok:true})});
s.on("nextFloor",code=>{let r=rooms.get(code);if(!r||r.host!==s.id||!r.completed)return;if(r.floor>=FLOORS){if(r.mode==="ENDLESS"){r.floor++;}else return}else r.floor++;reset(r);spawn(r)});
s.on("disconnect",()=>{for(let [c,r] of rooms){let p=r.players[s.id];if(!p)continue;p.online=false;if(r.host===s.id)r.host=Object.keys(r.players).find(id=>r.players[id].online)||s.id;setTimeout(()=>{let q=r.players[s.id];if(q&&!q.online)delete r.players[s.id];if(!Object.keys(r.players).length)rooms.delete(c)},RECONNECT_MS)}})
});
setInterval(()=>{for(let r of rooms.values())tick(r,.033)},33);
setInterval(()=>{for(let r of rooms.values())io.to(r.code).emit("state",pub(r))},80);
server.listen(PORT,()=>console.log("REALMFALL 6.0 COMPLETE on "+PORT));
