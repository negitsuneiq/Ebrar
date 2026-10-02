import "./lib/error-capture";
import {applySecurityHeaders} from "./lib/security-headers.server";

export default {async fetch(request:Request,env:unknown,ctx:unknown){
 try{
 const u=new URL(request.url);let response:Response;
 if(u.pathname==="/robots.txt")response=new Response("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: "+u.origin+"/sitemap.xml");
 else if(u.pathname==="/sitemap.xml")response=new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+u.origin+'/</loc></url></urlset>',{headers:{"Content-Type":"application/xml"}});
 else if(u.pathname.startsWith("/api/"))response=new Response("Not found",{status:404});
 else {const m=await import("@tanstack/react-start/server-entry");response=await (m.default as unknown as {fetch:(r:Request,e:unknown,c:unknown)=>Promise<Response>}).fetch(request,env,ctx);}
 return applySecurityHeaders(response);
 }catch(error){console.error(error);return applySecurityHeaders(new Response("Sayfa açılamadı. Lütfen yeniden dene.",{status:500}));}
}};