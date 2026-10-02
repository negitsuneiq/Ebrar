import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import worker from '../dist/server/server.js';
const root=path.resolve('dist/client');
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://127.0.0.1:4173');
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(file.startsWith(root+'/')){try{if((await stat(file)).isFile()){const ext=path.extname(file);const mime={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};res.setHeader('Content-Type',mime[ext]||'application/octet-stream');res.end(await readFile(file));return}}catch{}}
 const response=await worker.fetch(new Request(url,{method:req.method}),{},{});
 res.writeHead(response.status,Object.fromEntries(response.headers));
 res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);res.statusCode=500;res.end(String(e))}
}).listen(4173,'0.0.0.0',()=>console.log('Matris local production preview:4173'));
