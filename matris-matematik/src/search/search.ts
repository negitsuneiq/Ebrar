import {universities} from "./universities";
export type Resource={id:string;title:string;university:string;kind:"Lecture notes"|"Open book"|"Problem set";subject:string;url:string;sourceUrl:string;author:string;description:string;tags:string[];format:string;checked:string;language?:"tr"|"en";level?:string;year?:string;sourceLicense?:string;sourceLicenseUrl?:string;termsUrl?:string};
export const normalize=(s:string)=>s.toLowerCase().replace(/ı/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const aliases:Record<string,string>={pde:"partial differential equations",ode:"ordinary differential equations",sde:"stochastic differential equations",linalg:"linear algebra",calc:"calculus",stats:"statistics",prob:"probability",foag:"foundations of algebraic geometry"};
const stem=(s:string)=>s==="matrices"?"matrix":s==="eigenvalues"?"eigenvalue":s.endsWith("ies")?s.slice(0,-3)+"y":s.length>4&&s.endsWith("s")&&!s.endsWith("ss")&&!s.endsWith("sis")?s.slice(0,-1):s;
const words=(s:string)=>normalize(s).split(" ").filter(Boolean).map(stem);
export function scoreResource(r:Resource,q:string):number{
 if(!q.trim())return 1;
 const query=normalize(q).split(" ").map(t=>aliases[t]||t).join(" ");
 const terms=words(query).filter(t=>!["the","a","an","of","and","in","to","for","on"].includes(t));
 if(!terms.length)return 1;
 const uni=universities.find(u=>u.id===r.university);
 const fields:[string,number][]=[[r.title,18],[r.tags.join(" "),10],[r.subject,7],[r.author,8],[(uni?.name||"")+" "+(uni?.short||"")+" "+r.university,12],[r.kind,6],[r.description,3]];
 const prepared=fields.map(([s,w])=>({tokens:words(s),weight:w}));
 let score=normalize(r.title).includes(query)?36:0;
 for(const t of terms){let best=0;for(const f of prepared){if(f.tokens.some(w=>w===t||(t.length>=4&&w.startsWith(t))))best=Math.max(best,f.weight)}if(!best)return 0;score+=best}
 return score;
}
export function isTrustedResource(r:Resource){try{const u=new URL(r.url);return /^https?:$/.test(u.protocol)&&!!r.title.trim()&&universities.some(x=>x.id===r.university)}catch{return false}}
