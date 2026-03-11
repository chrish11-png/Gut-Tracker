import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, ComposedChart
} from "recharts";

// Encrypted localStorage adapter
const _K = "gut-tracker-2025-ch";
function _xor(s, k) { let r = ""; for (let i = 0; i < s.length; i++) r += String.fromCharCode(s.charCodeAt(i) ^ k.charCodeAt(i % k.length)); return r; }
const LS = {
  get: (key) => { try { const raw = localStorage.getItem(key); if (!raw) return null; try { const d = _xor(atob(raw), _K); JSON.parse(d); return d; } catch { return raw; } } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, btoa(_xor(val, _K))); } catch (e) { console.error("Storage:", e); } }
};

// ─── DESIGN ──────────────────────────────────────────────────────────────────
const T={bg:"#08090c",surface:"#0f1217",card:"#13171e",raised:"#1a1f2a",border:"#1e2836",border2:"#2a3545",gold:"#d4944a",goldDim:"#d4944a14",goldBorder:"#d4944a30",teal:"#3cc4a0",tealDim:"#3cc4a014",tealBorder:"#3cc4a030",red:"#c94848",redDim:"#c9484814",redBorder:"#c9484830",green:"#40b06a",greenDim:"#40b06a14",greenBorder:"#40b06a30",blue:"#4a88d4",blueDim:"#4a88d414",purple:"#8a6ee0",text:"#ccd6e0",sub:"#8a9db0",dim:"#4a5e72",bloodColors:["#40b06a","#d4944a","#c97820","#c94848","#882020"]};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const BLOOD=["None","Trace","Mild","Heavy","Severe"];
const CONSIST=["Formed","Mixed","Loose","Watery"];
const EA={1:"Bedridden",2:"Barely moving",3:"Couch day",4:"Dragging",5:"Functional",6:"Decent",7:"Active",8:"Strong",9:"Firing",10:"Peak"};
const MENTAL=["Clear","Slightly foggy","Foggy","Anxious","Overwhelmed"];
const SYMPTOMS=["Blood in stool","Loose stools","Urgency","Cramping","Colon tightness","Bloating / gas","Brain fog","Fatigue","Joint pain","Headache","Nausea","Night sweats","Sleep disruption","Low appetite","Muscle weakness","Pelvic tension","Colon spasming","Tired eyes"];
const SUPPS=["Mezavant","Salofalk","SPM Supreme","Sodium Butyrate","MAG+","Glycine","B Complex","Curcumin","Vitamin C (buffered)","Slippery Elm","Marshmallow Root","Glutamine","Electrolytes / Salt","Suppository","Lions Mane","Reishi","Collagen","Vitamin D3+K2","Calcium Carbonate","Red Light Therapy","Castor Oil Pack"];
const CUR_PROTOCOL=["Mezavant","B Complex","SPM Supreme","MAG+","Sodium Butyrate","Glycine","Salofalk"];

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED=[
  {id:"2025-04-14",date:"2025-04-14",sleepHours:3.5,sleepScore:30,energy:4,stress:8,mood:5,mentalState:"Overwhelmed",stoolCount:1,bloodLevel:1,consistency:"Formed",stoolLog:"1: AM solid formed, tiny blood on TP",symptoms:["Fatigue","Brain fog","Blood in stool"],breakfast:"",lunch:"",dinner:"",snacks:"",hydrationTypes:"",supplements:["Sodium Butyrate","Magnesium Glycinate","Reishi","B Complex","Suppository"],exercise:"Hiked Machu Picchu",sunMinutes:0,protocolChanges:""},
  {id:"2025-04-15",date:"2025-04-15",sleepHours:5,sleepScore:40,energy:4,stress:7,mood:5,mentalState:"Foggy",stoolCount:2,bloodLevel:2,consistency:"Formed",stoolLog:"1: AM solid blood\n2: PM solid blood",symptoms:["Blood in stool","Fatigue"],breakfast:"Fruit, eggs",lunch:"Meat, rice",dinner:"Meat, potatoes",snacks:"Banana",hydrationTypes:"water",supplements:["Suppository","Sodium Butyrate","Lions Mane","Mezavant","B Complex"],exercise:"Rest",sunMinutes:0,protocolChanges:""},
  {id:"2025-04-21",date:"2025-04-21",sleepHours:7,sleepScore:60,energy:5,stress:5,mood:6,mentalState:"Slightly foggy",stoolCount:3,bloodLevel:1,consistency:"Formed",stoolLog:"1-3: solid formed, dry blood on paper",symptoms:["Blood in stool"],breakfast:"Eggs, banana",lunch:"Meat",dinner:"Meat, rice",snacks:"Fruit",hydrationTypes:"",supplements:["Mezavant","Suppository"],exercise:"",sunMinutes:30,protocolChanges:""},
  {id:"2025-04-24",date:"2025-04-24",sleepHours:7,sleepScore:60,energy:5,stress:4,mood:6,mentalState:"Slightly foggy",stoolCount:3,bloodLevel:0,consistency:"Loose",stoolLog:"1: AM diarrhea no blood\n2: Noon loose watery no blood\n3: PM loose no blood",symptoms:["Loose stools","Bloating / gas"],breakfast:"6 eggs, dates, banana, maple syrup",lunch:"Cod, mushrooms, banana",dinner:"Oxtail, rice, broth",snacks:"Collagen, honey",hydrationTypes:"teas, aloe juice",supplements:["Collagen"],exercise:"",sunMinutes:60,protocolChanges:""},
  {id:"2025-05-01",date:"2025-05-01",sleepHours:7,sleepScore:62,energy:5,stress:4,mood:6,mentalState:"Clear",stoolCount:2,bloodLevel:0,consistency:"Loose",stoolLog:"1-2: loose, no blood",symptoms:["Loose stools"],breakfast:"Fruit, smoothie",lunch:"Eggs, rice, avocado",dinner:"Lamb, potatoes",snacks:"Broth, collagen",hydrationTypes:"broth",supplements:["B Complex"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-09-12",date:"2025-09-12",sleepHours:7,sleepScore:68,energy:6,stress:5,mood:7,mentalState:"Clear",stoolCount:3,bloodLevel:2,consistency:"Mixed",stoolLog:"1: AM solid big little blood\n2: Noon solid little blood\n3: Eve loose fresh blood",symptoms:["Blood in stool","Colon tightness","Bloating / gas","Fatigue"],breakfast:"",lunch:"Meat, fruit",dinner:"Meat, fruit",snacks:"Slippery elm",hydrationTypes:"chicken broth",supplements:["Slippery Elm","Glutamine"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-09-13",date:"2025-09-13",sleepHours:7.5,sleepScore:78,energy:6,stress:4,mood:7,mentalState:"Clear",stoolCount:4,bloodLevel:1,consistency:"Loose",stoolLog:"1: AM little blood some solid\n2: Noon blood better\n3: PM barely stool just gas\n4: Eve same",symptoms:["Loose stools","Blood in stool","Colon tightness","Bloating / gas"],breakfast:"",lunch:"Chicken broth, meat, fruit",dinner:"Meat, fruit",snacks:"",hydrationTypes:"chicken broth",supplements:["Slippery Elm"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-12-25",date:"2025-12-25",sleepHours:6,sleepScore:45,energy:3,stress:7,mood:4,mentalState:"Foggy",stoolCount:5,bloodLevel:2,consistency:"Loose",stoolLog:"1-5: loose throughout day, blood, tight colon",symptoms:["Blood in stool","Loose stools","Colon tightness","Fatigue","Headache","Joint pain"],breakfast:"Eggs, ghee",lunch:"Fish, squash",dinner:"Meat, avocado",snacks:"Honey, fruit",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-12-28",date:"2025-12-28",sleepHours:7.5,sleepScore:72,energy:6,stress:4,mood:6,mentalState:"Clear",stoolCount:3,bloodLevel:1,consistency:"Formed",stoolLog:"1-3: solid formed, some blood",symptoms:["Blood in stool"],breakfast:"",lunch:"Osso bucco, broth",dinner:"Chicken broth",snacks:"",hydrationTypes:"ginger tea, chicken broth",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-12-29",date:"2025-12-29",sleepHours:7.5,sleepScore:88,energy:6,stress:4,mood:7,mentalState:"Clear",stoolCount:5,bloodLevel:1,consistency:"Mixed",stoolLog:"1-3: AM solid formed little blood\n4: Eve loose gas blood\n5: Late solid tight colon",symptoms:["Blood in stool","Loose stools","Colon tightness"],breakfast:"Eggs, ghee, banana",lunch:"Meat, squash",dinner:"Meat, squash",snacks:"",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2025-12-30",date:"2025-12-30",sleepHours:6,sleepScore:42,energy:3,stress:6,mood:4,mentalState:"Foggy",stoolCount:5,bloodLevel:2,consistency:"Loose",stoolLog:"1: AM loose bloody\n2-3: Noon solid little blood\n4: Eve loose blood\n5: Night woke loose gassy",symptoms:["Blood in stool","Loose stools","Bloating / gas","Sleep disruption","Fatigue"],breakfast:"Bone broth, eggs, ghee, bananas",lunch:"Meat, fat, squash, honey",dinner:"Same",snacks:"",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-01-02",date:"2026-01-02",sleepHours:8,sleepScore:80,energy:6,stress:4,mood:7,mentalState:"Clear",stoolCount:3,bloodLevel:1,consistency:"Mixed",stoolLog:"1: AM loose\n2: Noon loose\n3: PM solid formed little blood",symptoms:["Blood in stool","Loose stools"],breakfast:"Bone broth, eggs, ghee, bananas",lunch:"Meat, squash",dinner:"Meat, squash",snacks:"",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-01-09",date:"2026-01-09",sleepHours:8,sleepScore:74,energy:7,stress:6,mood:7,mentalState:"Clear",stoolCount:4,bloodLevel:1,consistency:"Mixed",stoolLog:"1-3: AM-Noon solid little blood\n4: Eve loose gas little blood",symptoms:["Blood in stool","Loose stools"],breakfast:"Eggs, ghee, banana, mango",lunch:"Meat, squash",dinner:"Steak pepper garlic (restaurant)",snacks:"",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-01-12",date:"2026-01-12",sleepHours:8.5,sleepScore:88,energy:8,stress:3,mood:8,mentalState:"Clear",stoolCount:2,bloodLevel:0,consistency:"Mixed",stoolLog:"1: AM just gas\n2: PM solid formed no blood",symptoms:["Bloating / gas"],breakfast:"Eggs, ghee, mango, banana",lunch:"Ground beef, squash",dinner:"Ground beef, squash",snacks:"",hydrationTypes:"",supplements:["Mezavant"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-02-12",date:"2026-02-12",sleepHours:5,sleepScore:25,energy:2,stress:9,mood:2,mentalState:"Overwhelmed",stoolCount:20,bloodLevel:4,consistency:"Watery",stoolLog:"20+ loose bloody trips all day",symptoms:["Blood in stool","Loose stools","Urgency","Cramping","Pelvic tension","Fatigue","Muscle weakness"],breakfast:"Ground beef, glycine",lunch:"Ground beef, glycine, broth",dinner:"Ground beef, glycine",snacks:"Broth",hydrationTypes:"broth only",supplements:["Glycine"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-02-14",date:"2026-02-14",sleepHours:6,sleepScore:38,energy:3,stress:7,mood:4,mentalState:"Anxious",stoolCount:10,bloodLevel:3,consistency:"Watery",stoolLog:"~10 trips, heavy bleeding declining",symptoms:["Blood in stool","Loose stools","Urgency","Fatigue","Muscle weakness"],breakfast:"Ground beef, glycine, broth",lunch:"Ground beef, broth",dinner:"Ground beef, broth",snacks:"",hydrationTypes:"broth",supplements:["Glycine","Slippery Elm"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-02-20",date:"2026-02-20",sleepHours:7,sleepScore:62,energy:5,stress:5,mood:5,mentalState:"Slightly foggy",stoolCount:2,bloodLevel:1,consistency:"Mixed",stoolLog:"1-2: heavier stools",symptoms:["Blood in stool","Muscle weakness"],breakfast:"Ground beef, glycine, broth",lunch:"Ground beef, broth",dinner:"Ground beef, broth",snacks:"",hydrationTypes:"broth, slippery elm",supplements:["Glycine","Slippery Elm","Mezavant","Magnesium Glycinate"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-03-03",date:"2026-03-03",sleepHours:7,sleepScore:70,energy:5,stress:4,mood:6,mentalState:"Clear",stoolCount:2,bloodLevel:1,consistency:"Loose",stoolLog:"1-2: spongy unformed",symptoms:["Blood in stool","Loose stools"],breakfast:"Ground beef, broth, congee",lunch:"Ground beef, congee",dinner:"Ground beef, congee",snacks:"",hydrationTypes:"marshmallow root",supplements:["Sodium Butyrate","Magnesium Glycinate","Mezavant","Glycine"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-03-05",date:"2026-03-05",sleepHours:7.5,sleepScore:72,energy:5,stress:4,mood:6,mentalState:"Clear",stoolCount:2,bloodLevel:1,consistency:"Loose",stoolLog:"1-2: pelvic tension reduced",symptoms:["Blood in stool","Loose stools"],breakfast:"Ground beef, broth",lunch:"Ground beef, congee",dinner:"Ground beef",snacks:"",hydrationTypes:"marshmallow root",supplements:["Sodium Butyrate","Magnesium Glycinate","Mezavant","Marshmallow Root"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-03-09",date:"2026-03-09",sleepHours:6,sleepScore:42,energy:4,stress:7,mood:4,mentalState:"Foggy",stoolCount:4,bloodLevel:2,consistency:"Loose",stoolLog:"1-2: AM mix solid+loose\n3: PM loose colon tight\n4: Eve loose blood",symptoms:["Blood in stool","Loose stools","Colon tightness","Bloating / gas","Fatigue","Nausea","Headache","Low appetite","Tired eyes"],breakfast:"Mango, banana, bone broth",lunch:"Ground beef, sweet potato",dinner:"Meat, fruit, squash, butter",snacks:"",hydrationTypes:"",supplements:["Sodium Butyrate","Magnesium Glycinate","Mezavant","B Complex","Curcumin"],exercise:"",sunMinutes:0,protocolChanges:""},
  {id:"2026-03-10",date:"2026-03-10",sleepHours:6.5,sleepScore:50,energy:5,stress:5,mood:5,mentalState:"Slightly foggy",stoolCount:4,bloodLevel:1,consistency:"Loose",stoolLog:"1: AM partly solid\n2: Noon loose\n3-4: Eve loose. Zero tension.",symptoms:["Loose stools","Fatigue","Muscle weakness","Tired eyes"],breakfast:"5 eggs, ghee, mango, banana",lunch:"0.5lb ground beef, carrots, baked apples",dinner:"Ground beef, squash, carrots, maple syrup",snacks:"",hydrationTypes:"electrolytes",supplements:["Mezavant","B Complex","SPM Supreme","MAG+","Sodium Butyrate","Glycine","Salofalk"],exercise:"Red light 10min AM",sunMinutes:10,protocolChanges:""},
];


// ─── GUT SCORE ───────────────────────────────────────────────────────────────
function gutScore(e){let s=10;const c=(e.consistency||"Formed").toLowerCase();if(c==="watery")s-=4;else if(c==="loose")s-=2.5;else if(c==="mixed")s-=1.2;s+=[0,-1,-2,-3.5,-5][e.bloodLevel||0];s-=Math.min(2.5,(e.symptoms?.length||0)*0.3);s-=Math.max(0,(e.stoolCount||3)-3)*0.2;return Math.max(1,Math.min(10,parseFloat(s.toFixed(1))));}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function sColor(s){return s>=7?T.green:s>=5?T.gold:s>=3?"#c97820":T.red;}
function fmtD(d){const[y,m,day]=d.split("-");return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+day}, ${y}`;}
function fmtS(d){const[,m,day]=d.split("-");return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+day}`;}
function today(){return new Date().toISOString().split("T")[0];}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];}
function emptyEntry(date){return{id:date,date,sleepHours:7.5,sleepScore:70,energy:5,stress:5,mood:6,mentalState:"Clear",stoolCount:3,bloodLevel:0,consistency:"Formed",stoolLog:"",symptoms:[],breakfast:"",lunch:"",dinner:"",snacks:"",hydrationTypes:"",supplements:[...CUR_PROTOCOL],exercise:"",sunMinutes:0,protocolChanges:""};}
function weekOf(d){const dt=new Date(d+"T12:00:00");const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);const m=new Date(dt);m.setDate(diff);return m.toISOString().split("T")[0];}
function monthOf(d){return d.slice(0,7);}

// ─── AUTO INSIGHTS ───────────────────────────────────────────────────────────
function generateInsights(entries,allEntries){
  if(!entries.length)return[];const ins=[];const n=entries.length;const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  const formed=entries.filter(e=>e.consistency==="Formed").length;const loose=entries.filter(e=>e.consistency==="Loose").length;const watery=entries.filter(e=>e.consistency==="Watery").length;
  const fp=Math.round(formed/n*100);const lp=Math.round(loose/n*100);const wp=Math.round(watery/n*100);
  if(fp>=60)ins.push({type:"win",text:`Consistency strong: ${fp}% formed.`});
  else if(lp>=60)ins.push({type:"concern",text:`${lp}% loose stools. Consistency is #1 recovery signal.`});
  if(wp>0)ins.push({type:"concern",text:`${wp}% watery stools detected.`});
  const bf=entries.filter(e=>e.bloodLevel===0).length;
  if(bf===n&&n>=3)ins.push({type:"win",text:`Blood-free streak: ${n} days!`});
  else if(bf===0)ins.push({type:"concern",text:`Blood present every day.`});
  else{let mx=0,cur=0;sorted.forEach(e=>{if(e.bloodLevel===0){cur++;mx=Math.max(mx,cur);}else cur=0;});if(mx>=3)ins.push({type:"win",text:`Longest blood-free: ${mx} days.`});if(bf>=n*.5)ins.push({type:"win",text:`${bf}/${n} days blood-free (${Math.round(bf/n*100)}%).`});}
  const allS=[...allEntries].sort((a,b)=>a.date.localeCompare(b.date));
  entries.forEach(e=>{if(gutScore(e)<4){const idx=allS.findIndex(x=>x.id===e.id);for(let b=1;b<=3;b++){const p=allS[idx-b];if(p&&p.stress>=7){ins.push({type:"concern",text:`Bad day ${fmtS(e.date)} (${gutScore(e)}) after stress ${p.stress}/10 on ${fmtS(p.date)} — ${b}d lag.`});break;}}}});
  const bad=entries.filter(e=>gutScore(e)<5);const good=entries.filter(e=>gutScore(e)>=6);
  if(bad.length>0&&good.length>0){const bF=new Set();bad.forEach(e=>{[e.breakfast,e.lunch,e.dinner,e.snacks].join(", ").toLowerCase().split(/[,;]/).map(f=>f.trim()).filter(f=>f.length>3).forEach(f=>bF.add(f));});const gF=new Set();good.forEach(e=>{[e.breakfast,e.lunch,e.dinner,e.snacks].join(", ").toLowerCase().split(/[,;]/).map(f=>f.trim()).filter(f=>f.length>3).forEach(f=>gF.add(f));});const sus=[...bF].filter(f=>!gF.has(f));if(sus.length>0&&sus.length<=3)ins.push({type:"concern",text:`Foods only on bad days: ${sus.slice(0,3).join(", ")}.`});}
  const scores=sorted.map(e=>e.sleepScore).filter(s=>s>0);
  if(scores.length>=4){const h1=scores.slice(0,Math.ceil(scores.length/2));const h2=scores.slice(Math.ceil(scores.length/2));const a1=h1.reduce((a,b)=>a+b,0)/h1.length;const a2=h2.reduce((a,b)=>a+b,0)/h2.length;if(a2-a1>=8)ins.push({type:"win",text:`Sleep quality up ~${Math.round(a2-a1)} Garmin pts.`});else if(a1-a2>=8)ins.push({type:"concern",text:`Sleep quality down ~${Math.round(a1-a2)} Garmin pts.`});}
  return ins.slice(0,5);
}

// ─── NOTE PARSER ─────────────────────────────────────────────────────────────
function parseNote(text){
  const e=emptyEntry(yesterday());const lines=text.split("\n").map(l=>l.trim());
  const val=(p)=>{for(const l of lines){const m=l.match(p);if(m)return m[1].trim();}return null;};
  const section=(hdr)=>{const idx=lines.findIndex(l=>l.toLowerCase().replace(/[^a-z]/g,"").includes(hdr.toLowerCase().replace(/[^a-z]/g,"")));if(idx<0)return"";const c=[];for(let i=idx+1;i<lines.length;i++){if(lines[i].startsWith("---")||lines[i].startsWith("##"))break;c.push(lines[i]);}return c.join("\n").trim();};
  const ds=val(/^DATE:\s*(.+)/i);if(ds){const p=ds.replace(/[\/\.]/g,"-").match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(p){e.date=`${p[1]}-${p[2].padStart(2,"0")}-${p[3].padStart(2,"0")}`;e.id=e.date;}}
  const hrs=val(/^Hours:\s*(\d+\.?\d*)/i);if(hrs)e.sleepHours=parseFloat(hrs);
  const gs=val(/^(?:Garmin\s*)?Score:\s*(\d+)/i);if(gs)e.sleepScore=parseInt(gs);
  const en=val(/^Energy:\s*(\d+)/i);if(en)e.energy=Math.min(10,Math.max(1,parseInt(en)));
  const st=val(/^Stress:\s*(\d+)/i);if(st)e.stress=parseInt(st);
  const mo=val(/^Mood:\s*(\d+)/i);if(mo)e.mood=parseInt(mo);
  const ms=val(/^Mental:\s*(.+)/i);if(ms){const match=MENTAL.find(m=>ms.toLowerCase().includes(m.toLowerCase()));e.mentalState=match||ms;}
  const cnt=val(/^Count:\s*(\d+)/i);if(cnt)e.stoolCount=parseInt(cnt);
  const bl=val(/^Blood:\s*(.+)/i);if(bl){const idx=BLOOD.findIndex(b=>bl.toLowerCase().includes(b.toLowerCase()));if(idx>=0)e.bloodLevel=idx;}
  const con=val(/^Consistency:\s*(.+)/i);if(con){const match=CONSIST.find(c=>con.toLowerCase().includes(c.toLowerCase()));if(match)e.consistency=match;}
  const sl=section("STOOLLOG")||section("STOOL LOG");if(sl)e.stoolLog=sl;
  const bf=val(/^B:\s*(.+)/i);if(bf)e.breakfast=bf;const lu=val(/^L:\s*(.+)/i);if(lu)e.lunch=lu;const di=val(/^D:\s*(.+)/i);if(di)e.dinner=di;const sn=val(/^S:\s*(.+)/i);if(sn)e.snacks=sn;
  const ht=val(/^Types:\s*(.+)/i);if(ht)e.hydrationTypes=ht;
  const suppSec=section("SUPPLEMENTS");if(suppSec){const items=suppSec.split("\n")[0].split(/[,;]/).map(s=>s.trim()).filter(Boolean);e.supplements=items.map(item=>{const match=SUPPS.find(s=>s.toLowerCase().includes(item.toLowerCase())||item.toLowerCase().includes(s.toLowerCase().split(" ")[0]));return match||item;});}
  const sympSec=section("SYMPTOMS");if(sympSec){const items=sympSec.split("\n")[0].split(/[,;]/).map(s=>s.trim()).filter(Boolean);e.symptoms=items.map(item=>{const match=SYMPTOMS.find(s=>s.toLowerCase().includes(item.toLowerCase())||item.toLowerCase().includes(s.toLowerCase().split("/")[0].trim()));return match||item;});}
  const ex=section("EXERCISE")||section("MOVEMENT");if(ex)e.exercise=ex.split("\n")[0];
  const mins=val(/^(?:Sun\s*)?Minutes:\s*(\d+)/i);if(mins)e.sunMinutes=parseInt(mins);
  const proto=section("PROTOCOLCHANGES")||section("PROTOCOL CHANGES");if(proto&&!proto.match(/^(none|no changes?)$/i))e.protocolChanges=proto.split("\n")[0];
  return e;
}


// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const Card=({children,style={}})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20,...style}}>{children}</div>;
const Lbl=({children,style={}})=><div style={{color:T.sub,fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,...style}}>{children}</div>;
const Pill=({label,active,onClick,color=T.gold})=><button onClick={onClick} style={{padding:"4px 11px",borderRadius:16,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${active?color:T.border2}`,background:active?color+"20":"transparent",color:active?color:T.dim,transition:"all .15s",margin:"0 3px 4px 0"}}>{label}</button>;
const BB=({level})=><span style={{background:T.bloodColors[level]+"20",color:T.bloodColors[level],border:`1px solid ${T.bloodColors[level]}40`,padding:"2px 10px",borderRadius:14,fontSize:10,fontWeight:700}}>{BLOOD[level]}</span>;
const SC=({v,size=56})=>{const c=sColor(v);return (<div style={{width:size,height:size,borderRadius:"50%",background:c+"14",border:`2px solid ${c}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:c,fontWeight:800,fontSize:size*.3,lineHeight:1}}>{v}</span><span style={{color:c+"88",fontSize:size*.16}}>/10</span></div>);};
const Tip=({active,payload,label})=>{if(!active||!payload?.length)return null;return (<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:11}}><div style={{color:T.sub,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: {typeof p.value==="number"?(Number.isInteger(p.value)?p.value:p.value.toFixed(1)):p.value}</div>)}</div>);};
const IB=({insight})=><div style={{background:insight.type==="win"?T.greenDim:T.redDim,border:`1px solid ${insight.type==="win"?T.greenBorder:T.redBorder}`,borderRadius:8,padding:"6px 10px",marginBottom:4}}><span style={{color:insight.type==="win"?T.green:T.red,fontSize:10,fontWeight:700}}>{insight.type==="win"?"▲ ":"▼ "}</span><span style={{color:T.text,fontSize:11}}>{insight.text}</span></div>;

