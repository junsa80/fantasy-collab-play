/* 환상 콜라보 — 걸음의 균열
   직접 이동 없음. 출구·상자 탭 → 걸음·확률 → 주사위 → 전투 또는 도착.
   그록봇: 수치만 ALLIES / ENEMIES / ROOMS / RANK_COST. 전투 함수는 미리보기와 결과가 같아야 한다.
*/
(function (root) {
  "use strict";
  var KEY = "fcb-rift-v1";
  var RANK_COST = [16, 26, 40, 58];

  function skill(p) {
    return {
      id: p.id,
      name: p.name,
      kind: p.kind,
      pow: p.pow,
      cost: p.cost || 0,
      ult: !!p.ult,
      note: p.note,
      hits: p.hits || 1,
      dangerBoost: !!p.dangerBoost,
      voice: p.voice || "",
    };
  }
  function basic(pow, name, note) {
    return skill({ id: "strike", name: name, kind: "hit", pow: pow, note: note });
  }

  var ALLIES = {
    arin: unit("arin", "아린", "군주", 120, 18, "파티의 기준점.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "dawn", name: "새벽의 서약", kind: "buffAtk", pow: 1.35, ult: true, cost: 100, note: "아군 공격 ×1.35, 2라운드", voice: "새벽의 서약으로… 함께 나아가자!" }),
    ]),
    sera: unit("sera", "세라", "치유", 100, 12, "쓰러진 아군도 일으킨다.", [
      basic(0.85, "일격", "약한 단일 피해"),
      skill({ id: "sanctuary", name: "성역의 손길", kind: "heal", pow: 48, ult: true, cost: 100, note: "아군 +48. 쓰러져도 일으킴", voice: "성역이여, 상처를 감싸 주소서." }),
    ]),
    aria: unit("aria", "아리아", "사냥", 108, 22, "빈 체력을 더 세게.", [
      basic(1.05, "일격", "단일 피해"),
      skill({ id: "crush", name: "부위 분쇄", kind: "execute", pow: 1.7, ult: true, cost: 100, note: "강타. 절반 아래면 ×1.5", voice: "약점 확인… 분쇄!" }),
    ]),
    garen: unit("garen", "가렌", "수호", 156, 14, "맞고, 일부를 되돌린다.", [
      basic(0.9, "일격", "단일 피해"),
      skill({ id: "crown", name: "왕관 방패", kind: "buffDef", pow: 1.8, ult: true, cost: 100, note: "방어 ×1.8, 반사 30%", voice: "이 방패가 왕관을 지킨다!" }),
    ]),
    mariel: unit("mariel", "마리엘", "패", 96, 20, "필살은 판 전체.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "flash", name: "카드 플래시", kind: "aoe", pow: 0.8, ult: true, cost: 100, note: "적 전체", voice: "이 한 장으로 판을 뒤집는다!" }),
    ]),
    leo: unit("leo", "레오", "룬", 104, 20, "점령은 남아서 탄다.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "vulcan", name: "불칸 점령", kind: "hit", pow: 1.55, ult: true, cost: 100, note: "강타 + 화상 8", voice: "이 칸은 불칸이다—점령!" }),
    ]),
    luga: unit("luga", "루가", "연계", 110, 19, "세 번 문다.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "fang", name: "늑대이빨 연계", kind: "multi", pow: 0.55, hits: 3, ult: true, cost: 100, note: "3연타", voice: "이빨을 세 번." }),
    ]),
    serena: unit("serena", "세레나", "피날레", 98, 21, "아군이 위험하면 끝이 커진다.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "mood", name: "무드 피날레", kind: "hit", pow: 2.15, ult: true, cost: 100, dangerBoost: true, note: "최강 단타. 아군 빈사면 ×1.25", voice: "여기까지야." }),
    ]),
    mira: unit("mira", "미라", "파도", 112, 18, "치고, 다음 한 대를 되돌린다.", [
      basic(1, "일격", "단일 피해"),
      skill({ id: "tide", name: "파도 반격", kind: "riposte", pow: 1.35, ult: true, cost: 100, note: "타격 후 반사 40%", voice: "밀려왔다 돌아간다." }),
    ]),
  };

  var ENEMIES = {
    shade: unit("shade", "그림자 병사", "잡병", 68, 13, "", [basic(1, "일격", "가장 다친 아군")]),
    hound: unit("hound", "균열 사냥개", "야수", 56, 16, "", [basic(1, "물어뜯기", "가장 다친 아군")]),
    shadow_general: unit("shadow_general", "그림자 장군", "대장", 200, 18, "", [
      basic(1, "일격", "가장 다친 아군"),
      skill({ id: "edict", name: "그림자 명령", kind: "hit", pow: 1.65, ult: true, cost: 100, note: "깊게", voice: "그림자가… 명을 따른다." }),
    ], 55),
    celes: unit("celes", "셀레스", "마녀", 156, 20, "", [
      basic(1.05, "일격", "가장 다친 아군"),
      skill({ id: "omen", name: "마녀의 예고", kind: "execute", pow: 1.45, ult: true, cost: 100, note: "절반 아래 ×1.5", voice: "도망칠 곳은 없다." }),
    ], 60),
    ar: unit("ar", "아르", "옥좌", 240, 17, "", [
      basic(1, "일격", "가장 다친 아군"),
      skill({ id: "devour", name: "균열 포식", kind: "ravage", pow: 0.72, ult: true, cost: 100, note: "전체 + 자신 공격", voice: "왕좌는 이미 내 것이다." }),
    ], 70),
  };

  function unit(id, name, role, hp, atk, blurb, skills, ultStart) {
    return { id: id, name: name, role: role, hp: hp, atk: atk, blurb: blurb, skills: skills, ultStart: ultStart || 0 };
  }

  var TACTICS = [
    { id: "chain", name: "연계", text: "같은 라운드에 같은 대상을 다시 치면 피해 +25%." },
    { id: "guard", name: "수호", text: "회복할 때 최대 체력 12% 보호막." },
    { id: "focus", name: "집중", text: "적이 한 명만 남으면 단일 피해 +15%." },
    { id: "rally", name: "기합", text: "일반 기술 후 다른 아군 필살 +8." },
  ];

  var ROOMS = {
    gate: room("gate", "현관", "현관", 0, "여기서만 숨을 고르고 파티를 바꾼다.", [
      exit(1, "무기고", "armory", 4),
      exit(2, "연회", "banquet", 6),
      exit(3, "시종 방", "servants", 2),
    ], []),
    armory: room("armory", "무기고", "무기고", 0.04, "가렌이 방패를 내려놓지 않고 서 있다.", [
      exit(1, "현관", "gate", 4),
      exit(2, "감시탑", "watch", 5, "secret", "상자를 열면 쇠사슬이 풀린다"),
      exit(3, "시종 방", "servants", 3),
    ], [
      spot("chest-armory", "철 상자", "조각 20. 열면 탑으로 가는 쇠사슬이 풀린다", 3, "chest", "chest.armory", { shards: 20, secret: true }),
      spot("talk-garen", "가렌에게 간다", "합류. 파티 교체는 현관", 2, "recruit", "recruit.garen", { ally: "garen" }),
    ]),
    watch: room("watch", "감시탑", "탑", 0.08, "깃발 아래, 장군은 이미 이쪽을 보고 있다.", [
      exit(1, "무기고", "armory", 5),
      exit(2, "테라스", "terrace", 4),
      exit(3, "무너진 난간", null, 0, "", "지나갈 수 없다"),
    ], [
      spot("duel-general", "그림자 장군", "확정 조우. 주사위 없음", 0, "duel", "beat.general", { pack: ["shadow_general"], fixed: true }),
    ]),
    banquet: room("banquet", "연회 홀", "연회", 0.06, "뒤집힌 잔 사이에 카드 한 장이 빛난다.", [
      exit(1, "현관", "gate", 6),
      exit(2, "테라스", "terrace", 8),
      exit(3, "주방", "kitchen", 3),
    ], [
      spot("talk-mariel", "카드에게 간다", "마리엘 합류", 3, "recruit", "recruit.mariel", { ally: "mariel" }),
    ]),
    servants: room("servants", "시종 방", "시종", 0.02, "짧은 방. 급한 숨은 여기서 고른다.", [
      exit(1, "현관", "gate", 2),
      exit(2, "주방", "kitchen", 4),
      exit(3, "무기고", "armory", 3),
    ], [
      spot("chest-servants", "서랍", "조각 10", 2, "chest", "chest.servants", { shards: 10 }),
    ]),
    kitchen: room("kitchen", "주방", "주방", 0.03, "우물은 이 방의 위험만 감수하면 모두를 일으킨다.", [
      exit(1, "연회", "banquet", 3),
      exit(2, "시종 방", "servants", 4),
      exit(3, "저장고", "store", 4),
    ], [
      spot("well", "우물", "전원 회복, 쓰러진 아군도", 1, "heal", "well", {}),
    ]),
    store: room("store", "저장고", "창고", 0.05, "룬 상자 옆에 레오가 앉아 있다.", [
      exit(1, "주방", "kitchen", 4),
      exit(2, "테라스", "terrace", 7),
      exit(3, "무너진 벽", null, 0, "", "지나갈 수 없다"),
    ], [
      spot("chest-store", "룬 상자", "조각 24", 3, "chest", "chest.store", { shards: 24 }),
      spot("talk-leo", "레오에게 간다", "합류. 파티 교체는 현관", 2, "recruit", "recruit.leo", { ally: "leo" }),
    ]),
    terrace: room("terrace", "테라스", "테라스", 0.08, "밤바람 너머로 셀레스가 길을 막고 있다.", [
      exit(1, "연회", "banquet", 8),
      exit(2, "옥좌", "throne", 5),
      exit(3, "감시탑", "watch", 4),
    ], [
      spot("duel-celes", "셀레스", "확정 조우. 주사위 없음", 0, "duel", "beat.celes", { pack: ["celes"], fixed: true }),
    ]),
    throne: room("throne", "옥좌", "옥좌", 0, "아르가 앉아 있다. 이 문만큼은 주사위가 없다.", [
      exit(1, "테라스", "terrace", 5),
      exit(2, "닫힌 장막", null, 0, "", "지나갈 수 없다"),
      exit(3, "닫힌 장막", null, 0, "", "지나갈 수 없다"),
    ], [
      spot("boss-ar", "아르에게 간다", "결전. 확정", 0, "boss", "beat.ar", { pack: ["ar", "shade"], fixed: true }),
    ]),
  };

  function room(id, name, short, danger, line, exits, spots) {
    return { id: id, name: name, short: short, danger: danger, line: line, exits: exits, spots: spots };
  }
  function exit(n, label, to, steps, need, lock) {
    return { n: n, label: label, to: to, steps: steps, need: need || "", lock: lock || "" };
  }
  function spot(id, label, sub, steps, kind, flag, extra) {
    return {
      id: id, label: label, sub: sub, steps: steps, kind: kind, flag: flag,
      shards: extra.shards || 0, ally: extra.ally || "", pack: extra.pack || null,
      fixed: !!extra.fixed, secret: !!extra.secret,
    };
  }

  function tripPlan(steps, safeSteps, danger) {
    var safeUsed = Math.min(Math.max(0, safeSteps), Math.max(0, steps));
    var risky = Math.max(0, steps - safeUsed);
    var chance = Math.min(0.75, risky * 0.09 + Math.max(0, danger));
    return { safeUsed: safeUsed, risky: risky, chance: chance };
  }
  function encounterPack(roomId, risky) {
    var hard = risky >= 5;
    if (roomId === "terrace" || roomId === "watch" || roomId === "banquet") return hard ? ["shade", "hound"] : ["hound"];
    return hard ? ["shade", "shade"] : ["shade"];
  }
  function maxHp(def, rank) { return Math.round(def.hp * (1 + rank * 0.1)); }
  function atkOf(def, rank, veteran) { return Math.round(def.atk * (1 + rank * 0.08) * (1 + veteran * 0.03)); }

  function living(list) { return list.filter(function (u) { return u.alive; }); }
  function friends(s, a) { return a.team === "ally" ? s.allies : s.enemies; }
  function foes(s, a) { return a.team === "ally" ? s.enemies : s.allies; }
  function findF(s, iid) {
    var all = s.allies.concat(s.enemies);
    for (var i = 0; i < all.length; i++) if (all[i].iid === iid) return all[i];
    return null;
  }
  function targetKind(sk) {
    if (sk.kind === "heal") return "ally";
    if (sk.kind === "buffAtk" || sk.kind === "buffDef" || sk.kind === "aoe" || sk.kind === "ravage") return "none";
    return "enemy";
  }
  function hurt(s, target, amount, attacker, reflect) {
    var remain = Math.max(0, Math.round(amount));
    if (target.shield > 0 && remain > 0) {
      var absorbed = Math.min(target.shield, remain);
      target.shield -= absorbed;
      remain -= absorbed;
    }
    var before = target.hp;
    target.hp = Math.max(0, target.hp - remain);
    if (target.hp <= 0) { target.hp = 0; target.alive = false; target.shield = 0; }
    else target.ult = Math.min(100, target.ult + 16);
    if (attacker && attacker.team === "ally") s.damageDealt += Math.max(0, before - target.hp);
    if (reflect && target.reflect > 0 && attacker && attacker.iid !== target.iid && attacker.alive) {
      var back = Math.max(1, Math.round(amount * target.reflect));
      target.reflect = 0;
      hurt(s, attacker, back, null, false);
      s.log = target.name + "의 반사 " + back;
    }
  }
  function deal(s, actor, target, sk, pow) {
    var p = pow;
    if (sk.kind === "execute" && target.hp / target.maxHp < 0.5) p *= 1.5;
    if (sk.dangerBoost && living(friends(s, actor)).some(function (a) { return a.hp / a.maxHp < 0.4; })) p *= 1.25;
    var single = sk.kind !== "aoe" && sk.kind !== "ravage";
    if (s.tactic === "focus" && single && living(foes(s, actor)).length === 1) p *= 1.15;
    if (s.tactic === "chain" && single && (s.hits[target.iid] || 0) >= 1) p *= 1.25;
    var dmg = Math.max(1, Math.round((actor.atk * actor.atkMul * p) / Math.max(0.45, target.defMul)));
    hurt(s, target, dmg, actor, true);
    s.hits[target.iid] = (s.hits[target.iid] || 0) + 1;
    return dmg;
  }
  function pay(actor, sk) {
    if (sk.ult) actor.ult = 0;
    else actor.ult = Math.min(100, actor.ult + (actor.team === "ally" ? 34 : 28));
  }
  function rally(s, actor, sk) {
    if (sk.ult || s.tactic !== "rally" || actor.team !== "ally") return;
    living(s.allies).forEach(function (a) { if (a.iid !== actor.iid) a.ult = Math.min(100, a.ult + 8); });
  }
  function resolve(s, actor, sk, target) {
    pay(actor, sk);
    s.voice = sk.voice || "";
    if (sk.kind === "heal") {
      if (!target) return;
      target.alive = true;
      var before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + sk.pow);
      target.burn = 0;
      target.burnTurns = 0;
      if (s.tactic === "guard") target.shield = Math.min(Math.round(target.maxHp * 0.4), target.shield + Math.round(target.maxHp * 0.12));
      s.log = actor.name + " " + sk.name + " → " + target.name + " +" + (target.hp - before);
      return;
    }
    if (sk.kind === "buffAtk") {
      living(friends(s, actor)).forEach(function (a) { a.atkMul = sk.pow; a.atkTurns = 2; });
      s.log = actor.name + " " + sk.name + ". 아군 공격이 오른다";
      return;
    }
    if (sk.kind === "buffDef") {
      actor.defMul = sk.pow;
      actor.defTurns = 2;
      actor.reflect = 0.3;
      s.log = actor.name + " " + sk.name + ". 방어와 반사";
      return;
    }
    if (sk.kind === "aoe" || sk.kind === "ravage") {
      var names = [];
      living(foes(s, actor)).forEach(function (t) { names.push(t.name + " −" + deal(s, actor, t, sk, sk.pow)); });
      if (sk.kind === "ravage") { actor.atkMul = 1.3; actor.atkTurns = 2; }
      s.log = actor.name + " " + sk.name + " → " + (names.join(", ") || "대상 없음");
      rally(s, actor, sk);
      return;
    }
    if (!target || !target.alive) return;
    if (sk.kind === "multi") {
      var hits = sk.hits || 3;
      var total = 0;
      for (var i = 0; i < hits && target.alive; i++) total += deal(s, actor, target, sk, sk.pow);
      s.log = actor.name + " " + sk.name + " → " + target.name + " −" + total;
    } else if (sk.id === "vulcan") {
      var vd = deal(s, actor, target, sk, sk.pow);
      if (target.alive) { target.burn = 8; target.burnTurns = 2; }
      s.log = actor.name + " " + sk.name + " → " + target.name + " −" + vd + ", 화상";
    } else if (sk.kind === "riposte") {
      var rd = deal(s, actor, target, sk, sk.pow);
      actor.reflect = 0.4;
      s.log = actor.name + " " + sk.name + " → " + target.name + " −" + rd + ". 다음 피격을 되돌린다";
    } else {
      s.log = actor.name + " " + sk.name + " → " + target.name + " −" + deal(s, actor, target, sk, sk.pow);
    }
    rally(s, actor, sk);
  }
  function tickBurn(s, u) {
    if (!u.alive || u.burnTurns <= 0 || u.burn <= 0) return;
    var d = u.burn;
    hurt(s, u, d, null, false);
    u.burnTurns -= 1;
    if (u.burnTurns <= 0) u.burn = 0;
    s.log = u.name + " 화상 −" + d;
    s.voice = "";
  }
  function tickBuff(u) {
    if (u.atkTurns > 0) { u.atkTurns -= 1; if (u.atkTurns <= 0) u.atkMul = 1; }
    if (u.defTurns > 0) { u.defTurns -= 1; if (u.defTurns <= 0) u.defMul = 1; }
  }
  function wiped(s) {
    if (!living(s.enemies).length) { s.phase = "won"; s.queue = []; s.eQueue = []; return true; }
    if (!living(s.allies).length) { s.phase = "lost"; s.queue = []; s.eQueue = []; return true; }
    return false;
  }
  function beginRound(s) {
    s.round += 1;
    s.hits = {};
    s.queue = living(s.allies).map(function (a) { return a.iid; });
    s.eQueue = [];
    s.picks = {};
    living(s.enemies).forEach(function (e) {
      var ult = null;
      var basicSk = e.skills[0];
      e.skills.forEach(function (k) { if (k.ult) ult = k; else basicSk = k; });
      s.picks[e.iid] = ult && e.ult >= ult.cost ? ult.id : basicSk.id;
    });
    s.phase = s.queue.length ? "player" : "lost";
    s.voice = "";
  }
  function toEnemies(s) {
    s.phase = "enemy";
    s.eQueue = living(s.enemies).map(function (e) { return e.iid; });
    s.queue = [];
    s.voice = "";
    if (!s.eQueue.length) endRound(s);
  }
  function endRound(s) {
    s.allies.concat(s.enemies).forEach(tickBuff);
    if (wiped(s)) return;
    beginRound(s);
  }
  function fighter(def, team, iid, rank, veteran) {
    rank = rank || 0;
    veteran = veteran || 0;
    var max = team === "ally" ? maxHp(def, rank) : def.hp;
    var atk = team === "ally" ? atkOf(def, rank, veteran) : def.atk;
    return {
      iid: iid, id: def.id, name: def.name, team: team, role: def.role,
      hp: max, maxHp: max, atk: atk, ult: def.ultStart || 0, alive: true,
      atkMul: 1, defMul: 1, atkTurns: 0, defTurns: 0, shield: 0, reflect: 0,
      burn: 0, burnTurns: 0, skills: def.skills,
    };
  }
  function startBattle(allies, enemies, tactic) {
    var s = { allies: allies, enemies: enemies, round: 0, queue: [], eQueue: [], phase: "player", picks: {}, hits: {}, log: "적의 다음 행동이 보인다.", voice: "", tactic: tactic, damageDealt: 0 };
    beginRound(s);
    s.log = "적의 다음 행동이 보인다.";
    return s;
  }
  function lowest(list) {
    var pool = living(list);
    pool.sort(function (a, b) { return a.hp - b.hp; });
    return pool[0] || null;
  }
  function enemyTarget(s, actor, sk) {
    var kind = targetKind(sk);
    if (kind === "ally") return lowest(friends(s, actor));
    if (kind === "enemy") return lowest(foes(s, actor));
    return null;
  }
  function forecast(prev, actorIid, skillId, targetIid) {
    var s = structuredClone(prev);
    var actor = findF(s, actorIid);
    var sk = actor && actor.skills.filter(function (k) { return k.id === skillId; })[0];
    if (!actor || !sk || !actor.alive) return null;
    if (sk.ult && actor.ult < sk.cost) return null;
    var kind = targetKind(sk);
    var target = targetIid ? findF(s, targetIid) : enemyTarget(s, actor, sk);
    if (kind !== "none" && (!target || (kind === "enemy" && !target.alive))) return null;
    resolve(s, actor, sk, target);
    return s;
  }
  function playerAct(prev, skillId, targetIid) {
    var s = structuredClone(prev);
    if (s.phase !== "player") return prev;
    var actor = s.queue[0] ? findF(s, s.queue[0]) : null;
    if (!actor) return prev;
    tickBurn(s, actor);
    if (!actor.alive) {
      s.queue.shift();
      if (wiped(s)) return s;
      if (!s.queue.length) toEnemies(s);
      return s;
    }
    var sk = actor.skills.filter(function (k) { return k.id === skillId; })[0];
    if (!sk || (sk.ult && actor.ult < sk.cost)) return prev;
    var kind = targetKind(sk);
    var target = targetIid ? findF(s, targetIid) : null;
    if (kind === "enemy" && (!target || target.team !== "enemy" || !target.alive)) return prev;
    if (kind === "ally" && (!target || target.team !== "ally")) return prev;
    resolve(s, actor, sk, kind === "none" ? null : target);
    s.queue.shift();
    if (wiped(s)) return s;
    if (!s.queue.length) toEnemies(s);
    return s;
  }
  function stepEnemy(prev) {
    var s = structuredClone(prev);
    if (s.phase !== "enemy") return prev;
    var actor = s.eQueue[0] ? findF(s, s.eQueue[0]) : null;
    if (!actor || !actor.alive) {
      s.eQueue.shift();
      if (wiped(s)) return s;
      if (!s.eQueue.length) endRound(s);
      return s;
    }
    tickBurn(s, actor);
    if (!actor.alive) {
      s.eQueue.shift();
      if (wiped(s)) return s;
      if (!s.eQueue.length) endRound(s);
      return s;
    }
    var sk = actor.skills.filter(function (k) { return k.id === s.picks[actor.iid]; })[0] || actor.skills[0];
    resolve(s, actor, sk, enemyTarget(s, actor, sk));
    s.eQueue.shift();
    if (wiped(s)) return s;
    if (!s.eQueue.length) endRound(s);
    return s;
  }

  var api = {
    tripPlan: tripPlan, startBattle: startBattle, playerAct: playerAct, stepEnemy: stepEnemy,
    forecast: forecast, ALLIES: ALLIES, ENEMIES: ENEMIES, fighter: fighter,
  };
  root.Rift = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  var phase = "title";
  var meta = null;
  var pending = null;
  var battle = null;
  var aim = "";
  var slot = 0;
  var hasSave = false;

  function blank() {
    var hp = {};
    Object.keys(ALLIES).forEach(function (id) { hp[id] = ALLIES[id].hp; });
    return {
      v: 1, room: "gate", party: ["arin", "sera", "aria"], roster: ["arin", "sera", "aria"],
      hp: hp, ranks: {}, veteran: {}, shards: 0, safeSteps: 0, tactic: null,
      flags: [], visited: ["gate"], cleared: false, midFight: false,
    };
  }
  function save() {
    meta.midFight = phase === "battle";
    try {
      localStorage.setItem(KEY, JSON.stringify(meta));
      hasSave = true;
      meta.saveOk = true;
    } catch (e) {
      meta.saveOk = false;
    }
  }
  function healAll() {
    meta.party.concat(meta.roster).forEach(function (id) {
      meta.hp[id] = maxHp(ALLIES[id], meta.ranks[id] || 0);
    });
  }
  function curHp(id) {
    var max = maxHp(ALLIES[id], meta.ranks[id] || 0);
    return Math.min(max, meta.hp[id] == null ? max : meta.hp[id]);
  }
  function boot() {
    hasSave = !!localStorage.getItem(KEY);
    if (hasSave) {
      try { meta = JSON.parse(localStorage.getItem(KEY)); } catch (e) { meta = null; }
    }
    if (meta && meta.midFight) {
      meta.midFight = false;
      meta.safeSteps = 0;
      try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) { /* keep going */ }
    }
    phase = "title";
    render();
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(act, label, sub, primary, disabled) {
    var b = el("button", "btn" + (primary ? " primary" : ""));
    b.type = "button";
    b.dataset.act = act;
    b.textContent = label;
    if (sub) b.appendChild(el("small", "", sub));
    if (disabled) b.disabled = true;
    return b;
  }
  function bar(hp, max, ult) {
    var d = el("div", "bar" + (ult ? " ult" : ""));
    var i = document.createElement("i");
    i.style.width = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100)) + "%";
    d.appendChild(i);
    return d;
  }
  function hasFlag(f) { return meta.flags.indexOf(f) >= 0; }
  function addFlag(f) { if (f && meta.flags.indexOf(f) < 0) meta.flags.push(f); }

  function render() {
    var app = document.getElementById("app");
    app.textContent = "";
    if (phase === "title") return renderTitle(app);
    if (phase === "battle") return renderBattle(app);
    if (phase === "offer") return renderOffer(app);
    if (phase === "ending") return renderEnding(app);
    renderExplore(app);
  }
  function renderTitle(app) {
    app.appendChild(el("p", "gold", "걸음의 균열"));
    app.appendChild(el("h1", "", "환상 콜라보"));
    app.appendChild(el("p", "muted", "발은 네가 움직이지 않는다. 출구나 상자를 누르면, 그 거리만큼 걸었다고 치고 조우를 굴린다."));
    var box = el("div", "stack");
    box.style.marginTop = "18px";
    if (hasSave && meta) {
      var where = ROOMS[meta.room] ? ROOMS[meta.room].name : "현관";
      var who = meta.party.map(function (id) { return ALLIES[id].name + " 숙련 " + (meta.veteran[id] || 0); }).join(" · ");
      box.appendChild(btn("continue", "이어하기", where + " · 조각 " + meta.shards + " · " + who, true));
    }
    box.appendChild(btn("new", "새 게임", hasSave ? "지금 기록 위에 덮어쓴다" : "아린 · 세라 · 아리아", !hasSave));
    app.appendChild(box);
  }
  function renderExplore(app) {
    var room = ROOMS[meta.room];
    var top = el("div", "top");
    var left = el("div");
    left.appendChild(el("p", "gold", (meta.saveOk === false ? "저장 실패" : "저장됨") + " · 조각 " + meta.shards + " · 안전 " + meta.safeSteps));
    left.appendChild(el("h2", "", room.name));
    top.appendChild(left);
    top.appendChild(btn("title", "타이틀", ""));
    var back = top.lastChild;
    back.style.width = "auto";
    back.style.minHeight = "44px";
    app.appendChild(top);
    app.appendChild(el("p", "muted", roomLine(room)));
    if (meta.lastGrowth) app.appendChild(el("p", "gold", meta.lastGrowth));
    var map = el("div", "map");
    Object.keys(ROOMS).forEach(function (id) {
      var r = ROOMS[id];
      var seen = meta.visited.indexOf(id) >= 0;
      var c = el("div", "cell" + (id === meta.room ? " on" : seen ? " seen" : ""), r.short);
      map.appendChild(c);
    });
    app.appendChild(map);
    var stack = el("div", "stack");
    if (meta.cleared && meta.room === "throne") {
      stack.appendChild(btn("escape", "현관으로 탈출", "주사위 없음. 체력은 돌아온다", true));
    }
    if (meta.room === "gate") {
      stack.appendChild(btn("rest", "전원 회복", "현관에서만. 쓰러진 아군도"));
      stack.appendChild(partyCard());
    }
    room.spots.forEach(function (sp) {
      var used = sp.kind !== "heal" && hasFlag(sp.flag);
      stack.appendChild(btn("spot:" + sp.id, (used ? "끝 · " : "") + sp.label, sp.sub, false, used));
    });
    room.exits.forEach(function (ex) {
      var locked = !ex.to || (ex.need && !hasFlag(ex.need));
      var sub = locked ? (ex.lock || "지나갈 수 없다") : ex.steps + "걸음";
      stack.appendChild(btn("exit:" + ex.n, "출구 " + ex.n + " · " + ex.label, sub, false, locked));
    });
    app.appendChild(stack);
    if (pending) app.appendChild(tripSheet());
  }
  function roomLine(room) {
    if (room.id === "gate" && meta.cleared) return "옥좌는 넘어갔다. 걸음은 아직 이 지도 안에 있다.";
    if (room.id === "armory" && hasFlag("secret")) return "쇠사슬이 풀렸다. 출구 2가 감시탑이다.";
    if (room.id === "throne" && hasFlag("beat.ar")) return "아르는 무릎을 꺾었다. 균열이 한 박자 늦다.";
    return room.line;
  }
  function partyCard() {
    var card = el("div", "card");
    card.appendChild(el("p", "", "파티"));
    card.appendChild(el("small", "", "칸을 누르고, 아래 이름에서 고른다. 빈 체력은 그대로 데려온다."));
    var slots = el("div", "row");
    slots.style.margin = "8px 0";
    meta.party.forEach(function (id, i) {
      var b = btn("slot:" + i, ALLIES[id].name, "숙련 " + (meta.veteran[id] || 0) + " · 공격 " + atkOf(ALLIES[id], meta.ranks[id] || 0, meta.veteran[id] || 0) + " · " + curHp(id) + "/" + maxHp(ALLIES[id], meta.ranks[id] || 0));
      b.style.width = "auto";
      b.style.flex = "1";
      if (slot === i) b.classList.add("aim");
      slots.appendChild(b);
    });
    card.appendChild(slots);
    var names = el("div", "stack");
    meta.roster.forEach(function (id) {
      var rank = meta.ranks[id] || 0;
      var cost = RANK_COST[rank];
      var sub = "랭크 " + rank + (cost != null ? " · 올리기 " + cost : " · 최대");
      var row = el("div", "row");
      var pick = btn("pick:" + id, ALLIES[id].name, ALLIES[id].role + " · " + curHp(id));
      pick.style.flex = "1";
      row.appendChild(pick);
      if (cost != null) row.appendChild(btn("rank:" + id, "강화", sub, false, meta.shards < cost));
      names.appendChild(row);
    });
    card.appendChild(names);
    if (meta.tactic) card.appendChild(el("small", "", "전술 · " + tacticName(meta.tactic)));
    return card;
  }
  function tacticName(id) {
    for (var i = 0; i < TACTICS.length; i++) if (TACTICS[i].id === id) return TACTICS[i].name;
    return "";
  }
  function openTrip(label, steps, dest, danger, loot) {
    var plan = tripPlan(steps, meta.safeSteps, danger);
    pending = { label: label, steps: steps, dest: dest, danger: danger, loot: loot, plan: plan, die: null };
    render();
  }
  function tripSheet() {
    var p = pending;
    var sheet = el("div", "sheet");
    var pct = Math.round(p.plan.chance * 100);
    sheet.appendChild(el("h2", "", p.label));
    sheet.appendChild(el("p", "muted", p.steps + "걸음 · 안전 " + p.plan.safeUsed + " · 위험 걸음 " + p.plan.risky + " · 조우 " + pct + "%"));
    sheet.appendChild(el("p", "muted", "조우 = 위험 걸음 × 9% + 도착지 위험. 상한 75%. 주사위 1–100."));
    if (p.die == null) {
      sheet.appendChild(btn("roll", p.loot && p.loot.fixed ? "그대로 맞선다" : "그대로 간다", p.loot && p.loot.fixed ? "주사위 없음" : "주사위를 지금 굴린다", true));
      sheet.appendChild(btn("cancel", "그만둔다", "걸음은 아직 쓰지 않았다"));
    } else if (p.fight) {
      sheet.appendChild(el("p", "log", "주사위 " + p.die + " · 기준 " + Math.round(p.plan.chance * 100) + " 이하 · 전투"));
      sheet.appendChild(btn("fight", "싸운다", enemyNames(p.pack), true));
    } else {
      sheet.appendChild(el("p", "log", "주사위 " + p.die + " · 기준 " + Math.round(p.plan.chance * 100) + " · 조용하다"));
      sheet.appendChild(btn("arrive", "도착한다", p.dest ? ROOMS[p.dest].name : "이 자리", true));
    }
    return sheet;
  }
  function enemyNames(pack) {
    return (pack || []).map(function (id) { return ENEMIES[id].name; }).join(" · ");
  }
  function commitRoll() {
    var p = pending;
    if (p.loot && p.loot.fixed) {
      p.die = 0;
      p.fight = true;
      p.pack = p.loot.pack;
      p.plan = { safeUsed: 0, risky: 0, chance: 1 };
      render();
      return;
    }
    meta.safeSteps = Math.max(0, meta.safeSteps - p.plan.safeUsed);
    var die = 1 + Math.floor(Math.random() * 100);
    var fight = die <= Math.round(p.plan.chance * 100);
    p.die = die;
    p.fight = fight;
    p.pack = fight ? encounterPack(p.dest || meta.room, p.plan.risky) : [];
    save();
    render();
  }
  function startFight() {
    var allies = meta.party.map(function (id, i) {
      var f = fighter(ALLIES[id], "ally", "a" + i, meta.ranks[id] || 0, meta.veteran[id] || 0);
      f.hp = Math.min(f.maxHp, curHp(id));
      f.alive = f.hp > 0;
      return f;
    }).filter(function (f) { return f.alive; });
    if (!allies.length) { healAll(); save(); pending = null; render(); return; }
    var enemies = pending.pack.map(function (id, i) { return fighter(ENEMIES[id], "enemy", "e" + i); });
    battle = startBattle(allies, enemies, meta.tactic);
    aim = "";
    phase = "battle";
    save();
    render();
  }
  function applyHp() {
    battle.allies.forEach(function (a) {
      meta.hp[a.id] = a.alive ? a.hp : 0;
    });
  }
  function applyLoot() {
    var loot = pending && pending.loot;
    if (!loot) return;
    if (loot.shards) meta.shards += loot.shards;
    if (loot.secret) addFlag("secret");
    if (loot.ally && meta.roster.indexOf(loot.ally) < 0) {
      meta.roster.push(loot.ally);
      meta.hp[loot.ally] = maxHp(ALLIES[loot.ally], 0);
    }
    if (loot.flag) addFlag(loot.flag);
    if (loot.kind === "heal") healAll();
    if (loot.kind === "boss") {
      meta.cleared = true;
      ["luga", "serena", "mira"].forEach(function (id) {
        if (meta.roster.indexOf(id) < 0) {
          meta.roster.push(id);
          meta.hp[id] = maxHp(ALLIES[id], 0);
        }
      });
    }
  }
  function finish(won) {
    applyHp();
    var boss = pending && pending.loot && pending.loot.kind === "boss";
    var offer = !won || boss;
    if (won) {
      meta.safeSteps = 3;
      meta.shards += 6 + ((pending && pending.plan && pending.plan.risky) || 0);
      var lines = [];
      meta.party.forEach(function (id) {
        if ((meta.hp[id] || 0) <= 0) return;
        var beforeV = meta.veteran[id] || 0;
        var rank = meta.ranks[id] || 0;
        var a0 = atkOf(ALLIES[id], rank, beforeV);
        if (beforeV < 10) meta.veteran[id] = beforeV + 1;
        var a1 = atkOf(ALLIES[id], rank, meta.veteran[id] || 0);
        lines.push(ALLIES[id].name + " 숙련 " + beforeV + "→" + (meta.veteran[id] || 0) + " · 공격 " + a0 + "→" + a1);
      });
      meta.lastGrowth = lines.join(" / ");
      applyLoot();
      if (pending && pending.dest) {
        meta.room = pending.dest;
        if (meta.visited.indexOf(pending.dest) < 0) meta.visited.push(pending.dest);
      }
    } else {
      var lost = [];
      battle.allies.forEach(function (a) {
        var beforeV = meta.veteran[a.id] || 0;
        var rank = meta.ranks[a.id] || 0;
        var a0 = atkOf(ALLIES[a.id], rank, beforeV);
        if (beforeV < 10) meta.veteran[a.id] = beforeV + 1;
        var a1 = atkOf(ALLIES[a.id], rank, meta.veteran[a.id] || 0);
        lost.push(ALLIES[a.id].name + " 숙련 " + beforeV + "→" + (meta.veteran[a.id] || 0) + " · 공격 " + a0 + "→" + a1);
      });
      meta.lastGrowth = lost.join(" / ");
      meta.shards += 2;
      meta.room = "gate";
      meta.safeSteps = 0;
      healAll();
    }
    pending = null;
    battle = null;
    aim = "";
    phase = offer ? "offer" : (won && boss ? "ending" : "play");
    if (won && boss) phase = "offer";
    save();
    render();
  }
  function renderBattle(app) {
    var top = el("div", "top");
    top.appendChild(el("h2", "", "전투"));
    top.appendChild(el("p", "gold", "피해 " + battle.damageDealt));
    app.appendChild(top);
    if (battle.phase === "won") app.appendChild(btn("win", "나간다", "생존자 숙련이 오른다", true));
    if (battle.phase === "lost") app.appendChild(btn("lose", "현관으로", "체력은 돌아온다. 전술 하나", true));
    app.appendChild(el("p", "log", battle.voice || battle.log));
    battle.enemies.forEach(function (u) { app.appendChild(unitCard(u, true)); });
    battle.allies.forEach(function (u) { app.appendChild(unitCard(u, false)); });
    if (battle.phase === "won" || battle.phase === "lost") return;
    if (battle.phase === "enemy") {
      var eid = battle.eQueue[0];
      var foe = eid ? findF(battle, eid) : null;
      app.appendChild(btn("estep", "적의 행동", foe ? foe.name : "다음", true));
      app.appendChild(btn("flee", "탈출", "이 방에 남는다. 안전 걸음은 0"));
      return;
    }
    var actor = battle.queue[0] ? findF(battle, battle.queue[0]) : null;
    if (!actor) return;
    app.appendChild(el("p", "gold", actor.name + "의 차례"));
    var box = el("div", "stack");
    actor.skills.forEach(function (sk) {
      var locked = sk.ult && actor.ult < sk.cost;
      var preview = "";
      if (!locked && aim === sk.id) preview = "고름 · 대상을 탭";
      else if (!locked && targetKind(sk) !== "ally") {
        var sample = targetKind(sk) === "none" ? null : lowest(battle.enemies);
        var next = forecast(battle, actor.iid, sk.id, sample ? sample.iid : null);
        if (next && sample) {
          var after = findF(next, sample.iid);
          preview = sample.name + " " + sample.hp + "→" + (after ? after.hp : 0);
        } else if (next) preview = next.log;
      }
      var b = btn("skill:" + sk.id, sk.name + (sk.ult ? " · 필살" : ""), sk.note + (preview ? " · " + preview : ""), false, locked);
      if (aim === sk.id) b.classList.add("aim");
      box.appendChild(b);
    });
    box.appendChild(btn("flee", "물러선다", "이 방에 남는다. 안전 걸음은 0"));
    app.appendChild(box);
  }
  function unitCard(u, enemy) {
    var card = el("div", "card unit");
    card.dataset.act = "target:" + u.iid;
    var head = el("div", "row");
    head.appendChild(el("strong", "", u.name));
    head.appendChild(el("span", "muted", u.hp + " / " + u.maxHp + (u.shield ? " · 막 " + u.shield : "")));
    card.appendChild(head);
    card.appendChild(bar(u.hp, u.maxHp, false));
    if (!enemy && u.alive) {
      card.appendChild(bar(u.ult, 100, true));
      card.appendChild(el("small", "", "숙련 " + ((meta && meta.veteran && meta.veteran[u.id]) || 0) + " · 공격 " + u.atk));
    }
    if (enemy && battle.phase === "player" && u.alive && battle.picks[u.iid]) {
      var sk = u.skills.filter(function (k) { return k.id === battle.picks[u.iid]; })[0];
      var next = forecast(battle, u.iid, sk.id, null);
      var line = sk.name;
      var prey = lowest(battle.allies);
      if (next && prey && targetKind(sk) === "enemy") {
        var after = findF(next, prey.iid);
        line += " · " + prey.name + " " + prey.hp + "→" + (after ? after.hp : 0);
      }
      card.appendChild(el("small", "", "다음 · " + line));
    }
    if (!u.alive) card.appendChild(el("small", "", "쓰러짐"));
    if (aim && u.alive && u.team === "enemy") card.classList.add("aim");
    if (aim) {
      var actor = findF(battle, battle.queue[0]);
      var sk2 = actor && actor.skills.filter(function (k) { return k.id === aim; })[0];
      if (sk2 && targetKind(sk2) === "ally" && u.team === "ally") card.classList.add("aim");
    }
    return card;
  }
  function renderOffer(app) {
    app.appendChild(el("p", "gold", meta.cleared ? "옥좌 다음" : "패배 다음"));
    app.appendChild(el("h2", "", "전술 하나"));
    app.appendChild(el("p", "muted", "고르면 지금 전술을 바꾼다. 거절하면 그대로."));
    var box = el("div", "stack");
    box.style.marginTop = "12px";
    TACTICS.forEach(function (t) {
      if (meta.tactic === t.id) return;
      box.appendChild(btn("tactic:" + t.id, t.name, t.text, true));
    });
    box.appendChild(btn("skip", "그대로 간다", meta.cleared ? "엔딩" : "현관"));
    app.appendChild(box);
  }
  function renderEnding(app) {
    app.appendChild(el("p", "gold", "걸음의 균열"));
    app.appendChild(el("h1", "", "옥좌는 넘어갔다"));
    app.appendChild(el("p", "muted", "아르는 무릎을 꺾었다. 루가, 세레나, 미라가 현관 명단에 있다."));
    if (meta.lastGrowth) app.appendChild(el("p", "gold", meta.lastGrowth));
    var box = el("div", "stack");
    box.style.marginTop = "16px";
    box.appendChild(btn("escape", "현관으로 나간다", "주사위 없음. 저장된다", true));
    box.appendChild(btn("play", "옥좌에 남는다", "출구 1이 테라스"));
    app.appendChild(box);
  }

  document.getElementById("app").addEventListener("click", function (ev) {
    var node = ev.target.closest("[data-act]");
    if (!node || node.disabled) return;
    var act = node.dataset.act;
    if (act === "continue" && meta) { phase = "play"; pending = null; render(); return; }
    if (act === "new") { meta = blank(); pending = null; battle = null; phase = "play"; save(); render(); return; }
    if (act === "title") { save(); phase = "title"; pending = null; render(); return; }
    if (act === "play") { phase = "play"; save(); render(); return; }
    if (act === "escape") {
      meta.room = "gate";
      if (meta.visited.indexOf("gate") < 0) meta.visited.push("gate");
      healAll();
      pending = null;
      battle = null;
      phase = "play";
      save();
      render();
      return;
    }
    if (phase === "play") onPlay(act);
    else if (phase === "battle") onBattle(act);
    else if (phase === "offer") onOffer(act);
  });

  function onPlay(act) {
    if (act === "rest") { healAll(); save(); render(); return; }
    if (act === "escape") {
      meta.room = "gate";
      if (meta.visited.indexOf("gate") < 0) meta.visited.push("gate");
      healAll();
      pending = null;
      phase = "play";
      save();
      render();
      return;
    }
    if (act.indexOf("slot:") === 0) { slot = Number(act.split(":")[1]); render(); return; }
    if (act.indexOf("pick:") === 0) {
      var id = act.split(":")[1];
      var next = meta.party.slice();
      if (next.indexOf(id) >= 0 && next[slot] !== id) return;
      next[slot] = id;
      var uniq = [];
      next.forEach(function (x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
      while (uniq.length < 3) {
        var fill = meta.roster.filter(function (r) { return uniq.indexOf(r) < 0; })[0];
        if (!fill) break;
        uniq.push(fill);
      }
      meta.party = uniq.slice(0, 3);
      save();
      render();
      return;
    }
    if (act.indexOf("rank:") === 0) {
      var rid = act.split(":")[1];
      var rank = meta.ranks[rid] || 0;
      var cost = RANK_COST[rank];
      if (cost == null || meta.shards < cost) return;
      var before = maxHp(ALLIES[rid], rank);
      meta.shards -= cost;
      meta.ranks[rid] = rank + 1;
      var after = maxHp(ALLIES[rid], rank + 1);
      meta.hp[rid] = Math.min(after, curHp(rid) + (after - before));
      save();
      render();
      return;
    }
    if (act === "cancel") { pending = null; render(); return; }
    if (act === "roll") { commitRoll(); return; }
    if (act === "fight") { startFight(); return; }
    if (act === "arrive") {
      applyLoot();
      if (pending.dest) {
        meta.room = pending.dest;
        if (meta.visited.indexOf(pending.dest) < 0) meta.visited.push(pending.dest);
      }
      pending = null;
      save();
      render();
      return;
    }
    if (act.indexOf("exit:") === 0) {
      var n = Number(act.split(":")[1]);
      var ex = ROOMS[meta.room].exits.filter(function (e) { return e.n === n; })[0];
      if (!ex || !ex.to || (ex.need && !hasFlag(ex.need))) return;
      openTrip("출구 " + ex.n + " · " + ex.label, ex.steps, ex.to, ROOMS[ex.to].danger, null);
      return;
    }
    if (act.indexOf("spot:") === 0) {
      var sid = act.slice(5);
      var sp = ROOMS[meta.room].spots.filter(function (s) { return s.id === sid; })[0];
      if (!sp || (sp.kind !== "heal" && hasFlag(sp.flag))) return;
      openTrip(sp.label, sp.steps, null, ROOMS[meta.room].danger, {
        kind: sp.kind, flag: sp.flag, shards: sp.shards, ally: sp.ally,
        pack: sp.pack, fixed: sp.fixed, secret: sp.secret,
      });
    }
  }
  function onBattle(act) {
    if (act === "estep") { battle = stepEnemy(battle); save(); render(); return; }
    if (act === "win") { finish(true); return; }
    if (act === "lose") { finish(false); return; }
    if (act === "flee") {
      applyHp();
      meta.safeSteps = 0;
      pending = null;
      battle = null;
      aim = "";
      phase = "play";
      save();
      render();
      return;
    }
    if (act.indexOf("skill:") === 0) {
      var sid = act.split(":")[1];
      var actor = findF(battle, battle.queue[0]);
      var sk = actor.skills.filter(function (k) { return k.id === sid; })[0];
      if (!sk || (sk.ult && actor.ult < sk.cost)) return;
      var kind = targetKind(sk);
      if (kind === "none") { battle = playerAct(battle, sid, null); aim = ""; save(); render(); return; }
      var pool = kind === "ally" ? battle.allies : living(battle.enemies);
      if (pool.length === 1 && (kind === "enemy" || pool[0].alive)) {
        battle = playerAct(battle, sid, pool[0].iid);
        aim = "";
        save();
        render();
        return;
      }
      aim = sid;
      render();
      return;
    }
    if (act.indexOf("target:") === 0 && aim) {
      battle = playerAct(battle, aim, act.split(":")[1]);
      aim = "";
      save();
      render();
    }
  }
  function onOffer(act) {
    if (act.indexOf("tactic:") === 0) meta.tactic = act.split(":")[1];
    if (meta.cleared && !meta.seenEnd) {
      meta.seenEnd = true;
      phase = "ending";
    } else phase = "play";
    save();
    render();
  }

  boot();
})(typeof globalThis !== "undefined" ? globalThis : this);
