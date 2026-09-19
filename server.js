
const express=require("express");
const http=require("http");
const path=require("path");
const {Server}=require("socket.io");

const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const PORT=process.env.PORT||3000, rooms=new Map();

const rarities={
 common:{price:45},rare:{price:75},epic:{price:120},
 mythic:{price:180},legendary:{price:280},secret:{price:500}
};

const baseCards=[
["Arc Spark","common","+8% attack damage","damage",8],["Iron Heart","common","+20 max HP","maxHp",20],
["Swift Step","common","+8% speed","speed",8],["Mana Thread","common","+10% ability damage","ability",10],
["Lucky Coin","common","+10% gold","gold",10],["Keen Edge","common","+5% crit","crit",5],
["Stone Skin","common","5% damage reduction","armor",5],["Focus","common","5% cooldown reduction","cooldown",5],
["Ember Mark","common","Attacks can burn","burn",1],["Second Wind","common","+10% speed at low HP","lowHp",10],
["Royal Sigil","rare","+15% damage","damage",15],["Storm Coil","rare","Abilities can chain","chain",25],
["Phoenix Thread","rare","One floor revive","revive",1],["Aegis Core","rare","Gain a shield after shops","shield",1],
["Vampiric Charm","rare","Heal from damage","lifesteal",2],["Haste Rune","rare","+15% attack speed","attackSpeed",15],
["Chrono Lens","epic","One cooldown reset per floor","resetCd",1],["Void Mantle","epic","15% less damage below half HP","lowHpArmor",15],
["Dragon Pulse","epic","Every 4th ability is empowered","abilityRhythm",100],["Titan Grip","epic","+30% boss damage","bossDamage",30],
["Worldbreaker Rune","mythic","Every 5th attack creates a shockwave","shock",1],
["Starfall Core","mythic","Abilities create a delayed strike","starfall",1],
["Immortal Aegis","mythic","Survive the first lethal hit each floor","revive",1],
["Tempest Heart","mythic","Speed boosts damage","speedAbility",30],
["Crown of Ages","legendary","+2% damage per completed floor","floorScaling",2],
["Heart of the Spire","legendary","+100 max HP and +15 armor","tank",1],
["Eclipse Engine","legendary","Every third ability echoes","doubleCast",35],
["Astral Blade","legendary","Critical hits deal bonus damage","critDamage",80],
["???","secret","Copy the first card found each floor","copyCard",1],
["Black Star","secret","Elite defeats permanently increase run damage","eliteStack",2],
["Null Heart","secret","Ignore one damage event each floor","nullHit",1],
["Endless Archive","secret","Every shop has a hidden offer","hiddenCard",1]
];

const relics=[
["Copper Lantern","common","+10% vision","vision",10],["Traveler Bell","common","+8 starting gold","startGold",8],
["Small Buckler","common","3% damage reduction","armor",3],["Swift Feather","common","+5% speed","speed",5],
["Mana Bead","common","+8 energy","energy",8],["Worn Crown","common","+10 max HP","maxHp",10],
["Royal Coin","rare","+15% gold","gold",15],["Aegis Shard","rare","Shield after a clear","shield",1],
["Blood Pearl","rare","1% lifesteal","lifesteal",1],["Storm Pearl","rare","Crits make a shock","critBurst",1],
["Arcane Quill","rare","+12% ability damage","ability",12],["Mirror Feather","rare","Dash grants brief invulnerability","dashInvuln",1],
["Chronicle Stone","epic","One free shop reroll","freeReroll",1],["Titan Sigil","epic","+20% boss damage","bossDamage",20],
["Void Shell","epic","12% less damage below half HP","lowHpArmor",12],["Phoenix Ash","epic","One floor revive","revive",1],
["Dragon Scale","epic","+35 max HP","maxHp",35],["Soul Flask","epic","+2 energy on enemy defeat","energyKill",2],
["World Seed","mythic","Random blessing each floor","randomBuff",1],["Frozen Crown","mythic","Periodically slow bosses","bossSlow",2],
["Reality Gem","mythic","Amplifies strongest card","bestCard",30],["Abyss Eye","mythic","+30% damage to low-HP enemies","execute",30],
["Eternal Coin","legendary","+50% gold","gold",50],["Heart of Titans","legendary","+120 max HP","maxHp",120],
["Spire Key","legendary","Unlocks a special boss reward","bossReward",1],["Black Sun","secret","Huge damage boost at very low HP","lastSpark",80],
["Hidden Crown","secret","Adds a hidden shop card","hiddenCard",1],["First Flame","secret","First attack each floor is empowered","floorDamage",40],
["Null Prism","secret","Ignore one hit each floor","nullHit",1],["Endless Coin","secret","Duplicate part of rewards","duplicateReward",20]
];

