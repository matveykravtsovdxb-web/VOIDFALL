const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
const rooms = new Map();

const rarities = {
  common: { price: 45 },
  rare: { price: 75 },
  epic: { price: 120 },
  mythic: { price: 180 },
  legendary: { price: 280 },
  secret: { price: 500 }
};

const baseCards = [
  ["Arc Spark", "common", "+8% attack damage", "damage", 8],
  ["Iron Heart", "common", "+20 max HP", "maxHp", 20],
  ["Swift Step", "common", "+8% speed", "speed", 8],
  ["Mana Thread", "common", "+10% ability damage", "ability", 10],
  ["Lucky Coin", "common", "+10% gold", "gold", 10],
  ["Keen Edge", "common", "+5% crit", "crit", 5],
  ["Stone Skin", "common", "5% damage reduction", "armor", 5],
  ["Focus", "common", "5% cooldown reduction", "cooldown", 5],
  ["Ember Mark", "common", "Attacks can burn", "burn", 1],
  ["Second Wind", "common", "+10% speed at low HP", "lowHp", 10],

  ["Royal Sigil", "rare", "+15% damage", "damage", 15],
  ["Storm Coil", "rare", "Abilities can chain", "chain", 25],
  ["Phoenix Thread", "rare", "One floor revive", "revive", 1],
  ["Aegis Core", "rare", "Gain a shield after shops", "shield", 1],
  ["Vampiric Charm", "rare", "Heal from damage", "lifesteal", 2],
  ["Haste Rune", "rare", "+15% attack speed", "attackSpeed", 15],

  ["Chrono Lens", "epic", "One cooldown reset per floor", "resetCd", 1],
  ["Void Mantle", "epic", "15% less damage below half HP", "lowHpArmor", 15],
  ["Dragon Pulse", "epic", "Every 4th ability is empowered", "abilityRhythm", 100],
  ["Titan Grip", "epic", "+30% boss damage", "bossDamage", 30],

  ["Worldbreaker Rune", "mythic", "Every 5th attack creates a shockwave", "shock", 1],
  ["Starfall Core", "mythic", "Abilities create a delayed strike", "starfall", 1],
  ["Immortal Aegis", "mythic", "Survive the first lethal hit each floor", "revive", 1],
  ["Tempest Heart", "mythic", "Speed boosts damage", "speedAbility", 30],

  ["Crown of Ages", "legendary", "+2% damage per completed floor", "floorScaling", 2],
  ["Heart of the Spire", "legendary", "+100 max HP and +15 armor", "tank", 1],
  ["Eclipse Engine", "legendary", "Every third ability echoes", "doubleCast", 35],
  ["Astral Blade", "legendary", "Critical hits deal bonus damage", "critDamage", 80],

  ["???", "secret", "Copy the first card found each floor", "copyCard", 1],
  ["Black Star", "secret", "Elite defeats permanently increase run damage", "eliteStack", 2],
  ["Null Heart", "secret", "Ignore one damage event each floor", "nullHit", 1],
  ["Endless Archive", "secret", "Every shop has a hidden offer", "hiddenCard", 1]
];

