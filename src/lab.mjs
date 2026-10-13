// Original educational reference: ideal protocol math and a deterministic routing baseline.
export function graph(size = 4, blocked = []) {
  if (!Number.isInteger(size) || size < 2 || size > 8) throw new Error("Grid size must be 2..8.");
  const missing = new Set(blocked.map(([a,b]) => [Math.min(a,b),Math.max(a,b)].join(":")));
  return Array.from({length:size*size}, (_,a) => {
    const x=a%size, y=Math.floor(a/size), adjacent=[];
    if(x>0) adjacent.push(a-1); if(x<size-1) adjacent.push(a+1);
    if(y>0) adjacent.push(a-size); if(y<size-1) adjacent.push(a+size);
    return adjacent.filter(b=>!missing.has([Math.min(a,b),Math.max(a,b)].join(":")));
  });
}
export function shortestPath(edges, start, goal) {
  const queue=[[start]], visited=new Set([start]);
  while(queue.length) {
    const path=queue.shift(), last=path.at(-1);
    if(last===goal) return path;
    for(const node of edges[last]??[]) if(!visited.has(node)){ visited.add(node); queue.push([...path,node]); }
  }
  throw new Error("No connected route between the requested physical sites.");
}
export function route(gates, size=4, blocked=[]) {
  const edges=graph(size,blocked), mapping=edges.map((_,i)=>i), events=[];
  for(const [a,b] of gates) {
    if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>=edges.length||b>=edges.length) throw new Error("Invalid logical gate.");
    const path=shortestPath(edges,mapping.indexOf(a),mapping.indexOf(b));
    for(let i=0;i<path.length-2;i++) {
      const p=path[i], q=path[i+1]; [mapping[p],mapping[q]]=[mapping[q],mapping[p]];
      events.push({kind:"swap",physical:[p,q],mapping:[...mapping],logical:[a,b]});
    }
    events.push({kind:"gate",physical:[mapping.indexOf(a),mapping.indexOf(b)],mapping:[...mapping],logical:[a,b]});
  }
  return {size,gates,events,swaps:events.filter(e=>e.kind==="swap").length,mapping};
}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], scale=(a,s)=>[a[0]*s,a[1]*s];
const abs2=a=>a[0]*a[0]+a[1]*a[1];
function h(state,q) {
  const output=state.map(()=>[0,0]), mask=1<<q;
  for(let i=0;i<8;i++) {
    const base=i&~mask;
    output[i]=scale(add(state[base],scale(state[base|mask], i&mask?-1:1)),1/Math.sqrt(2));
  }
  return output;
}
function cx(state,c,t) {
  const output=state.map(()=>[0,0]);
  for(let i=0;i<8;i++) output[(i&(1<<c))?i^(1<<t):i]=state[i];
  return output;
}
export function teleport(theta,phi) {
  if(!Number.isFinite(theta)||!Number.isFinite(phi)) throw new Error("Angles must be finite.");
  // Little endian: q0=input, q1=Alice's EPR half, q2=Bob's EPR half.
  const input=[[Math.cos(theta/2),0],[Math.sin(theta/2)*Math.cos(phi),Math.sin(theta/2)*Math.sin(phi)]];
  let state=Array.from({length:8},()=>[0,0]); state[0]=input[0]; state[1]=input[1];
  state=cx(h(state,1),1,2); // Bell pair
  state=h(cx(state,0,1),0); // Bell-basis measurement circuit
  const branches=[];
  for(let m0=0;m0<2;m0++) for(let m1=0;m1<2;m1++) {
    const base=m0+(m1<<1), pair=[state[base],state[base+4]];
    const probability=pair.reduce((sum,a)=>sum+abs2(a),0);
    let bob=pair.map(a=>scale(a,1/Math.sqrt(probability)));
    if(m1) bob=[bob[1],bob[0]]; // conditional X
    if(m0) bob=[bob[0],scale(bob[1],-1)]; // conditional Z
    const inner=[input[0][0]*bob[0][0]+input[0][1]*bob[0][1]+input[1][0]*bob[1][0]+input[1][1]*bob[1][1],
      input[0][0]*bob[0][1]-input[0][1]*bob[0][0]+input[1][0]*bob[1][1]-input[1][1]*bob[1][0]];
    branches.push({measurement:[m0,m1],probability,correction:(m1?"X":"")+(m0?"Z":"" )||"I",bob,fidelity:abs2(inner)});
  }
  return {input,branches};
}
