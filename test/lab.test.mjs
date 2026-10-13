import {test} from "node:test";
import assert from "node:assert/strict";
import {graph,route,teleport,shortestPath} from "../src/lab.mjs";
test("adjacent gates require no swaps",()=>assert.equal(route([[0,1]],4).swaps,0));
test("corner gate uses shortest path minus the final adjacent edge",()=>assert.equal(route([[0,15]],4).swaps,5));
test("unreachable gates fail rather than inventing a route",()=>assert.throws(()=>route([[0,15]],4,[[0,1],[0,4]]),/No connected route/));
test("invalid inputs rejected",()=>{assert.throws(()=>route([[0,0]]));assert.throws(()=>route([[0,99]]));assert.throws(()=>graph(1));assert.throws(()=>teleport(NaN,0));});
test("all graph links are symmetric",()=>{const g=graph();g.forEach((ns,a)=>ns.forEach(b=>assert.ok(g[b].includes(a))));});
test("BFS returns a minimum-hop path",()=>assert.equal(shortestPath(graph(),0,15).length,7));
test("100 deterministic circuits preserve permutation and physical adjacency",()=>{
 let seed=19;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed%16;};
 for(let trial=0;trial<100;trial++){
  const gates=[];for(let j=0;j<20;j++){const a=rnd();let b=rnd();if(a===b)b=(b+1)%16;gates.push([a,b]);}
  let mapping=Array.from({length:16},(_,i)=>i);const edges=graph();
  for(const event of route(gates).events){
   const [p,q]=event.physical;assert.ok(edges[p].includes(q));
   if(event.kind==="swap"){[mapping[p],mapping[q]]=[mapping[q],mapping[p]];}
   else assert.deepEqual([mapping[p],mapping[q]],event.logical);
   assert.deepEqual(mapping,event.mapping);assert.equal(new Set(mapping).size,16);
  }
 }
});
test("teleportation corrects all four outcomes for 121 arbitrary complex states",()=>{
 for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){
  const result=teleport(i*Math.PI/10,j*2*Math.PI/10);
  assert.equal(result.branches.length,4);
  for(const b of result.branches){assert.ok(Math.abs(b.probability-.25)<1e-12);assert.ok(Math.abs(b.fidelity-1)<1e-12);}
 }
});
