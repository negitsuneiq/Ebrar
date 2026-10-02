import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {Outlet,createRootRouteWithContext,HeadContent,Scripts} from "@tanstack/react-router";
import {type ReactNode} from "react";
import css from "../styles.css?url";

import meta from "../app-meta.json";
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({
 head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1"},{title:meta.og_title},{name:"description",content:meta.og_description},{property:"og:title",content:meta.og_title},{property:"og:description",content:meta.og_description},{property:"og:image",content:meta.og_image_url},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:title",content:meta.og_title},{name:"twitter:description",content:meta.og_description},{name:"twitter:image",content:meta.og_image_url},{name:"theme-color",content:"#0c1321"}],links:[{rel:"stylesheet",href:css},{rel:"icon",href:"/favicon.svg"},{rel:"apple-touch-icon",href:"/apple-touch-icon.png"},{rel:"manifest",href:"/site.webmanifest"},{rel:"canonical",href:"https://matris-matematik.higgsfield.app/"}]}),
 shellComponent:({children}:{children:ReactNode})=><html lang="tr"><head><HeadContent/></head><body>{children}<Scripts/></body></html>,
 component:Root,
 notFoundComponent:()=> <main className="empty"><h1>Bu sayfa bulunamadı.</h1><a href="/">Kaynak aramaya dön</a></main>,
 errorComponent:()=> <main className="empty"><h1>Sayfa yüklenemedi.</h1><a href="/">Yeniden aç</a></main>
});
function Root(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><Outlet/></QueryClientProvider>}