const relics = [
  ["Copper Lantern", "common", "+10% vision", "vision", 10],
  ["Traveler Bell", "common", "+8 starting gold", "startGold", 8],
  ["Small Buckler", "common", "3% damage reduction", "armor", 3],
  ["Swift Feather", "common", "+5% speed", "speed", 5],
  ["Mana Bead", "common", "+8 energy", "energy", 8],
  ["Worn Crown", "common", "+10 max HP", "maxHp", 10],

  ["Royal Coin", "rare", "+15% gold", "gold", 15],
  ["Aegis Shard", "rare", "Shield after a clear", "shield", 1],
  ["Blood Pearl", "rare", "1% lifesteal", "lifesteal", 1],
  ["Storm Pearl", "rare", "Crits make a shock", "critBurst", 1],
  ["Arcane Quill", "rare", "+12% ability damage", "ability", 12],
  ["Mirror Feather", "rare", "Dash grants brief invulnerability", "dashInvuln", 1],

  ["Chronicle Stone", "epic", "One free shop reroll", "freeReroll", 1],
  ["Titan Sigil", "epic", "+20% boss damage", "bossDamage", 20],
  ["Void Shell", "epic", "12% less damage below half HP", "lowHpArmor", 12],
  ["Phoenix Ash", "epic", "One floor revive", "revive", 1],
  ["Dragon Scale", "epic", "+35 max HP", "maxHp", 35],
  ["Soul Flask", "epic", "+2 energy on enemy defeat", "energyKill", 2],

  ["World Seed", "mythic", "Random blessing each floor", "randomBuff", 1],
  ["Frozen Crown", "mythic", "Periodically slow bosses", "bossSlow", 2],
  ["Reality Gem", "mythic", "Amplifies strongest card", "bestCard", 30],
  ["Abyss Eye", "mythic", "+30% damage to low-HP enemies", "execute", 30],

  ["Eternal Coin", "legendary", "+50% gold", "gold", 50],
  ["Heart of Titans", "legendary", "+120 max HP", "maxHp", 120],
  ["Spire Key", "legendary", "Unlocks a special boss reward", "bossReward", 1],

  ["Black Sun", "secret", "Huge damage boost at very low HP", "lastSpark", 80],
  ["Hidden Crown", "secret", "Adds a hidden shop card", "hiddenCard", 1],
  ["First Flame", "secret", "First attack each floor is empowered", "floorDamage", 40],
  ["Null Prism", "secret", "Ignore one hit each floor", "nullHit", 1],
  ["Endless Coin", "secret", "Duplicate part of rewards", "duplicateReward", 20]
];

const themes = [
  "Ash",
  "Azure",
  "Verdant",
  "Solar",
  "Lunar",
  "Void",
  "Storm",
  "Frost",
  "Royal",
  "Astral"
];

const effects = [
  ["Power", "damage", 4],
  ["Ward", "armor", 3],
  ["Stride", "speed", 4],
  ["Focus", "cooldown", 3],
  ["Fortune", "gold", 6],
  ["Vigor", "maxHp", 10],
  ["Surge", "ability", 5],
  ["Precision", "crit", 2],
  ["Dash", "dash", 5],
  ["Might", "bossDamage", 5],
  ["Reserve", "energy", 6],
  ["Recovery", "regen", 1],
  ["Hunt", "farDamage", 5],
  ["Brawl", "closeDamage", 5],
  ["Tempo", "attackSpeed", 4],
  ["Guard", "bossArmor", 4],
  ["Spark", "energyKill", 1],
  ["Resolve", "lowHpArmor", 4],
  ["Fury", "missingDamage", 1],
  ["Flow", "energyRefund", 2]
];

const tierList = [
  "common",
  "rare",
  "epic",
  "mythic",
  "legendary",
  "secret"
];

const cards = [...baseCards];