// 100 additional cards: 20 of each tier.
const themes=["Ash","Azure","Verdant","Solar","Lunar","Void","Storm","Frost","Royal","Astral"];
const effects=[
["Power","damage",4],["Ward","armor",3],["Stride","speed",4],["Focus","cooldown",3],["Fortune","gold",6],
["Vigor","maxHp",10],["Surge","ability",5],["Precision","crit",2],["Dash","dash",5],["Might","bossDamage",5],
["Reserve","energy",6],["Recovery","regen",1],["Hunt","farDamage",5],["Brawl","closeDamage",5],["Tempo","attackSpeed",4],
["Guard","bossArmor",4],["Spark","energyKill",1],["Resolve","lowHpArmor",4],["Fury","missingDamage",1],["Flow","energyRefund",2]
];
const tierList=["common","rare","epic","mythic","legendary","secret"];
const cards=[...baseCards];
for(let i=0;i<100;i++){
  const tier=tierList[Math.floor(i/20)];
  const e=effects[i%effects.length], theme=themes[i%themes.length];
  const mult={common:1,rare:2,epic:3,mythic:5,legendary:7,secret:10}[tier];
  cards.push([`${theme} ${e[0]} ${i+1}`,tier,`${tier} card: +${e[2]*mult} ${e[1]}`,e[1],e[2]*mult]);
}

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function makeOffer(){
  const tier=pick(tierList), pool=cards.filter(c=>c[1]===tier), c=pick(pool);
  return {name:c[0],rarity:c[1],description:c[2],effect:c[3],value:c[4],price:rarities[c[1]].price};
}
function makeRelic(){
  const tier=pick(tierList), pool=relics.filter(c=>c[1]===tier), r=pick(pool);
  return {name:r[0],rarity:r[1],description:r[2],effect:r[3],value:r[4]};
}
function id(){return Math.random().toString(36).slice(2,10)}
function lobbyCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
const bosses=[
 {name:"The Dread Lord",subtitle:"Sovereign of the Fallen Spire",hp:1600,color:"#a855f7"},
 {name:"Ashen King",subtitle:"Crown of the Cinder Throne",hp:1900,color:"#f97316"},
 {name:"Frost Revenant",subtitle:"Warden of the Silent Crown",hp:2200,color:"#38bdf8"},
 {name:"Void Titan",subtitle:"Colossus Beyond the Rift",hp:2700,color:"#8b5cf6"},
 {name:"Storm Seraph",subtitle:"Voice of the Tempest",hp:3100,color:"#facc15"},
 {name:"Spire Heart",subtitle:"Guardian of Ascension",hp:3800,color:"#ec4899"}
];
const floorPattern=["combat","elite","event","combat","shop","combat","elite","shop","boss"];