// ─── STOOL PATTERN ANALYZER (AM vs PM) ──────────────────────────────────────
function analyzeStoolPatterns(entries){
  let amFormed=0,amLoose=0,pmFormed=0,pmLoose=0,total=0;
  entries.forEach(e=>{if(!e.stoolLog)return;const lines=e.stoolLog.split("\n");lines.forEach(l=>{const low=l.toLowerCase();const isAM=low.match(/\b(am|morning|1st|first|wak)/);const isPM=low.match(/\b(pm|eve|evening|night|late|noon|afternoon)/);const isLoose=low.match(/\b(loose|watery|diarrhea|gas)/);const isFormed=low.match(/\b(solid|formed|heavy)/);if(isAM){total++;if(isFormed)amFormed++;if(isLoose)amLoose++;}if(isPM){total++;if(isFormed)pmFormed++;if(isLoose)pmLoose++;}});});
  return{amFormed,amLoose,pmFormed,pmLoose,total};
}

// ─── SYMPTOM HEATMAP DATA ───────────────────────────────────────────────────
function buildSymptomHeatmap(entries){
  const last30=[...entries].sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);
  const map={};SYMPTOMS.forEach(s=>{map[s]={count:0,dates:[]};});
  last30.forEach(e=>{e.symptoms.forEach(s=>{if(map[s]){map[s].count++;map[s].dates.push(e.date);}});});
  return Object.entries(map).filter(([,v])=>v.count>0).sort((a,b)=>b[1].count-a[1].count);
}


