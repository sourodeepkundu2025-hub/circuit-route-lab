import {route,teleport} from "./src/lab.mjs";
const $=id=>document.getElementById(id);
let result=null, cursor=-1, timer=null;
function stop(){clearInterval(timer);timer=null;$("play").textContent="Play";}
function render(){
 const map=cursor<0?Array.from({length:16},(_,i)=>i):result.events[cursor].mapping;
 $("mesh").replaceChildren(...map.map((q,p)=>{const tile=document.createElement("div");tile.className="tile"+(result?.events[cursor]?.physical.includes(p)?" active":"");const small=document.createElement("small");small.textContent="SITE "+p;const b=document.createElement("b");b.textContent="q"+q;tile.append(small,b);return tile;}));
 $("events").replaceChildren(...(result?.events??[]).map((event,i)=>{const li=document.createElement("li");li.textContent=event.kind.toUpperCase()+" "+event.physical.join(" ↔ ")+" / logical "+event.logical.join(",");if(i===cursor)li.className="active";return li;}));
 $("step").disabled=!result||cursor>=result.events.length-1;
 $("route-status").textContent=cursor<0?"Initial mapping. Ready to step.":"Operation "+(cursor+1)+"/"+result.events.length+" · "+result.events[cursor].kind;
}
function compile(){stop();try{
 const parts=$("gates").value.split(";").filter(v=>v.trim()).map(v=>v.trim().split(","));
 if(parts.some(pair=>pair.some(value=>!value.trim())))throw new Error("Each gate needs two explicit logical qubit numbers.");
 const raw=parts.map(pair=>pair.map(n=>Number(n.trim())));
 if(!raw.length||raw.some(g=>g.length!==2))throw new Error("Enter pairs such as 0,15; 3,12.");
 result=route(raw);cursor=-1;$("count").textContent=result.swaps+" SWAPs";render();
 }catch(error){result=null;cursor=-1;render();$("route-status").textContent=error.message;}}
function step(){if(result&&cursor<result.events.length-1){cursor++;render();}else stop();}
$("compile").onclick=compile;$("step").onclick=()=>{stop();step();};$("reset").onclick=()=>{stop();cursor=-1;render();};
$("play").onclick=()=>{if(timer){stop();return;}if(!result)return;if(cursor>=result.events.length-1)cursor=-1;$("play").textContent="Pause";timer=setInterval(()=>{step();if(cursor>=result.events.length-1)stop();},matchMedia("(prefers-reduced-motion: reduce)").matches?1200:700);};
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
function showState(){const theta=Number($("theta").value),phi=Number($("phi").value);$("theta-value").textContent=theta+"°";$("phi-value").textContent=phi+"°";
 $("outcomes").replaceChildren(...teleport(theta*Math.PI/180,phi*Math.PI/180).branches.map(branch=>{const card=document.createElement("div");card.className="outcome";const title=document.createElement("b");title.textContent=branch.measurement.join("");const text=document.createElement("span");text.textContent="Correction "+branch.correction+" · p="+branch.probability.toFixed(2)+" · fidelity="+branch.fidelity.toFixed(6);card.append(title,text);return card;}));}
$("theta").oninput=showState;$("phi").oninput=showState;compile();showState();