function player(s,n){return {id:s,name:(n||"Hero").slice(0,16),x:450,y:650,hp:140,maxHp:140,level:1,xp:0,xpNeed:100,gold:100,energy:100,maxEnergy:100,damage:24,armor:0,speed:240,attackCd:0,abilityCd:0,dashCd:0,invuln:0,alive:true,cards:[],relics:[],crit:0,cooldown:0,regen:0,input:{},kills:0}}
function pub(p){return {id:p.id,name:p.name,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,level:p.level,xp:p.xp,xpNeed:p.xpNeed,gold:p.gold,energy:p.energy,maxEnergy:p.maxEnergy,alive:p.alive}}
function enemy(room,type){
  const data={shade:[60,1,"#8b5cf6"],stalker:[55,1.25,"#22d3ee"],brute:[150,.7,"#ef4444"],archer:[65,1,"#f59e0b"],wraith:[90,1.15,"#38bdf8"]}[type];
  const hp=data[0]*(1+room.floor*.12);
  return {id:id(),type,x:180+Math.random()*2170,y:180+Math.random()*1180,radius:type==="brute"?34:24,hp,maxHp:hp,speed:75*data[1],color:data[2],hit:0}
}
function newFloor(r){
  r.type=floorPattern[(r.floor-1)%floorPattern.length];r.enemies=[];r.projectiles=[];r.effects=[];r.boss=null;r.offers=[];
  if(r.type==="shop"){r.offers=[makeOffer(),makeOffer(),makeOffer(),makeOffer()];return}
  if(r.type==="boss"){const b=bosses[Math.min(bosses.length-1,Math.floor((r.floor-1)/9))];r.boss={...b,maxHp:b.hp*(1+r.floor*.12),hp:b.hp*(1+r.floor*.12),x:1300,y:750,phase:1,cd:1.5,charge:4};return}
  const n=(r.type==="elite"?6:8)+Math.floor(r.floor/2),pool=r.type==="elite"?["brute","wraith","stalker"]:["shade","stalker","archer","brute"];
  for(let i=0;i<n;i++)r.enemies.push(enemy(r,pick(pool)))
}
function room(code,host){const r={code,host,started:false,floor:1,type:"combat",players:new Map(),enemies:[],projectiles:[],effects:[],boss:null,offers:[],last:Date.now()};newFloor(r);return r}
function state(r){return {code:r.code,hostId:r.host,started:r.started,floor:r.floor,floorType:r.type,players:[...r.players.values()].map(pub),enemies:r.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,radius:e.radius,hp:e.hp,maxHp:e.maxHp,color:e.color})),boss:r.boss&&{name:r.boss.name,subtitle:r.boss.subtitle,x:r.boss.x,y:r.boss.y,hp:r.boss.hp,maxHp:r.boss.maxHp,phase:r.boss.phase,color:r.boss.color},projectiles:r.projectiles.map(p=>({x:p.x,y:p.y})),effects:r.effects,shopOffers:r.offers}}
function broadcast(r){io.to(r.code).emit("state",state(r))}
function hurt(p,n){if(!p.alive||p.invuln>0)return;p.hp-=Math.max(1,n*(1-p.armor/100));if(p.hp<=0){p.hp=0;p.alive=false}}
function kill(r,p,e){r.enemies=r.enemies.filter(x=>x.id!==e.id);p.kills++;p.xp+=25;p.gold+=8+Math.floor(Math.random()*8);if(p.xp>=p.xpNeed){p.xp-=p.xpNeed;p.xpNeed=Math.floor(p.xpNeed*1.25);p.level++;p.maxHp+=10;p.hp=p.maxHp;p.damage+=3}}
function attack(r,p){
  if(!p.alive||p.attackCd>0||r.type==="shop")return;p.attackCd=.3;
  let t=null,bd=270*270;for(const e of r.enemies){let d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;t=e}}
  if(!t)return;let dmg=p.damage*(.9+Math.random()*.25);if(Math.random()*100<p.crit)dmg*=1.7;t.hp-=dmg;r.effects.push({type:"hit",x:t.x,y:t.y,amount:Math.round(dmg),life:.8});if(t.hp<=0)kill(r,p,t)
}
function ability(r,p){
  if(!p.alive||p.abilityCd>0||p.energy<25||r.type==="shop")return;p.energy-=25;p.abilityCd=Math.max(.7,3*(1-p.cooldown/100));
  const ax=p.input.aimX||1,ay=p.input.aimY||0;r.projectiles.push({x:p.x,y:p.y,vx:ax*620,vy:ay*620,owner:p.id,damage:p.damage*2.2,life:1.5})
}
function update(r,dt){
  if(!r.started||r.type==="shop")return;
  for(const p of r.players.values()){
    if(!p.alive)continue;const i=p.input||{};let dx=(i.right?1:0)-(i.left?1:0),dy=(i.down?1:0)-(i.up?1:0),l=Math.hypot(dx,dy)||1;
    p.x=clamp(p.x+dx/l*p.speed*dt,100,2500);p.y=clamp(p.y+dy/l*p.speed*dt,140,1360);
    p.attackCd=Math.max(0,p.attackCd-dt);p.abilityCd=Math.max(0,p.abilityCd-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.invuln=Math.max(0,p.invuln-dt);
    p.energy=Math.min(p.maxEnergy,p.energy+10*dt);p.hp=Math.min(p.maxHp,p.hp+p.regen*dt/5);
    if(i.dash&&p.dashCd<=0){p.x=clamp(p.x+dx/l*150,100,2500);p.y=clamp(p.y+dy/l*150,140,1360);p.dashCd=.9;p.invuln=.2;i.dash=false}
    if(i.attack)attack(r,p);if(i.ability){ability(r,p);i.ability=false}
  }
  for(const e of r.enemies){
    e.hit-=dt;const ps=[...r.players.values()].filter(p=>p.alive);if(!ps.length)continue;
    const t=ps.reduce((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(b.x-e.x,b.y-e.y)?a:b),dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d>45){e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt}else if(e.hit<=0){e.hit=1.1;hurt(t,e.type==="brute"?18:9)}
  }
  for(const q of r.projectiles){
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
    for(const e of r.enemies)if(Math.hypot(q.x-e.x,q.y-e.y)<e.radius+12){e.hp-=q.damage;q.life=0;r.effects.push({type:"hit",x:e.x,y:e.y,amount:Math.round(q.damage),life:.8});if(e.hp<=0){const p=r.players.get(q.owner);if(p)kill(r,p,e)}break}
    if(r.boss&&Math.hypot(q.x-r.boss.x,q.y-r.boss.y)<110){r.boss.hp-=q.damage;q.life=0;r.effects.push({type:"bossHit",x:r.boss.x,y:r.boss.y,amount:Math.round(q.damage),life:.8})}
  }
  r.projectiles=r.projectiles.filter(q=>q.life>0);r.effects=r.effects.filter(e=>e.life>0).map(e=>({...e,life:e.life-dt}));
  if(r.boss){
    const b=r.boss;b.cd-=dt;b.charge-=dt;if(b.hp<b.maxHp*.5)b.phase=2;
    const ps=[...r.players.values()].filter(p=>p.alive);
    if(ps.length&&b.cd<=0){b.cd=b.phase===2?1.1:1.8;for(const p of ps)if(Math.hypot(p.x-b.x,p.y-b.y)<350)hurt(p,b.phase===2?25:17);r.effects.push({type:"shock",x:b.x,y:b.y,life:1})}
    if(ps.length&&b.charge<=0){b.charge=4;const p=pick(ps),dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;b.x=clamp(b.x+dx/d*220,120,2480);b.y=clamp(b.y+dy/d*220,160,1340)}
    if(b.hp<=0)finish(r)
  }else if(r.enemies.length===0)finish(r)
}
function finish(r){
  for(const p of r.players.values())if(p.alive){p.gold+=25;p.hp=Math.min(p.maxHp,p.hp+15);p.xp+=30}
  setTimeout(()=>{if(!rooms.has(r.code))return;r.floor++;for(const p of r.players.values()){p.alive=true;p.hp=Math.max(p.hp,p.maxHp*.25);p.x=450;p.y=650}newFloor(r);broadcast(r)},1600)
}
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){const dt=Math.min(.05,(now-r.last)/1000);r.last=now;update(r,dt);if(r.started)broadcast(r)}},50);