// ═══════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab({entries}){
  if(!entries.length) return (<div style={{color:T.sub,textAlign:"center",padding:80}}>No data yet.</div>);
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));const last=sorted[sorted.length-1];const gs=gutScore(last);
  const prev=sorted.length>1?gutScore(sorted[sorted.length-2]):null;const trend=prev!==null?gs-prev:0;const recent=sorted.slice(-14);
  const chartData=recent.map(e=>({date:fmtS(e.date),Score:gutScore(e),Stools:e.stoolCount,Blood:e.bloodLevel,Sleep:e.sleepHours||0,Garmin:e.sleepScore||0,Energy:e.energy}));
  const thisWeekStart=weekOf(today());const thisWeek=sorted.filter(e=>e.date>=thisWeekStart);
  const weekInsights=generateInsights(thisWeek.length>=2?thisWeek:sorted.slice(-7),sorted);
  const avg=(arr,fn)=>arr.length?(arr.reduce((a,e)=>a+fn(e),0)/arr.length).toFixed(1):"—";
  const bloodFree=recent.filter(e=>e.bloodLevel===0).length;
  return (<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
      <Card style={{gridColumn:"1/3",display:"flex",gap:16,alignItems:"center"}}><SC v={gs} size={72}/><div><div style={{color:T.text,fontWeight:700,fontSize:16}}>Gut Score</div><div style={{color:T.sub,fontSize:11,marginBottom:4}}>{fmtD(last.date)}</div>{prev!==null&&<div style={{color:trend>=0?T.green:T.red,fontSize:12,fontWeight:700}}>{trend>=0?"+":""}{trend.toFixed(1)} vs prev</div>}<div style={{marginTop:6,color:T.dim,fontSize:9}}>consistency → blood → symptoms → stool ±3</div></div></Card>
      {[{l:"Avg Score",v:avg(recent,gutScore),c:sColor(parseFloat(avg(recent,gutScore)))},{l:"Avg Stools",v:avg(recent,e=>e.stoolCount),c:parseFloat(avg(recent,e=>e.stoolCount))<=3.5?T.green:T.gold,s:"baseline: 3"},{l:"Blood-Free",v:`${bloodFree}/${recent.length}`,c:T.teal}].map(x=><Card key={x.l}><Lbl>{x.l}</Lbl><div style={{color:x.c,fontWeight:800,fontSize:26}}>{x.v}</div><div style={{color:T.dim,fontSize:10}}>{x.s||`last ${recent.length}d`}</div></Card>)}
    </div>
    <Card style={{marginBottom:16}}><Lbl>This Week — Auto Insights</Lbl>{weekInsights.length>0?weekInsights.map((ins,i)=><IB key={i} insight={ins}/>):<div style={{color:T.dim,fontSize:12}}>Need 2+ entries this week for insights.</div>}</Card>
    <Card style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Lbl style={{margin:0}}>Current Protocol</Lbl></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{(last.supplements.length>0?last.supplements:CUR_PROTOCOL).map(s=><span key={s} style={{background:T.tealDim,color:T.teal,border:`1px solid ${T.tealBorder}`,borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:600}}>{s}</span>)}</div>{last.protocolChanges&&<div style={{marginTop:10,background:T.goldDim,border:`1px solid ${T.goldBorder}`,borderRadius:8,padding:"8px 12px"}}><span style={{color:T.gold,fontSize:10,fontWeight:700}}>CHANGE </span><span style={{color:T.text,fontSize:12}}>{last.protocolChanges}</span></div>}</Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Card><Lbl>Gut Score</Lbl><ResponsiveContainer width="100%" height={150}><AreaChart data={chartData} margin={{top:5,right:5,bottom:0,left:-20}}><defs><linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.25}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fill:T.dim,fontSize:9}} interval="preserveStartEnd"/><YAxis domain={[0,10]} tick={{fill:T.dim,fontSize:9}}/><Tooltip content={<Tip/>}/><ReferenceLine y={7} stroke={T.green} strokeDasharray="3 3" opacity={.3}/><Area type="monotone" dataKey="Score" stroke={T.gold} fill="url(#gG)" strokeWidth={2} dot={{r:2,fill:T.gold}}/></AreaChart></ResponsiveContainer></Card>
      <Card><Lbl>Blood Level</Lbl><ResponsiveContainer width="100%" height={150}><AreaChart data={chartData} margin={{top:5,right:5,bottom:0,left:-20}}><defs><linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={.3}/><stop offset="95%" stopColor={T.red} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fill:T.dim,fontSize:9}} interval="preserveStartEnd"/><YAxis domain={[0,4]} ticks={[0,1,2,3,4]} tickFormatter={i=>BLOOD[i]||""} tick={{fill:T.dim,fontSize:9}}/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="Blood" stroke={T.red} fill="url(#bG)" strokeWidth={2} dot={{r:2,fill:T.red}}/></AreaChart></ResponsiveContainer></Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
      <Card><Lbl>Stools (baseline: 3)</Lbl><ResponsiveContainer width="100%" height={110}><BarChart data={chartData} margin={{top:5,right:5,bottom:0,left:-25}}><XAxis dataKey="date" tick={{fill:T.dim,fontSize:8}} interval="preserveStartEnd"/><YAxis tick={{fill:T.dim,fontSize:9}}/><Tooltip content={<Tip/>}/><ReferenceLine y={3} stroke={T.green} strokeDasharray="3 3" opacity={.4}/><Bar dataKey="Stools" fill={T.blue} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></Card>
      <Card><Lbl>Sleep + Garmin</Lbl><ResponsiveContainer width="100%" height={110}><ComposedChart data={chartData} margin={{top:5,right:5,bottom:0,left:-25}}><XAxis dataKey="date" tick={{fill:T.dim,fontSize:8}} interval="preserveStartEnd"/><YAxis yAxisId="h" domain={[3,10]} tick={{fill:T.dim,fontSize:9}}/><YAxis yAxisId="g" orientation="right" domain={[0,100]} tick={{fill:T.dim,fontSize:8}}/><Tooltip content={<Tip/>}/><ReferenceLine yAxisId="h" y={7.5} stroke={T.green} strokeDasharray="3 3" opacity={.3}/><Line yAxisId="h" type="monotone" dataKey="Sleep" stroke={T.teal} strokeWidth={2} dot={false}/><Line yAxisId="g" type="monotone" dataKey="Garmin" stroke={T.purple} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/></ComposedChart></ResponsiveContainer></Card>
      <Card><Lbl>Energy</Lbl><ResponsiveContainer width="100%" height={110}><LineChart data={chartData} margin={{top:5,right:5,bottom:0,left:-25}}><XAxis dataKey="date" tick={{fill:T.dim,fontSize:8}} interval="preserveStartEnd"/><YAxis domain={[1,10]} tick={{fill:T.dim,fontSize:9}}/><Tooltip content={<Tip/>}/><Line type="monotone" dataKey="Energy" stroke={T.purple} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></Card>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: IMPORT