for (let i = 0; i < 100; i++) {
  const tier = tierList[Math.floor(i / 20)];
  const effect = effects[i % effects.length];
  const theme = themes[i % themes.length];

  const multiplier = {
    common: 1,
    rare: 2,
    epic: 3,
    mythic: 5,
    legendary: 7,
    secret: 10
  }[tier];

  cards.push([
    `${theme} ${effect[0]} ${i + 1}`,
    tier,
    `${tier} card: +${effect[2] * multiplier} ${effect[1]}`,
    effect[1],
    effect[2] * multiplier
  ]);
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeOffer() {
  const tier = pick(tierList);
  const pool = cards.filter(card => card[1] === tier);
  const card = pick(pool);

  return {
    name: card[0],
    rarity: card[1],
    description: card[2],
    effect: card[3],
    value: card[4],
    price: rarities[card[1]].price
  };
}

function makeRelic() {
  const tier = pick(tierList);
  const pool = relics.filter(relic => relic[1] === tier);
  const relic = pick(pool);

  return {
    name: relic[0],
    rarity: relic[1],
    description: relic[2],
    effect: relic[3],
    value: relic[4]
  };
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function lobbyCode() {
  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
}

const bosses = [
  {
    name: "The Dread Lord",
    subtitle: "Sovereign of the Fallen Spire",
    hp: 1600,
    color: "#a855f7"
  },
  {
    name: "Ashen King",
    subtitle: "Crown of the Cinder Throne",
    hp: 1900,
    color: "#f97316"
  },
  {
    name: "Frost Revenant",
    subtitle: "Warden of the Silent Crown",
    hp: 2200,
    color: "#38bdf8"
  },
  {
    name: "Void Titan",
    subtitle: "Colossus Beyond the Rift",
    hp: 2700,
    color: "#8b5cf6"
  },
  {
    name: "Storm Seraph",
    subtitle: "Voice of the Tempest",
    hp: 3100,
    color: "#facc15"
  },
  {
    name: "Spire Heart",
    subtitle: "Guardian of Ascension",
    hp: 3800,
    color: "#ec4899"
  }
];

const floorPattern = [
  "combat",
  "elite",
  "event",
  "combat",
  "shop",
  "combat",
  "elite",
  "shop",
  "boss"
];

function createPlayer(socket, name) {
  return {
    id: socket.id,
    name: (name || "Hero").slice(0, 16),

    x: 450,
    y: 650,

    hp: 140,
    maxHp: 140,

    level: 1,
    xp: 0,
    xpNeed: 100,

    gold: 100,

    energy: 100,
    maxEnergy: 100,

    damage: 24,
    armor: 0,
    speed: 240,

    attackCd: 0,
    abilityCd: 0,
    dashCd: 0,
    invuln: 0,

    alive: true,

    cards: [],
    relics: [],

    crit: 0,
    cooldown: 0,
    regen: 0,

    kills: 0,

    input: {}
  };
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,

    x: player.x,
    y: player.y,

    hp: player.hp,
    maxHp: player.maxHp,

    level: player.level,
    xp: player.xp,
    xpNeed: player.xpNeed,

    gold: player.gold,

    energy: player.energy,
    maxEnergy: player.maxEnergy,

    alive: player.alive,

    cards: player.cards,
    relics: player.relics
  };
}

function createEnemy(room, type) {
  const data = {
    shade: [60, 1, "#8b5cf6"],
    stalker: [55, 1.25, "#22d3ee"],
    brute: [150, 0.7, "#ef4444"],
    archer: [65, 1, "#f59e0b"],
    wraith: [90, 1.15, "#38bdf8"]
  }[type];

  const hp = data[0] * (1 + room.floor * 0.12);

  return {
    id: randomId(),
    type,

    x: 180 + Math.random() * 2170,
    y: 180 + Math.random() * 1180,

    radius: type === "brute" ? 34 : 24,

    hp,
    maxHp: hp,

    speed: 75 * data[1],
    color: data[2],

    hit: 0
  };
}

function newFloor(room) {
  room.type =
    floorPattern[(room.floor - 1) % floorPattern.length];

  room.enemies = [];
  room.projectiles = [];
  room.effects = [];
  room.boss = null;
  room.offers = [];

  if (room.type === "shop") {
    room.offers = [
      makeOffer(),
      makeOffer(),
      makeOffer(),
      makeOffer()
    ];

    return;
  }

  if (room.type === "boss") {
    const boss =
      bosses[
        Math.min(
          bosses.length - 1,
          Math.floor((room.floor - 1) / 9)
        )
      ];

    const hp =
      boss.hp * (1 + room.floor * 0.12);

    room.boss = {
      ...boss,

      maxHp: hp,
      hp,

      x: 1300,
      y: 750,

      phase: 1,

      cd: 1.5,
      charge: 4
    };

    return;
  }

  const count =
    (room.type === "elite" ? 6 : 8) +
    Math.floor(room.floor / 2);

  const pool =
    room.type === "elite"
      ? ["brute", "wraith", "stalker"]
      : ["shade", "stalker", "archer", "brute"];

  for (let i = 0; i < count; i++) {
    room.enemies.push(
      createEnemy(room, pick(pool))
    );
  }
}

function createRoom(code, host) {
  const room = {
    code,
    host,

    started: false,

    floor: 1,
    type: "combat",

    players: new Map(),

    enemies: [],
    projectiles: [],
    effects: [],

    boss: null,
    offers: [],

    last: Date.now(),

    transitioning: false
  };

  newFloor(room);

  return room;
}

function roomState(room) {
  return {
    code: room.code,

    hostId: room.host,

    started: room.started,

    floor: room.floor,
    floorType: room.type,

    players: [...room.players.values()].map(publicPlayer),

    enemies: room.enemies.map(enemy => ({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      color: enemy.color
    })),

    boss:
      room.boss &&
      {
        name: room.boss.name,
        subtitle: room.boss.subtitle,

        x: room.boss.x,
        y: room.boss.y,

        hp: room.boss.hp,
        maxHp: room.boss.maxHp,

        phase: room.boss.phase,

        color: room.boss.color
      },

    projectiles: room.projectiles.map(projectile => ({
      x: projectile.x,
      y: projectile.y
    })),

    effects: room.effects,

    shopOffers: room.offers
  };
}

function broadcast(room) {
  io.to(room.code).emit(
    "state",
    roomState(room)
  );
}

function hurt(player, amount) {
  if (!player.alive) return;

  if (player.invuln > 0) return;

  const reduced =
    amount *
    (1 - player.armor / 100);

  player.hp -= Math.max(1, reduced);

  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
  }
}