io.on("connection",s=>{
  s.on("createLobby",({name}={})=>{let c;do{c=lobbyCode()}while(rooms.has(c));const r=room(c,s.id);r.players.set(s.id,player(s.id,name));rooms.set(c,r);s.join(c);s.emit("lobbyCreated",{code:c,playerId:s.id});broadcast(r)});
  s.on("joinLobby",({code,name}={})=>{const r=rooms.get(String(code||"").toUpperCase());if(!r)return s.emit("errorMessage","Lobby not found.");if(r.started)return s.emit("errorMessage","The run already started.");if(r.players.size>=4)return s.emit("errorMessage","Lobby is full.");r.players.set(s.id,player(s.id,name));s.join(r.code);s.emit("lobbyJoined",{code:r.code,playerId:s.id});broadcast(r)});
  s.on("startGame",()=>{for(const r of rooms.values())if(r.players.has(s.id)){if(r.host!==s.id)return s.emit("errorMessage","Only the host can start.");r.started=true;io.to(r.code).emit("gameStarted");broadcast(r)}});
  s.on("input",i=>{for(const r of rooms.values())if(r.players.has(s.id)){r.players.get(s.id).input={...r.players.get(s.id).input,...i};break}});
  s.on("buyCard",i=>{for(const r of rooms.values())if(r.players.has(s.id)&&r.type==="shop"){const p=r.players.get(s.id),c=r.offers[Number(i)];if(!c)return;if(p.gold<c.price)return s.emit("errorMessage","Not enough gold.");p.gold-=c.price;p.cards.push(c);r.offers[Number(i)]=null;broadcast(r)}});
  s.on("nextFloor",()=>{for(const r of rooms.values())if(r.players.has(s.id)&&r.type==="shop"&&r.host===s.id){r.floor++;newFloor(r);broadcast(r)}});
  s.on("disconnect",()=>{for(const [c,r] of rooms){if(r.players.delete(s.id)){if(r.host===s.id){const n=r.players.keys().next().value;if(n)r.host=n;else{rooms.delete(c);continue}}broadcast(r)}}});
});
server.listen(PORT,()=>console.log(`REALMFALL on http://localhost:${PORT}`));