// ═══════════════════════════════════════════════════════════════════════════
function ImportTab({entries,onSave}){
  const [raw,setRaw]=useState("");const [preview,setPreview]=useState(null);const [saved,setSaved]=useState(false);
  function handleParse(){if(!raw.trim())return;setPreview(parseNote(raw));setSaved(false);}
  function handleSave(){if(!preview)return;onSave(preview);setSaved(true);setTimeout(()=>{setSaved(false);setRaw("");setPreview(null);},2000);}
  const s=preview?gutScore(preview):null;
  return (<div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
    <div><Card><Lbl>Paste Yesterday's Note</Lbl><div style={{color:T.sub,fontSize:12,marginBottom:12}}>Defaults to yesterday's date.</div>
      <textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder={"DATE: "+yesterday()+"\n\n--- SLEEP ---\nHours: 7.5\nGarmin Score: 82\n..."} style={{width:"100%",minHeight:420,background:T.surface,border:`1px solid ${T.border2}`,borderRadius:10,padding:16,color:T.text,fontSize:13,fontFamily:"'SF Mono',monospace",lineHeight:1.7,resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
      <div style={{display:"flex",gap:10,marginTop:12}}>
        <button onClick={handleParse} style={{flex:1,padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",border:`1px solid ${T.gold}`,color:T.gold}}>Parse</button>
        {preview&&<button onClick={handleSave} style={{flex:1,padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:saved?T.green:T.gold,border:"none",color:"#000"}}>{saved?"Saved!":entries.find(e=>e.id===preview.id)?"Update":"Save"}</button>}
      </div>
    </Card><div style={{marginTop:16}}><Card><Lbl>Or Log Manually</Lbl><ManualLog entries={entries} onSave={onSave}/></Card></div></div>
    <div>{preview?(<Card style={{position:"sticky",top:70}}><Lbl>Preview</Lbl><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><SC v={s} size={56}/><div><div style={{color:T.text,fontWeight:700,fontSize:14}}>{fmtD(preview.date)}</div><div style={{color:T.sub,fontSize:11}}>Score: {s}/10</div></div></div>
      {[["Sleep",`${preview.sleepHours}h · Garmin ${preview.sleepScore}`,preview.sleepScore>=70?T.green:T.gold],["Energy",`${preview.energy}/10 (${EA[preview.energy]||""})`,preview.energy>=7?T.green:T.gold],["Stress",`${preview.stress}/10`,preview.stress<=4?T.green:preview.stress<=6?T.gold:T.red],["Mental",preview.mentalState,preview.mentalState==="Clear"?T.green:T.gold],["Stools",`${preview.stoolCount}`,preview.stoolCount<=3?T.green:T.gold],["Blood",BLOOD[preview.bloodLevel],T.bloodColors[preview.bloodLevel]],["Consistency",preview.consistency,preview.consistency==="Formed"?T.green:preview.consistency==="Mixed"?T.gold:T.red]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}><span style={{color:T.sub,fontSize:11}}>{l}</span><span style={{color:c,fontSize:11,fontWeight:700}}>{v}</span></div>)}
      {preview.stoolLog&&<div style={{marginTop:8,background:T.surface,borderRadius:8,padding:"6px 10px"}}><div style={{color:T.dim,fontSize:9,marginBottom:3}}>STOOL LOG</div><div style={{color:T.text,fontSize:11,whiteSpace:"pre-wrap"}}>{preview.stoolLog}</div></div>}
      {preview.exercise&&<div style={{marginTop:6}}><span style={{color:T.blue,fontSize:10,fontWeight:700}}>EXERCISE </span><span style={{color:T.text,fontSize:11}}>{preview.exercise}</span></div>}
      {preview.breakfast&&<div style={{marginTop:8}}><Lbl>Meals</Lbl>{["breakfast","lunch","dinner","snacks"].filter(m=>preview[m]).map(m=><div key={m} style={{fontSize:11,color:T.text,marginBottom:2}}><span style={{color:T.sub}}>{m[0].toUpperCase()}: </span>{preview[m]}</div>)}</div>}
      {preview.supplements.length>0&&<div style={{marginTop:8}}><Lbl>Supplements</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{preview.supplements.map(ss=><span key={ss} style={{background:T.tealDim,color:T.teal,borderRadius:10,padding:"2px 8px",fontSize:10}}>{ss}</span>)}</div></div>}
      {preview.symptoms.length>0&&<div style={{marginTop:8}}><Lbl>Symptoms</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{preview.symptoms.map(ss=><span key={ss} style={{background:T.redDim,color:T.red,borderRadius:10,padding:"2px 8px",fontSize:10}}>{ss}</span>)}</div></div>}
      {preview.protocolChanges&&<div style={{marginTop:8,background:T.goldDim,borderRadius:8,padding:"6px 10px"}}><span style={{color:T.gold,fontSize:10,fontWeight:700}}>CHANGE </span><span style={{color:T.text,fontSize:11}}>{preview.protocolChanges}</span></div>}
    </Card>):(<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{color:T.sub,fontSize:13}}>Paste → Parse → Save</div></Card>)}</div>
  </div>);
}

function ManualLog({entries,onSave}){
  const [form,setForm]=useState(emptyEntry(yesterday()));const [saved,setSaved]=useState(false);const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  useEffect(()=>{const ex=entries.find(e=>e.id===yesterday());if(ex)setForm(ex);},[entries]);
  const save=()=>{onSave(form);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const I=({value,onChange,type="number",...p})=><input type={type} value={value} onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)} style={{width:"100%",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 8px",color:T.text,fontSize:12,boxSizing:"border-box",outline:"none"}} {...p}/>;
  const Tx=({value,onChange,...p})=><textarea value={value} onChange={e=>onChange(e.target.value)} rows={2} style={{width:"100%",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:6,padding:"6px 8px",color:T.text,fontSize:12,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",outline:"none"}} {...p}/>;
  const F=({label,children})=><div style={{marginBottom:8}}><div style={{color:T.sub,fontSize:10,fontWeight:600,marginBottom:3,textTransform:"uppercase"}}>{label}</div>{children}</div>;
  const R=({children})=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{children}</div>;
  return (<div style={{marginTop:12}}>
    <R><F label="Date"><I type="date" value={form.date} onChange={v=>{set("date",v);set("id",v);}}/></F><F label="Sleep Hours"><I value={form.sleepHours} onChange={v=>set("sleepHours",v)} step="0.5"/></F></R>
    <R><F label="Garmin Score"><I value={form.sleepScore} onChange={v=>set("sleepScore",v)} min="0" max="100"/></F><F label={`Energy (${EA[form.energy]||""})`}><I value={form.energy} onChange={v=>set("energy",v)} min="1" max="10"/></F></R>
    <R><F label="Stress"><I value={form.stress} onChange={v=>set("stress",v)}/></F><F label="Mood"><I value={form.mood} onChange={v=>set("mood",v)}/></F></R>
    <F label="Mental"><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{MENTAL.map(m=><Pill key={m} label={m} active={form.mentalState===m} color={m==="Clear"?T.green:T.gold} onClick={()=>set("mentalState",m)}/>)}</div></F>
    <R><F label="Stool Count"><I value={form.stoolCount} onChange={v=>set("stoolCount",v)} min="0" max="25"/></F><F label="Blood"><div style={{display:"flex",gap:3}}>{BLOOD.map((b,i)=><button key={b} onClick={()=>set("bloodLevel",i)} style={{flex:1,padding:"4px",borderRadius:5,fontSize:9,fontWeight:700,cursor:"pointer",border:`1px solid ${form.bloodLevel===i?T.bloodColors[i]:T.border2}`,background:form.bloodLevel===i?T.bloodColors[i]+"20":"transparent",color:form.bloodLevel===i?T.bloodColors[i]:T.dim}}>{b}</button>)}</div></F></R>
    <F label="Consistency"><div style={{display:"flex",gap:3}}>{CONSIST.map(c=><button key={c} onClick={()=>set("consistency",c)} style={{flex:1,padding:"5px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",border:`1px solid ${form.consistency===c?T.gold:T.border2}`,background:form.consistency===c?T.goldDim:"transparent",color:form.consistency===c?T.gold:T.dim}}>{c}</button>)}</div></F>
    <F label="Stool Log"><Tx value={form.stoolLog} onChange={v=>set("stoolLog",v)} placeholder="1: AM solid no blood&#10;2: Noon loose trace" rows={3}/></F>
    <F label="Exercise"><I type="text" value={form.exercise} onChange={v=>set("exercise",v)} placeholder="e.g. 20min walk"/></F>
    <F label="Meals">{["breakfast","lunch","dinner","snacks"].map(m=><I key={m} type="text" value={form[m]} onChange={v=>set(m,v)} placeholder={`${m[0].toUpperCase()}: `} style={{marginBottom:3}}/>)}</F>
    <F label="Hydration Types"><I type="text" value={form.hydrationTypes} onChange={v=>set("hydrationTypes",v)} placeholder="water, bone broth..."/></F>
    <F label="Supplements"><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{SUPPS.map(ss=><Pill key={ss} label={ss} active={form.supplements.includes(ss)} color={T.teal} onClick={()=>set("supplements",form.supplements.includes(ss)?form.supplements.filter(x=>x!==ss):[...form.supplements,ss])}/>)}</div></F>
    <F label="Symptoms"><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{SYMPTOMS.map(ss=><Pill key={ss} label={ss} active={form.symptoms.includes(ss)} color={T.red} onClick={()=>set("symptoms",form.symptoms.includes(ss)?form.symptoms.filter(x=>x!==ss):[...form.symptoms,ss])}/>)}</div></F>
    <F label="Protocol Changes"><Tx value={form.protocolChanges} onChange={v=>set("protocolChanges",v)} placeholder="Blank if none"/></F>
    <button onClick={save} style={{width:"100%",padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",marginTop:6,background:saved?T.green:T.gold,border:"none",color:"#000"}}>{saved?"Saved!":"Save"}</button>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: TIMELINE — with delete and edit
// ═══════════════════════════════════════════════════════════════════════════
function TimelineTab({entries,onSave,onDelete}){
  const [exp,setExp]=useState(null);const [flt,setFlt]=useState("all");const [confirmDel,setConfirmDel]=useState(null);
  const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date));
  const filtered=sorted.filter(e=>{if(flt==="blood")return e.bloodLevel>0;if(flt==="good")return gutScore(e)>=7;if(flt==="bad")return gutScore(e)<4;if(flt==="changes")return e.protocolChanges;return true;});
  function handleDelete(id){onDelete(id);setConfirmDel(null);setExp(null);}
  function handleEdit(e){onSave(e);/* could open editor - for now re-import */}
  return (<div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{[["all","All"],["blood","Blood"],["good","Good (7+)"],["bad","Bad (<4)"],["changes","Changes"]].map(([v,l])=><Pill key={v} label={l} active={flt===v} onClick={()=>setFlt(v)}/>)}<span style={{marginLeft:"auto",color:T.dim,fontSize:11}}>{filtered.length}</span></div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map(e=>{const s=gutScore(e);const open=exp===e.id;const sh=e.sleepHours||0;return (<div key={e.id} style={{background:T.card,border:`1px solid ${open?T.border2:T.border}`,borderRadius:10,overflow:"hidden"}}>
      <button onClick={()=>setExp(open?null:e.id)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
        <SC v={s} size={40}/>
        <div style={{textAlign:"left",flex:1,minWidth:0}}><div style={{color:T.text,fontWeight:700,fontSize:13}}>{fmtD(e.date)}</div><div style={{color:T.sub,fontSize:11}}>{e.stoolCount} stools · <BB level={e.bloodLevel}/> · {e.consistency} · {sh}h · E:{e.energy}</div></div>
        {e.protocolChanges&&<span style={{background:T.goldDim,color:T.gold,borderRadius:8,padding:"2px 8px",fontSize:9,fontWeight:700}}>CHANGE</span>}
        {e.exercise&&<span style={{background:T.blueDim,color:T.blue,borderRadius:8,padding:"2px 8px",fontSize:9,fontWeight:700}}>ACTIVE</span>}
        <span style={{color:T.dim,fontSize:14}}>{open?"▲":"▼"}</span>
      </button>
      {open&&<div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:10,marginBottom:10}}>{[["Sleep",`${sh}h · Garmin: ${e.sleepScore||"—"}`,T.teal],["Energy",`${e.energy}/10 · ${EA[e.energy]||""}`,T.purple],["Stress",`${e.stress}/10`,T.red],["Mental",e.mentalState||"—",T.blue]].map(([l,v,c])=><div key={l} style={{background:T.surface,borderRadius:8,padding:8}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:3}}>{l}</div><div style={{color:c,fontSize:11,fontWeight:600}}>{v}</div></div>)}</div>
        {e.stoolLog&&<div style={{background:T.surface,borderRadius:8,padding:8,marginBottom:8}}><div style={{color:T.dim,fontSize:9,marginBottom:3}}>STOOL LOG</div><div style={{color:T.text,fontSize:11,whiteSpace:"pre-wrap"}}>{e.stoolLog}</div></div>}
        {e.exercise&&<div style={{background:T.blueDim,borderRadius:8,padding:"6px 10px",marginBottom:8}}><span style={{color:T.blue,fontSize:10,fontWeight:700}}>EXERCISE </span><span style={{color:T.text,fontSize:11}}>{e.exercise}</span></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>{["breakfast","lunch","dinner","snacks"].filter(m=>e[m]).map(m=><div key={m} style={{background:T.surface,borderRadius:8,padding:8}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:3}}>{m}</div><div style={{color:T.text,fontSize:11}}>{e[m]}</div></div>)}</div>
        {e.hydrationTypes&&<div style={{marginBottom:8,fontSize:11}}><span style={{color:T.blue,fontWeight:700,fontSize:10}}>HYDRATION </span><span style={{color:T.text}}>{e.hydrationTypes}</span></div>}
        {e.supplements.length>0&&<div style={{marginBottom:8,display:"flex",flexWrap:"wrap",gap:3}}>{e.supplements.map(ss=><span key={ss} style={{background:T.tealDim,color:T.teal,borderRadius:10,padding:"2px 8px",fontSize:10}}>{ss}</span>)}</div>}
        {e.symptoms.length>0&&<div style={{marginBottom:8,display:"flex",flexWrap:"wrap",gap:3}}>{e.symptoms.map(ss=><span key={ss} style={{background:T.redDim,color:T.red,borderRadius:10,padding:"2px 8px",fontSize:10}}>{ss}</span>)}</div>}
        {e.protocolChanges&&<div style={{background:T.goldDim,borderRadius:8,padding:"6px 10px",marginBottom:8}}><span style={{color:T.gold,fontSize:10,fontWeight:700}}>PROTOCOL </span><span style={{color:T.text,fontSize:11}}>{e.protocolChanges}</span></div>}
        {/* Delete button */}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
          {confirmDel===e.id?(<><button onClick={()=>handleDelete(e.id)} style={{padding:"6px 16px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",background:T.red,border:"none",color:"#fff"}}>Confirm Delete</button><button onClick={()=>setConfirmDel(null)} style={{padding:"6px 16px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:"transparent",border:`1px solid ${T.border2}`,color:T.sub}}>Cancel</button></>):(<button onClick={()=>setConfirmDel(e.id)} style={{padding:"6px 16px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:"transparent",border:`1px solid ${T.redBorder}`,color:T.red}}>Delete Entry</button>)}
        </div>
      </div>}
    </div>);})}</div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: SUMMARIES
// ═══════════════════════════════════════════════════════════════════════════
function SummaryTab({entries}){
  const [view,setView]=useState("weekly");const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  const grouped=useMemo(()=>{const g={};sorted.forEach(e=>{const k=view==="weekly"?weekOf(e.date):monthOf(e.date);if(!g[k])g[k]=[];g[k].push(e);});return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));},[sorted,view]);
  function summarize(ents){const n=ents.length;const avg=(fn)=>(ents.reduce((a,e)=>a+fn(e),0)/n).toFixed(1);const bf=ents.filter(e=>e.bloodLevel===0).length;const fp=Math.round(ents.filter(e=>e.consistency==="Formed").length/n*100);const allSym={};ents.forEach(e=>e.symptoms.forEach(s=>{allSym[s]=(allSym[s]||0)+1;}));const topSym=Object.entries(allSym).sort((a,b)=>b[1]-a[1]).slice(0,5);const changes=ents.filter(e=>e.protocolChanges).map(e=>({date:e.date,change:e.protocolChanges}));return{n,avgScore:avg(gutScore),avgStools:avg(e=>e.stoolCount),avgSleep:avg(e=>e.sleepHours||0),avgEnergy:avg(e=>e.energy),bf,fp,topSym,changes};}
  function pLabel(k){if(view==="weekly"){const d=new Date(k+"T12:00:00");const end=new Date(d);end.setDate(end.getDate()+6);return`${fmtS(k)} – ${fmtS(end.toISOString().split("T")[0])}`;}const[y,m]=k.split("-");return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${y}`;}
  const td=[...grouped].reverse().map(([k,ents])=>{const s=summarize(ents);return{period:view==="weekly"?fmtS(k):pLabel(k),Score:parseFloat(s.avgScore),Stools:parseFloat(s.avgStools)};});
  return (<div>
    <div style={{display:"flex",gap:6,marginBottom:16}}><Pill label="Weekly" active={view==="weekly"} onClick={()=>setView("weekly")}/><Pill label="Monthly" active={view==="monthly"} onClick={()=>setView("monthly")}/></div>
    <Card style={{marginBottom:16}}><Lbl>{view==="weekly"?"Weekly":"Monthly"} Score Trend</Lbl><ResponsiveContainer width="100%" height={140}><ComposedChart data={td} margin={{top:5,right:5,bottom:0,left:-20}}><XAxis dataKey="period" tick={{fill:T.dim,fontSize:8}} interval={view==="weekly"?"preserveStartEnd":0}/><YAxis domain={[0,10]} tick={{fill:T.dim,fontSize:9}}/><Tooltip content={<Tip/>}/><ReferenceLine y={7} stroke={T.green} strokeDasharray="3 3" opacity={.3}/><Bar dataKey="Stools" fill={T.blue+"44"} radius={[2,2,0,0]}/><Line type="monotone" dataKey="Score" stroke={T.gold} strokeWidth={2} dot={{r:3,fill:T.gold}}/></ComposedChart></ResponsiveContainer></Card>
    {grouped.map(([key,ents])=>{const s=summarize(ents);const sc=parseFloat(s.avgScore);const insights=generateInsights(ents,sorted);return (<Card key={key} style={{marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}><SC v={sc} size={48}/><div style={{flex:1}}><div style={{color:T.text,fontWeight:700,fontSize:14}}>{pLabel(key)}</div><div style={{color:T.sub,fontSize:11}}>{s.n} entries</div></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:10}}>{[["Score",s.avgScore,sColor(sc)],["Stools",s.avgStools,parseFloat(s.avgStools)<=3.5?T.green:T.gold],["Sleep",s.avgSleep+"h",parseFloat(s.avgSleep)>=7.5?T.green:T.gold],["Energy",s.avgEnergy,parseFloat(s.avgEnergy)>=7?T.green:T.gold],["Blood-Free",`${s.bf}/${s.n}`,T.teal],["Formed",`${s.fp}%`,s.fp>=60?T.green:T.gold]].map(([l,v,c])=><div key={l} style={{background:T.surface,borderRadius:8,padding:"8px 6px",textAlign:"center"}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:3}}>{l}</div><div style={{color:c,fontWeight:800,fontSize:15}}>{v}</div></div>)}</div>
      {insights.length>0&&<div style={{marginBottom:8}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:4}}>Auto Insights</div>{insights.slice(0,3).map((ins,i)=><IB key={i} insight={ins}/>)}</div>}
      {s.topSym.length>0&&<div style={{marginBottom:8}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:4}}>Top Symptoms</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{s.topSym.map(([sym,ct])=><span key={sym} style={{background:T.redDim,color:T.red,borderRadius:10,padding:"2px 8px",fontSize:10}}>{sym} ({ct})</span>)}</div></div>}
      {s.changes.length>0&&<div><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:4}}>Protocol Changes</div>{s.changes.map(c=><div key={c.date} style={{background:T.goldDim,borderRadius:6,padding:"4px 8px",marginBottom:3,fontSize:10}}><span style={{color:T.gold,fontWeight:700}}>{fmtS(c.date)} </span><span style={{color:T.text}}>{c.change}</span></div>)}</div>}
    </Card>);})}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════
function ProtocolTab({entries}){
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  const stl=useMemo(()=>{const t={};sorted.forEach(e=>{e.supplements.forEach(s=>{if(!t[s])t[s]={first:e.date,last:e.date,days:0};t[s].last=e.date;t[s].days++;});});return Object.entries(t).sort((a,b)=>b[1].days-a[1].days);},[sorted]);
  const changes=sorted.filter(e=>e.protocolChanges).map(e=>({date:e.date,change:e.protocolChanges,score:gutScore(e),bl:e.bloodLevel}));
  const RX=[{n:"Zinc Carnosine",r:"Increased blood",v:"avoid"},{n:"Pure Silver",r:"Loose stools, blood",v:"avoid"},{n:"Microcidin",r:"Loose stools, blood",v:"avoid"},{n:"Probiotics",r:"Loose stools, blood",v:"avoid"},{n:"NAC",r:"Crash after benefit",v:"avoid"},{n:"NAG",r:"Water into colon",v:"avoid"},{n:"Qing Dai high dose",r:"Cramps, foul gas",v:"caution"},{n:"Vitamin D3+K2 high",r:"Joint aches, motility",v:"caution"}];
  const SAFE=[{n:"MAG+",d:"400-500mg nightly."},{n:"SPM Supreme / Curcumin",d:"Anti-inflammatory."},{n:"Mezavant",d:"Pharma baseline."},{n:"Salofalk",d:"Current."},{n:"Glycine",d:"2-3g night."},{n:"Sodium Butyrate",d:"Colonocyte fuel."},{n:"Slippery Elm",d:"Mucosal coating."},{n:"B Complex",d:"Energy."},{n:"Glutamine",d:"5-10g repair."}];
  return (<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div>
      <Card style={{marginBottom:12}}><Lbl>Current Protocol</Lbl><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{CUR_PROTOCOL.map(s=><span key={s} style={{background:T.tealDim,color:T.teal,border:`1px solid ${T.tealBorder}`,borderRadius:12,padding:"4px 12px",fontSize:12,fontWeight:600}}>{s}</span>)}</div></Card>
      <Card style={{marginBottom:12}}><Lbl>Change Log</Lbl>{changes.length===0?<div style={{color:T.dim,fontSize:12}}>No changes yet.</div>:changes.slice().reverse().map(c=><div key={c.date} style={{display:"flex",gap:10,marginBottom:10}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}><div style={{width:8,height:8,borderRadius:"50%",background:T.gold,marginTop:3}}/><div style={{width:1,flex:1,background:T.border,marginTop:3}}/></div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.gold,fontSize:11,fontWeight:700}}>{fmtD(c.date)}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><BB level={c.bl}/><SC v={c.score} size={28}/></div></div><div style={{color:T.text,fontSize:12,marginTop:3}}>{c.change}</div></div></div>)}</Card>
      <Card><Lbl>Supplement Timeline</Lbl>{stl.map(([name,data])=><div key={name} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.teal,fontSize:12,fontWeight:700}}>{name}</span><span style={{color:T.dim,fontSize:10}}>{data.days}d</span></div><div style={{color:T.sub,fontSize:10,marginTop:2}}>{fmtS(data.first)} → {fmtS(data.last)}</div></div>)}</Card>
    </div>
    <div>
      <Card style={{marginBottom:12}}><Lbl>Known Reactions</Lbl><div style={{background:T.goldDim,border:`1px solid ${T.goldBorder}`,borderRadius:8,padding:10,marginBottom:10}}><div style={{color:T.gold,fontSize:11,fontWeight:700,marginBottom:4}}>Core Pattern</div><div style={{color:T.text,fontSize:11,lineHeight:1.6}}>Hyper-reactive mucosal immune system. Tolerates fuel. Reacts to microbiome shifters, immune modulators, ion-channel compounds.</div></div>{RX.map(r=><div key={r.n} style={{display:"flex",gap:8,marginBottom:8}}><span style={{background:r.v==="avoid"?T.redDim:T.goldDim,color:r.v==="avoid"?T.red:T.gold,borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:700,flexShrink:0,marginTop:1}}>{r.v==="avoid"?"AVOID":"CAUTION"}</span><div><div style={{color:T.text,fontSize:11,fontWeight:700}}>{r.n}</div><div style={{color:T.sub,fontSize:10}}>{r.r}</div></div></div>)}</Card>
      <Card><Lbl>Safe & Effective</Lbl>{SAFE.map(s=><div key={s.n} style={{marginBottom:6}}><div style={{color:T.green,fontSize:11,fontWeight:700}}>{s.n}</div><div style={{color:T.sub,fontSize:10}}>{s.d}</div></div>)}</Card>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: INSIGHTS — with symptom heatmap and AM/PM pattern
// ═══════════════════════════════════════════════════════════════════════════
function InsightsTab({entries}){
  const TR=[{f:"Sweet Potato",s:3,n:"Dec 25+Mar 9: colon tightness"},{f:"Crab Apples",s:3,n:"Dec 25: high pectin"},{f:"Smoothies",s:2,n:"Mar 9: bloating"},{f:"Pepper / garlic",s:1,n:"Jan 9: minor"},{f:"Dairy",s:2,n:"Excluded early"},{f:"Fermented foods",s:2,n:"Mast cell reactivity"}];
  const SF=[{f:"Ground beef + glycine",n:"Crisis core."},{f:"Bone broth",n:"Gut lining."},{f:"Eggs + ghee",n:"Stable breakfast."},{f:"Banana / mango",n:"Low-irritation."},{f:"Marshmallow root",n:"Pelvic tension."},{f:"Slippery elm",n:"Liquid bandage."},{f:"Squash + carrots",n:"Tolerated veg."}];
  const TL=[{d:"Apr–May 2025",p:"Flare Inception",c:T.red,n:"Peru. First blood."},{d:"Sep 2025",p:"Mid-Flare",c:T.gold,n:"NY weekend."},{d:"Dec 2025",p:"Christmas",c:T.red,n:"Sweet potato."},{d:"Jan 2026",p:"Stabilization",c:T.gold,n:"Jan 12 best day."},{d:"Feb 12",p:"Peak Crisis",c:"#a02828",n:"20+ bloody trips."},{d:"Feb–Mar",p:"Reconstruction",c:T.gold,n:"20→2/day."},{d:"Mar 10",p:"Current",c:T.teal,n:"Zero tension."}];

  // Symptom heatmap
  const heatmap=buildSymptomHeatmap(entries);
  const maxCount=heatmap.length>0?heatmap[0][1].count:1;

  // AM vs PM pattern
  const stoolPattern=analyzeStoolPatterns(entries);

  return (<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div>
      {/* Symptom Heatmap */}
      <Card style={{marginBottom:12}}>
        <Lbl>Symptom Frequency (last 30 entries)</Lbl>
        {heatmap.length===0?<div style={{color:T.dim,fontSize:12}}>No symptom data yet.</div>:heatmap.map(([sym,data])=>{
          const pct=Math.round(data.count/maxCount*100);
          return (<div key={sym} style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{color:T.text,fontSize:11}}>{sym}</span><span style={{color:T.red,fontSize:11,fontWeight:700}}>{data.count}x</span></div>
            <div style={{height:6,background:T.surface,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:T.red,borderRadius:3,transition:"width .3s"}}/></div>
          </div>);
        })}
      </Card>

      {/* AM vs PM stool pattern */}
      <Card style={{marginBottom:12}}>
        <Lbl>Morning vs Evening Stool Pattern</Lbl>
        {stoolPattern.total===0?<div style={{color:T.dim,fontSize:12}}>Log stool timestamps (AM/Eve) to see patterns.</div>:(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:8}}>
              <div style={{background:T.surface,borderRadius:8,padding:12,textAlign:"center"}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:4}}>Morning</div><div style={{display:"flex",justifyContent:"center",gap:12}}><div><div style={{color:T.green,fontWeight:800,fontSize:20}}>{stoolPattern.amFormed}</div><div style={{color:T.dim,fontSize:9}}>Formed</div></div><div><div style={{color:T.red,fontWeight:800,fontSize:20}}>{stoolPattern.amLoose}</div><div style={{color:T.dim,fontSize:9}}>Loose</div></div></div></div>
              <div style={{background:T.surface,borderRadius:8,padding:12,textAlign:"center"}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase",marginBottom:4}}>Evening</div><div style={{display:"flex",justifyContent:"center",gap:12}}><div><div style={{color:T.green,fontWeight:800,fontSize:20}}>{stoolPattern.pmFormed}</div><div style={{color:T.dim,fontSize:9}}>Formed</div></div><div><div style={{color:T.red,fontWeight:800,fontSize:20}}>{stoolPattern.pmLoose}</div><div style={{color:T.dim,fontSize:9}}>Loose</div></div></div></div>
            </div>
            {stoolPattern.pmLoose>stoolPattern.amLoose&&<div style={{background:T.redDim,borderRadius:8,padding:"6px 10px",fontSize:11,color:T.text}}>Pattern: evening stools more frequently loose than morning. This is consistent with your historical data.</div>}
          </div>
        )}
      </Card>

      <Card style={{marginBottom:12}}><Lbl>Food Triggers</Lbl>{TR.map(t=><div key={t.f} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:T.text,fontWeight:700,fontSize:12}}>{t.f}</span><div style={{display:"flex",gap:2}}>{[...Array(3)].map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<t.s?T.red:T.dim}}/>)}</div></div><div style={{color:T.sub,fontSize:10}}>{t.n}</div></div>)}</Card>
      <Card><Lbl>Safe Foods</Lbl>{SF.map(f=><div key={f.f} style={{marginBottom:6}}><div style={{color:T.green,fontSize:12,fontWeight:700}}>{f.f}</div><div style={{color:T.sub,fontSize:10}}>{f.n}</div></div>)}</Card>
    </div>
    <div>
      <Card style={{marginBottom:12}}><Lbl>Gut Score Formula</Lbl><div style={{color:T.text,fontSize:12,lineHeight:1.8}}>Starts at 10:<br/><span style={{color:T.gold,fontWeight:700}}>1. Consistency</span> Formed:0 · Mixed:-1.2 · Loose:-2.5 · Watery:-4<br/><span style={{color:T.red,fontWeight:700}}>2. Blood</span> None:0 · Trace:-1 · Mild:-2 · Heavy:-3.5 · Severe:-5<br/><span style={{color:T.purple,fontWeight:700}}>3. Symptoms</span> -0.3 each (max -2.5)<br/><span style={{color:T.blue,fontWeight:700}}>4. Stools</span> -0.2 per above 3</div></Card>
      <Card style={{marginBottom:12}}><Lbl>Flare Timeline</Lbl>{TL.map(t=><div key={t.d} style={{display:"flex",gap:10,marginBottom:10}}><div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}><div style={{width:9,height:9,borderRadius:"50%",background:t.c,marginTop:2}}/><div style={{width:1,flex:1,background:T.border,marginTop:3}}/></div><div><div style={{color:t.c,fontSize:10,fontWeight:700}}>{t.d}</div><div style={{color:T.text,fontSize:12,fontWeight:700,marginBottom:2}}>{t.p}</div><div style={{color:T.sub,fontSize:10}}>{t.n}</div></div></div>)}</Card>
      <Card style={{marginBottom:12}}><Lbl>Stress → Symptom Lag</Lbl><div style={{color:T.text,fontSize:12,lineHeight:1.7}}>Stress events precede flares by 1-3 days. Auto-detected in weekly summaries.</div></Card>
      <Card><Lbl>Energy Scale</Lbl><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{Object.entries(EA).map(([k,v])=><div key={k} style={{display:"flex",gap:8,padding:"3px 0"}}><span style={{color:parseInt(k)>=7?T.green:parseInt(k)>=5?T.gold:T.red,fontWeight:700,fontSize:12,width:16}}>{k}</span><span style={{color:T.sub,fontSize:11}}>{v}</span></div>)}</div></Card>
    </div>
  </div>);
}

// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const TABS=[{id:"overview",label:"Overview",icon:"◆"},{id:"import",label:"Import",icon:"📋"},{id:"timeline",label:"Timeline",icon:"📅"},{id:"summary",label:"Summaries",icon:"📊"},{id:"protocol",label:"Protocol",icon:"💊"},{id:"insights",label:"Insights",icon:"🔬"}];

export default function App(){
  const [tab,setTab]=useState("overview");const [entries,setEntries]=useState([]);const [loaded,setLoaded]=useState(false);

  useEffect(()=>{async function load(){
    try{const r=LS.get("colitis-v5");if(r)setEntries(JSON.parse(r));else{LS.set("colitis-v5",JSON.stringify(SEED));setEntries(SEED);}}catch{setEntries(SEED);}
    setLoaded(true);}load();},[]);

  async function handleSave(entry){const updated=[...entries.filter(e=>e.id!==entry.id),entry].sort((a,b)=>a.date.localeCompare(b.date));setEntries(updated);try{LS.set("colitis-v5",JSON.stringify(updated));}catch{}}
  async function handleDelete(id){const updated=entries.filter(e=>e.id!==id);setEntries(updated);try{LS.set("colitis-v5",JSON.stringify(updated));}catch{}}

  // JSON export
  function exportData(){
    const data=JSON.stringify({entries,exportDate:today()},null,2);
    const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`gut-tracker-export-${today()}.json`;a.click();URL.revokeObjectURL(url);
  }

  const latest=entries.length?[...entries].sort((a,b)=>b.date.localeCompare(a.date))[0]:null;const ls=latest?gutScore(latest):null;

  return (<div style={{background:T.bg,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,-apple-system,sans-serif",color:T.text}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:${T.bg};}::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}textarea,input{outline:none;}textarea:focus,input:focus{border-color:${T.gold}!important;}`}</style>
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1260,margin:"0 auto",display:"flex",alignItems:"center",height:56,padding:"0 24px",gap:12}}>
        <div style={{marginRight:"auto"}}><div style={{fontWeight:800,fontSize:16,color:T.text}}><span style={{color:T.gold}}>◆</span> Gut Tracker</div><div style={{color:T.dim,fontSize:10}}>Since Apr 2025</div></div>
        {ls!==null&&<div style={{display:"flex",alignItems:"center",gap:8,marginRight:12,paddingRight:12,borderRight:`1px solid ${T.border}`}}><div style={{textAlign:"right"}}><div style={{color:T.dim,fontSize:9,textTransform:"uppercase"}}>Latest</div><div style={{color:sColor(ls),fontWeight:800,fontSize:20}}>{ls}<span style={{fontSize:11,opacity:.6}}>/10</span></div></div></div>}
        <button onClick={exportData} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",background:"transparent",border:`1px solid ${T.border2}`,color:T.sub,marginRight:4}} title="Export all data as JSON">💾 Export</button>
        <div style={{display:"flex",gap:2}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${tab===t.id?T.gold:"transparent"}`,background:tab===t.id?T.goldDim:"transparent",color:tab===t.id?T.gold:T.sub,transition:"all .15s",whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>)}</div>
      </div>
    </div>
    <div style={{maxWidth:1260,margin:"0 auto",padding:"20px 24px"}}>{!loaded?<div style={{textAlign:"center",padding:80,color:T.sub}}>Loading...</div>:<>
      {tab==="overview"&&<OverviewTab entries={entries}/>}
      {tab==="import"&&<ImportTab entries={entries} onSave={handleSave}/>}
      {tab==="timeline"&&<TimelineTab entries={entries} onSave={handleSave} onDelete={handleDelete}/>}
      {tab==="summary"&&<SummaryTab entries={entries}/>}
      {tab==="protocol"&&<ProtocolTab entries={entries}/>}
      {tab==="insights"&&<InsightsTab entries={entries}/>}
    </>}</div>
  </div>);
}