function applyCard(player, card) {
  if (!card) return;

  switch (card.effect) {
    case "damage":
      player.damage *= 1 + card.value / 100;
      break;

    case "maxHp":
      player.maxHp += card.value;
      player.hp += card.value;
      break;

    case "speed":
      player.speed *= 1 + card.value / 100;
      break;

    case "ability":
      break;

    case "gold":
      player.gold += Math.floor(player.gold * card.value / 100);
      break;

    case "crit":
      player.crit += card.value;
      break;

    case "armor":
      player.armor += card.value;
      break;

    case "cooldown":
      player.cooldown += card.value;
      break;

    case "attackSpeed":
      player.attackCd =
        Math.max(
          0.12,
          player.attackCd -
          card.value / 100
        );
      break;

    case "bossDamage":
      break;

    case "regen":
      player.regen += card.value;
      break;

    case "energy":
      player.maxEnergy += card.value;
      player.energy = player.maxEnergy;
      break;

    default:
      break;
  }
}

function kill(room, player, enemy) {
  room.enemies =
    room.enemies.filter(
      item => item.id !== enemy.id
    );

  player.kills++;

  player.xp += 25;

  player.gold +=
    8 + Math.floor(Math.random() * 8);

  for (const card of player.cards) {
    if (card.effect === "energyKill") {
      player.energy = Math.min(
        player.maxEnergy,
        player.energy + card.value
      );
    }
  }

  if (player.xp >= player.xpNeed) {
    player.xp -= player.xpNeed;

    player.xpNeed =
      Math.floor(
        player.xpNeed * 1.25
      );

    player.level++;

    player.maxHp += 10;
    player.hp = player.maxHp;

    player.damage += 3;
  }
}

