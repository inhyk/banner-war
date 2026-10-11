export const UNITS=[{name:'검병',tag:'균형 잡힌 전위',cost:30,hp:110,damage:15,range:30,speed:49,rate:.8,cool:1.2,icon:'⚔'},{name:'궁수',tag:'뒤에서 원거리 지원',cost:45,hp:65,damage:17,range:205,speed:41,rate:1.1,cool:2,icon:'➶'},{name:'기사',tag:'튼튼한 방어와 돌파',cost:75,hp:320,damage:27,range:37,speed:33,rate:1.05,cool:3.5,icon:'♞'},{name:'마법사',tag:'뭉친 적에게 범위 공격',cost:90,hp:85,damage:35,range:175,speed:36,rate:1.8,cool:4.5,icon:'✦'}];
UNITS.push(
{name:'창병',tag:'긴 창 · 방어력 무시',cost:40,hp:105,damage:21,range:90,speed:46,rate:1,cool:1.8,icon:'⚑',pierce:true},
{name:'치유사',tag:'부상당한 아군 회복',cost:65,hp:90,damage:0,range:155,speed:36,rate:1.3,cool:4,icon:'✚',heal:24},
{name:'얼음술사',tag:'얼음 마법 · 적 감속',cost:85,hp:90,damage:22,range:190,speed:36,rate:1.4,cool:3.5,icon:'❄',slow:2.5},
{name:'광전사',tag:'빠른 돌격 · 흡혈',cost:100,hp:210,damage:29,range:34,speed:68,rate:.65,cool:4,icon:'♠',drain:.3},
{name:'명사수',tag:'아주 긴 사거리',cost:115,hp:80,damage:48,range:285,speed:34,rate:1.8,cool:4,icon:'◎'},
{name:'공성포',tag:'범위 포격 · 성 피해 2배',cost:160,hp:170,damage:60,range:250,speed:23,rate:2.8,cool:6,icon:'◉',splash:85,siege:2}
);
UNITS[2].armor=5;UNITS[3].splash=65;
export const LEVELS=[
['초원의 대결','meadow',[0,0,1,0,2,1,0,3]],['붉은 노을의 진격','sunset',[0,1,2,1,0,3,2]],['왕관의 언덕','sunset',[2,1,0,3,2,1,3]],
['창끝의 숲','forest',[4,0,1,4,2,3]],['치유의 숲길','forest',[2,5,1,4,0,3]],['그림자 요새','forest',[7,2,5,8,4,3]],
['얼어붙은 국경','snow',[6,2,1,4,6,3]],['서리바람 협곡','snow',[8,6,2,5,7,4]],['눈보라의 성','snow',[2,5,6,8,9,4]],
['잿빛 화산','volcano',[7,4,9,2,3,6]],['용암의 관문','volcano',[9,5,2,8,7,6]],['마지막 왕관','volcano',[2,5,9,6,7,8,4,3]]
].map(([name,theme,army],i)=>({name,theme,army,hp:1000+i*150,income:9.5+i*.65}));
export function createGame(stage=1){stage=Math.max(1,Math.min(LEVELS.length,Math.floor(stage)||1));return{stage,phase:'ready',time:0,mana:120,maxMana:180,income:0,bases:[1000,LEVELS[stage-1].hp],maxBases:[1000,LEVELS[stage-1].hp],units:[],cooldowns:UNITS.map(()=>0),spell:0,aiMana:35,aiTimer:5,aiTurn:0,fx:[],id:0,kills:0};}
export function start(s){if(s.phase!=='ready')return false;s.phase='battle';return true;}
function spawn(s,type,side){const t=UNITS[type];s.units.push({id:++s.id,type,side,x:side?1080:120,y:381+(s.id%3)*9,hp:t.hp,maxHp:t.hp,cd:.3,attack:0,slow:0});}
export function summon(s,type){const t=UNITS[type];if(!t||s.phase!=='battle'||s.mana<t.cost||s.cooldowns[type]>0||s.units.filter(u=>u.side===0).length>=24)return false;s.mana-=t.cost;s.cooldowns[type]=t.cool;spawn(s,type,0);return true;}
export function improve(s){if(s.phase!=='battle'||s.income>=3||s.mana<70+s.income*35)return false;s.mana-=70+s.income*35;s.income++;s.maxMana+=40;return true;}
function damage(s,u,n,pierce=false){n=Math.max(1,n-(pierce?0:UNITS[u.type].armor||0));if(u.hp<=0)return;u.hp-=n;if(u.hp<=0){s.fx.push({x:u.x,y:u.y-20,life:.5,kind:'burst',side:u.side});if(u.side===1){s.kills++;s.mana=Math.min(s.maxMana,s.mana+8);}}}
export function storm(s){if(s.phase!=='battle'||s.spell>0)return false;s.spell=28;for(const u of s.units)if(u.side===1&&u.hp>0){damage(s,u,105);s.fx.push({x:u.x,y:u.y,life:.55,kind:'lightning'});}return true;}
export function update(s,dt){if(s.phase!=='battle')return;s.time+=dt;s.mana=Math.min(s.maxMana,s.mana+dt*(12+s.income*4));s.spell=Math.max(0,s.spell-dt);s.cooldowns=s.cooldowns.map(x=>Math.max(0,x-dt));s.fx.forEach(f=>f.life-=dt);s.fx=s.fx.filter(f=>f.life>0);s.aiMana=Math.min(250,s.aiMana+dt*(LEVELS[s.stage-1].income+Math.min(s.time/75,3)));s.aiTimer-=dt;if(s.aiTimer<=0&&s.units.filter(u=>u.side===1).length<22){const seq=LEVELS[s.stage-1].army;const type=seq[s.aiTurn%seq.length];if(s.aiMana>=UNITS[type].cost){spawn(s,type,1);s.aiMana-=UNITS[type].cost;s.aiTurn++;s.aiTimer=Math.max(1.1,2.5-s.stage*.08);}else s.aiTimer=.35;}
const alive=s.units.filter(u=>u.hp>0);for(const u of alive){if(u.hp<=0)continue;const t=UNITS[u.type],dir=u.side?-1:1;u.cd=Math.max(0,u.cd-dt);u.attack=Math.max(0,u.attack-dt);u.slow=Math.max(0,(u.slow||0)-dt);
if(t.heal){const ally=alive.filter(a=>a.side===u.side&&a.hp>0&&a.hp<a.maxHp&&Math.abs(a.x-u.x)<=t.range).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally){if(u.cd===0){ally.hp=Math.min(ally.maxHp,ally.hp+t.heal);u.cd=t.rate;u.attack=.22;s.fx.push({x:u.x,y:u.y-30,tx:ally.x,ty:ally.y-28,kind:'heal',life:.35});}}else if(Math.abs((u.side?100:1100)-u.x)>t.range)u.x+=dir*t.speed*dt;continue;}
const enemies=alive.filter(e=>e.side!==u.side&&e.hp>0);const target=enemies.sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x))[0];const baseX=u.side?100:1100;const inRange=target&&Math.abs(target.x-u.x)<=t.range;const atBase=Math.abs(baseX-u.x)<=t.range+25;
if(inRange||atBase){if(u.cd===0){u.cd=t.rate;u.attack=.22;const tx=inRange?target.x:baseX;s.fx.push({x:u.x,y:u.y-27,tx,ty:inRange?target.y-24:340,side:u.side,kind:u.type===9?'cannon':u.type===6?'frost':[1,8].includes(u.type)?'arrow':u.type===3?'magic':'slash',life:.2});if(inRange){if(t.splash){for(const e of enemies)if(Math.abs(e.x-target.x)<t.splash)damage(s,e,t.damage);}else damage(s,target,t.damage,t.pierce);if(t.slow)target.slow=t.slow;if(t.drain)u.hp=Math.min(u.maxHp,u.hp+t.damage*t.drain);}else{s.bases[1-u.side]=Math.max(0,s.bases[1-u.side]-t.damage*(t.siege||1));}}}else u.x+=dir*t.speed*(u.slow>0?.45:1)*dt;}
s.units=s.units.filter(u=>u.hp>0);if(s.bases[0]<=0)s.phase='lost';else if(s.bases[1]<=0)s.phase='won';}