function attack(room, player) {
  if (!player.alive) return;

  if (player.attackCd > 0) return;

  if (room.type === "shop") return;

  player.attackCd = 0.3;

  let target = null;
  let bestDistance = 270 * 270;

  for (const enemy of room.enemies) {
    const distance =
      (enemy.x - player.x) ** 2 +
      (enemy.y - player.y) ** 2;

    if (distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }

  if (!target) return;

  let damage =
    player.damage *
    (0.9 + Math.random() * 0.25);

  if (
    Math.random() * 100 <
    player.crit
  ) {
    damage *= 1.7;
  }

  target.hp -= damage;

  room.effects.push({
    type: "hit",
    x: target.x,
    y: target.y,
    amount: Math.round(damage),
    life: 0.8
  });

  if (target.hp <= 0) {
    kill(room, player, target);
  }
}

function ability(room, player) {
  if (!player.alive) return;

  if (player.abilityCd > 0) return;

  if (player.energy < 25) return;

  if (room.type === "shop") return;

  player.energy -= 25;

  player.abilityCd =
    Math.max(
      0.7,
      3 * (1 - player.cooldown / 100)
    );

  const aimX =
    player.input.aimX || 1;

  const aimY =
    player.input.aimY || 0;

  room.projectiles.push({
    x: player.x,
    y: player.y,

    vx: aimX * 620,
    vy: aimY * 620,

    owner: player.id,

    damage:
      player.damage * 2.2,

    life: 1.5
  });
}

function finishFloor(room) {
  if (room.transitioning) return;

  room.transitioning = true;

  for (const player of room.players.values()) {
    if (!player.alive) continue;

    player.gold += 25;

    player.hp =
      Math.min(
        player.maxHp,
        player.hp + 15
      );

    player.xp += 30;
  }

  setTimeout(() => {
    if (!rooms.has(room.code)) return;

    room.floor++;

    for (const player of room.players.values()) {
      player.alive = true;

      player.hp =
        Math.max(
          player.hp,
          player.maxHp * 0.25
        );

      player.x = 450;
      player.y = 650;
    }

    room.transitioning = false;

    newFloor(room);

    broadcast(room);
  }, 1600);
}

function update(room, dt) {
  if (!room.started) return;

  if (room.type === "shop") return;

  if (room.transitioning) return;

  for (const player of room.players.values()) {
    if (!player.alive) continue;

    const input =
      player.input || {};

    let dx =
      (input.right ? 1 : 0) -
      (input.left ? 1 : 0);

    let dy =
      (input.down ? 1 : 0) -
      (input.up ? 1 : 0);

    const length =
      Math.hypot(dx, dy) || 1;

    player.x = clamp(
      player.x +
      dx / length *
      player.speed *
      dt,

      100,
      2500
    );

    player.y = clamp(
      player.y +
      dy / length *
      player.speed *
      dt,

      140,
      1360
    );

    player.attackCd =
      Math.max(
        0,
        player.attackCd - dt
      );

    player.abilityCd =
      Math.max(
        0,
        player.abilityCd - dt
      );

    player.dashCd =
      Math.max(
        0,
        player.dashCd - dt
      );

    player.invuln =
      Math.max(
        0,
        player.invuln - dt
      );

    player.energy =
      Math.min(
        player.maxEnergy,
        player.energy + 10 * dt
      );

    player.hp =
      Math.min(
        player.maxHp,
        player.hp +
        player.regen *
        dt /
        5
      );

    if (
      input.dash &&
      player.dashCd <= 0
    ) {
      player.x = clamp(
        player.x +
        dx / length * 150,

        100,
        2500
      );

      player.y = clamp(
        player.y +
        dy / length * 150,

        140,
        1360
      );

      player.dashCd = 0.9;
      player.invuln = 0.2;

      input.dash = false;
    }

    if (input.attack) {
      attack(room, player);
    }

    if (input.ability) {
      ability(room, player);

      input.ability = false;
    }
  }

  for (const enemy of room.enemies) {
    enemy.hit -= dt;

    const players =
      [...room.players.values()]
        .filter(player => player.alive);

    if (!players.length) continue;

    const target =
      players.reduce(
        (closest, player) =>
          Math.hypot(
            player.x - enemy.x,
            player.y - enemy.y
          ) <
          Math.hypot(
            closest.x - enemy.x,
            closest.y - enemy.y
          )
            ? player
            : closest
      );

    const dx =
      target.x - enemy.x;

    const dy =
      target.y - enemy.y;

    const distance =
      Math.hypot(dx, dy) || 1;

    if (distance > 45) {
      enemy.x +=
        dx / distance *
        enemy.speed *
        dt;

      enemy.y +=
        dy / distance *
        enemy.speed *
        dt;
    } else if (enemy.hit <= 0) {
      enemy.hit = 1.1;

      hurt(
        target,
        enemy.type === "brute"
          ? 18
          : 9
      );
    }
  }

  for (const projectile of room.projectiles) {
    projectile.x +=
      projectile.vx * dt;

    projectile.y +=
      projectile.vy * dt;

    projectile.life -= dt;

    for (const enemy of room.enemies) {
      if (
        Math.hypot(
          projectile.x - enemy.x,
          projectile.y - enemy.y
        ) <
        enemy.radius + 12
      ) {
        enemy.hp -= projectile.damage;

        projectile.life = 0;

        room.effects.push({
          type: "hit",
          x: enemy.x,
          y: enemy.y,
          amount:
            Math.round(
              projectile.damage
            ),
          life: 0.8
        });

        if (enemy.hp <= 0) {
          const player =
            room.players.get(
              projectile.owner
            );

          if (player) {
            kill(
              room,
              player,
              enemy
            );
          }
        }

        break;
      }
    }

    if (
      room.boss &&
      Math.hypot(
        projectile.x -
        room.boss.x,

        projectile.y -
        room.boss.y
      ) < 110
    ) {
      room.boss.hp -=
        projectile.damage;

      projectile.life = 0;

      room.effects.push({
        type: "bossHit",
        x: room.boss.x,
        y: room.boss.y,
        amount:
          Math.round(
            projectile.damage
          ),
        life: 0.8
      });
    }
  }

  room.projectiles =
    room.projectiles.filter(
      projectile =>
        projectile.life > 0
    );

  room.effects =
    room.effects
      .filter(effect => effect.life > 0)
      .map(effect => ({
        ...effect,
        life:
          effect.life - dt
      }));

  if (room.boss) {
    const boss = room.boss;

    boss.cd -= dt;
    boss.charge -= dt;

    if (
      boss.hp <
      boss.maxHp * 0.5
    ) {
      boss.phase = 2;
    }

    const players =
      [...room.players.values()]
        .filter(player => player.alive);

    if (
      players.length &&
      boss.cd <= 0
    ) {
      boss.cd =
        boss.phase === 2
          ? 1.1
          : 1.8;

      for (const player of players) {
        if (
          Math.hypot(
            player.x - boss.x,
            player.y - boss.y
          ) < 350
        ) {
          hurt(
            player,
            boss.phase === 2
              ? 25
              : 17
          );
        }
      }

      room.effects.push({
        type: "shock",
        x: boss.x,
        y: boss.y,
        life: 1
      });
    }

    if (
      players.length &&
      boss.charge <= 0
    ) {
      boss.charge = 4;

      const target =
        pick(players);

      const dx =
        target.x - boss.x;

      const dy =
        target.y - boss.y;

      const distance =
        Math.hypot(dx, dy) || 1;

      boss.x = clamp(
        boss.x +
        dx / distance * 220,

        120,
        2480
      );

      boss.y = clamp(
        boss.y +
        dy / distance * 220,

        160,
        1340
      );
    }

    if (boss.hp <= 0) {
      finishFloor(room);
    }
  } else if (
    room.enemies.length === 0
  ) {
    finishFloor(room);
  }
}

setInterval(() => {
  const now = Date.now();

  for (const room of rooms.values()) {
    const dt =
      Math.min(
        0.05,
        (now - room.last) / 1000
      );

    room.last = now;

    update(room, dt);

    if (room.started) {
      broadcast(room);
    }
  }
}, 50);

io.on("connection", socket => {
  socket.on(
    "createLobby",
    ({ name } = {}) => {
      let code;

      do {
        code = lobbyCode();
      } while (rooms.has(code));

      const room =
        createRoom(
          code,
          socket.id
        );

      room.players.set(
        socket.id,
        createPlayer(
          socket,
          name
        )
      );

      rooms.set(
        code,
        room
      );

      socket.join(code);

      socket.emit(
        "lobbyCreated",
        {
          code,
          playerId: socket.id
        }
      );

      broadcast(room);
    }
  );

  socket.on(
    "joinLobby",
    ({ code, name } = {}) => {
      const room =
        rooms.get(
          String(
            code || ""
          ).toUpperCase()
        );

      if (!room) {
        return socket.emit(
          "errorMessage",
          "Lobby not found."
        );
      }

      if (room.started) {
        return socket.emit(
          "errorMessage",
          "The run already started."
        );
      }

      if (room.players.size >= 4) {
        return socket.emit(
          "errorMessage",
          "Lobby is full."
        );
      }

      room.players.set(
        socket.id,
        createPlayer(
          socket,
          name
        )
      );

      socket.join(room.code);

      socket.emit(
        "lobbyJoined",
        {
          code: room.code,
          playerId: socket.id
        }
      );

      broadcast(room);
    }
  );

  socket.on(
    "startGame",
    () => {
      for (const room of rooms.values()) {
        if (
          room.players.has(
            socket.id
          )
        ) {
          if (
            room.host !==
            socket.id
          ) {
            return socket.emit(
              "errorMessage",
              "Only the host can start."
            );
          }

          room.started = true;

          io.to(room.code)
            .emit(
              "gameStarted"
            );

          broadcast(room);

          return;
        }
      }
    }
  );

  socket.on(
    "input",
    input => {
      for (const room of rooms.values()) {
        if (
          room.players.has(
            socket.id
          )
        ) {
          const player =
            room.players.get(
              socket.id
            );

          player.input = {
            ...player.input,
            ...input
          };

          break;
        }
      }
    }
  );

  socket.on(
    "buyCard",
    ({ index } = {}) => {
      for (const room of rooms.values()) {
        if (
          room.players.has(
            socket.id
          ) &&
          room.type === "shop"
        ) {
          const player =
            room.players.get(
              socket.id
            );

          const card =
            room.offers[
              Number(index)
            ];

          if (!card) return;

          if (
            player.gold <
            card.price
          ) {
            return socket.emit(
              "errorMessage",
              "Not enough gold."
            );
          }

          player.gold -=
            card.price;

          player.cards.push(card);

          applyCard(
            player,
            card
          );

          room.offers[
            Number(index)
          ] = null;

          broadcast(room);

          return;
        }
      }
    }
  );

  socket.on(
    "nextFloor",
    () => {
      for (const room of rooms.values()) {
        if (
          room.players.has(
            socket.id
          ) &&
          room.type === "shop" &&
          room.host === socket.id
        ) {
          room.floor++;

          newFloor(room);

          broadcast(room);

          return;
        }
      }
    }
  );

  socket.on(
    "disconnect",
    () => {
      for (const [
        code,
        room
      ] of rooms) {
        if (
          room.players.delete(
            socket.id
          )
        ) {
          if (
            room.host ===
            socket.id
          ) {
            const nextHost =
              room.players
                .keys()
                .next()
                .value;

            if (nextHost) {
              room.host =
                nextHost;
            } else {
              rooms.delete(code);
              continue;
            }
          }

          broadcast(room);
        }
      }
    }
  );
});

server.listen(
  PORT,
  () => {
    console.log(
      `REALMFALL running on http://localhost:${PORT}`
    );
  }
);
