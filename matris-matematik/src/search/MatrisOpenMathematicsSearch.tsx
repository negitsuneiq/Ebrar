import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { universities } from "./universities";
import { scoreResource, type Resource } from "./search";
import rawResources from "./catalog";
import "./MatrisSearch.css";
const resources = rawResources as Resource[];
const kinds: Resource["kind"][] = ["Lecture notes", "Open book", "Problem set"];
const kindLabels: Record<string, string> = {
  "Lecture notes": "Ders notları",
  "Open book": "Açık kitaplar",
  "Problem set": "Problem setleri"
};
const examples = ["Eigenvalues", "Real analysis", "Probability", "Topology"];
const topicAreas = [
 {subject:"Analysis",label:"Analiz",symbol:"f′",detail:"Limitlerden ölçü kuramına"},
 {subject:"Linear algebra",label:"Lineer cebir",symbol:"A",detail:"Matrisler ve vektör uzayları"},
 {subject:"Algebra",label:"Cebir",symbol:"G",detail:"Gruplar, halkalar ve cisimler"},
 {subject:"Geometry",label:"Geometri",symbol:"∠",detail:"Eğriler, yüzeyler ve uzaylar"},
 {subject:"Number theory",label:"Sayılar kuramı",symbol:"ℤ",detail:"Asal sayılar ve aritmetik"},
 {subject:"Differential equations",label:"Diferansiyel denklemler",symbol:"∂",detail:"Değişimin matematiği"},
 {subject:"Probability & statistics",label:"Olasılık ve istatistik",symbol:"P",detail:"Rastlantıdan çıkarıma"},
 {subject:"Topology",label:"Topoloji",symbol:"∞",detail:"Süreklilik ve uzayın yapısı"}
];
const quickUniversities = ["mit","oxford","cambridge","metu","bilkent","bogazici"];
function GeometryStudy(){
 const project=(u:number,v:number)=>{
  const x=(76+29*Math.cos(v))*Math.cos(u),y=(76+29*Math.cos(v))*Math.sin(u),z=29*Math.sin(v);
  return [(x*.98-y*.2)*1.5+195,(x*.2+y*.98)*.56*1.5-z*1.25+145];
 };
 const path=(fixed:number,longitude:boolean)=>Array.from({length:81},(_,i)=>{
  const t=i/80*Math.PI*2;const [x,y]=project(longitude?fixed:t,longitude?t:fixed);
  return (i?"L":"M")+x.toFixed(2)+","+y.toFixed(2);
 }).join(" ")+"Z";
 return <div className="mx-geometry" aria-hidden="true"><div className="mx-geometry-label"><span>MATEMATİĞİN BİÇİMLERİ</span><span>01 / TORUS</span></div><svg viewBox="0 0 390 290" fill="none"><path className="mx-diagram-grid" d="M25 70H365M25 145H365M25 220H365M100 30V260M195 30V260M290 30V260"/><path className="mx-diagram-axis" d="M30 251L354 58M33 73L357 242"/><g className="mx-torus">{Array.from({length:12},(_,i)=><path key={"u"+i} d={path(i*Math.PI/6,true)}/>)}{Array.from({length:9},(_,i)=><path key={"v"+i} d={path(i*Math.PI*2/9,false)}/>)}</g><circle cx="195" cy="145" r="3" fill="currentColor"/><text x="350" y="48">x</text><text x="362" y="254">y</text></svg><div className="mx-geometry-caption"><span>Soyut bir fikir.<br/><strong>Keşfedilecek bir dünya.</strong></span><span className="mx-geometry-formula">S¹ × S¹</span></div></div>;
}
function Icon({
  name,
  size = 20
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: <><path d="M14 3h7v7m0-7L10 14" /><path d="M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5" /></>,
    filter: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="currentColor" /><circle cx="15" cy="17" r="2" fill="currentColor" /></>,
    book: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z" /><path d="M12 5v15" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4 10-10" />,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.book}</svg>;
}
export function MatrisOpenMathematicsSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [kind, setKind] = useState("");
  const [subject, setSubject] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsTop = useRef<HTMLDivElement>(null);
  const subjects = useMemo(() => [...new Set(resources.map(r => r.subject))].sort(), []);
  useEffect(() => {
    function sync() {
      const p = new URLSearchParams(window.location.search);
      const q = (p.get("q") || "").slice(0, 180);
      setQuery(q);
      setInput(q);
      setSelected((p.get("uni") || "").split(",").filter(id => universities.some(u => u.id === id)));
      setKind(kinds.includes(p.get("type") as Resource["kind"]) ? p.get("type")! : "");
      setSubject(subjects.includes(p.get("subject") || "") ? p.get("subject")! : "");
      setPage(1);
      setInitialized(true);
    }
    sync();
    window.addEventListener("popstate", sync);
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("keydown", keys);
    };
  }, [subjects]);
  useEffect(() => {
    if (!initialized) return;
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (selected.length) p.set("uni", selected.join(","));
    if (kind) p.set("type", kind);
    if (subject) p.set("subject", subject);
    const next = window.location.pathname + (p.size ? "?" + p.toString() : "");
    // This is an in-page filter update, not navigation to a new document.
    // Native replaceState is observed by TanStack and otherwise resets scroll,
    // overriding the deliberate result scrolling in the interaction handlers.
    if (next !== window.location.pathname + window.location.search) {
      void navigate({
        to: "/",
        search: () => Object.fromEntries(p.entries()),
        hash: window.location.hash.slice(1),
        replace: true,
        resetScroll: false,
        hashScrollIntoView: false,
      });
    }
    setPage(1);
  }, [query, selected, kind, subject, initialized, navigate]);
  const scored = useMemo(() => resources.map(r => ({
    r,
    score: scoreResource(r, query)
  })).filter(x => x.score > 0), [query]);
  const eligible = useMemo(() => scored.filter(({
    r
  }) => (!kind || r.kind === kind) && (!subject || r.subject === subject)), [scored, kind, subject]);
  const filtered = useMemo(() => {
    const a = eligible.filter(({
      r
    }) => !selected.length || selected.includes(r.university));
    if (sort === "title") a.sort((a, b) => a.r.title.localeCompare(b.r.title, "en"));else if (sort === "university") a.sort((a, b) => (universities.find(u => u.id === a.r.university)?.name || "").localeCompare(universities.find(u => u.id === b.r.university)?.name || ""));else if (query) a.sort((a, b) => b.score - a.score);
    return a;
  }, [eligible, selected, sort, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const activeFilters = selected.length + (kind ? 1 : 0) + (subject ? 1 : 0);
  const totals = useMemo(() => Object.fromEntries(universities.map(u => [u.id, resources.filter(r => r.university === u.id).length])), []);
  function search(value: string) {
    const q = value.trim().slice(0, 180);
    setQuery(q);
    setInput(q);
    setPage(1);
    setTimeout(() => resultsTop.current?.scrollIntoView({
      block: "start",
      behavior: "auto"
    }), 0);
  }
  function clear() {
    setQuery("");
    setInput("");
    setSelected([]);
    setKind("");
    setSubject("");
    setPage(1);
  }
  function pickTopic(value: string) {
    setSubject(value); setQuery(""); setInput(""); setSelected([]); setKind(""); setPage(1);
    resultsTop.current?.scrollIntoView({block:"start",behavior:"auto"});
  }
  function pickUniversity(id: string) {
    setSelected([id]);
    setQuery("");
    setInput("");
    setKind("");
    setSubject("");
    setPage(1);
    resultsTop.current?.scrollIntoView({
      block: "start"
    });
  }
  return <div className="matris-app"><a className="mx-skip" href="#mx-results">Kaynaklara geç</a><header className="mx-header"><div className="mx-header-inner"><a href="/" className="mx-brand" aria-label="Matris ana sayfa"><span className="mx-brand-symbol">m<span>·</span></span><span>matris</span></a><span className="mx-brand-caption">AÇIK MATEMATİK<br/>KAYNAKLARI</span><nav aria-label="Ana menü"><a href="#topics" className="mx-nav-active">Keşfet</a><a href="#universities">Üniversiteler</a><a href="#about">Hakkında</a></nav></div></header>
 <main><section className="mx-hero" aria-label="Matematik kaynaklarını keşfet"><div className="mx-hero-top"><div className="mx-hero-copy"><div className="mx-eyebrow"><span className="mx-status-dot" />MERAKIN İÇİN AÇIK BİR KÜTÜPHANE</div><h1>Matematiğin<br /><em>kaynağına in.</em></h1><p className="mx-hero-description">Bir konudan başla. Dünyanın ve Türkiye’nin önde gelen üniversitelerinin ders notlarını, kitaplarını ve problem setlerini keşfet.</p><div className="mx-hero-facts"><span><strong>{resources.length.toLocaleString("tr-TR")}</strong> açık kaynak</span><i /><span><strong>{universities.length}</strong> üniversite</span><i /><span>Tek bir arama.</span></div></div><GeometryStudy /></div>
 <form className="mx-search" role="search" onSubmit={e => {
          e.preventDefault();
          search(input);
        }}><Icon name="search" size={25} /><label className="mx-sr" htmlFor="resource-query">Konu, kaynak, üniversite veya ders adı</label><input id="resource-query" ref={searchInput} maxLength={180} type="search" placeholder="Search topics, books or universities…" value={input} onChange={e => setInput(e.target.value)} autoComplete="off" spellCheck={false} /><kbd aria-hidden="true">⌘ K</kbd><button type="submit">Kaynak ara <Icon name="arrow" size={19} /></button></form>
 <div className="mx-examples"><span>Örnek aramalar</span>{examples.map(e => <button key={e} onClick={() => search(e)}>{e}<Icon name="arrow" size={12} /></button>)}</div>
 <div className="mx-quick-universities"><span>ÜNİVERSİTEDEN BAŞLA</span><div>{quickUniversities.map(id=>{const u=universities.find(u=>u.id===id)!;return <button key={id} onClick={()=>pickUniversity(id)}>{u.short}</button>})}<a href="#universities">Tüm üniversiteler <Icon name="arrow" size={14}/></a></div></div></section>
 <section className="mx-topics" id="topics" aria-label="Konu alanları"><div className="mx-section-title"><div><span className="mx-eyebrow">BİR SONRAKİ MERAKIN</span><h2>Konu alanlarını keşfet.</h2></div><button className="mx-text-link" onClick={()=>{setFiltersOpen(true);resultsTop.current?.scrollIntoView({block:"start"});setTimeout(()=>document.querySelector<HTMLSelectElement>(".mx-subject-label select")?.focus(),0)}}>Tüm alanlar <Icon name="arrow" size={17}/></button></div><div className="mx-topic-grid">{topicAreas.map(t=><button className="mx-topic" key={t.subject} aria-pressed={subject===t.subject} onClick={()=>pickTopic(t.subject)}><span className="mx-topic-top"><span className="mx-topic-symbol" aria-hidden="true">{t.symbol}</span><span>{resources.filter(r=>r.subject===t.subject).length} kaynak <Icon name="arrow" size={14}/></span></span><strong>{t.label}</strong><small>{t.detail}</small></button>)}</div></section>
 <div className="mx-content-wrap" ref={resultsTop} id="mx-results"><button className="mx-mobile-filters" aria-expanded={filtersOpen} aria-controls="mx-filters" onClick={() => setFiltersOpen(x => !x)}><Icon name="filter" size={18} /> Filtreler {activeFilters > 0 && <span>{activeFilters}</span>}<span className="mx-filter-end">{filtersOpen ? "Kapat" : "Göster"}</span></button>
 <aside id="mx-filters" className={"mx-filters " + (filtersOpen ? "mx-filters-open" : "")}><div className="mx-filter-heading"><span><Icon name="filter" size={15}/> ARAMAYI DARALT</span>{activeFilters > 0 && <button onClick={() => {
              setSelected([]);
              setKind("");
              setSubject("");
            }}>Temizle</button>}</div><fieldset><legend>Üniversite</legend>{universities.map(u => <label key={u.id} className="mx-filter-option"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => setSelected(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])} /><span>{u.name === "Massachusetts Institute of Technology" ? "MIT" : u.name}</span><small>{eligible.filter(({
                  r
                }) => r.university === u.id).length}</small></label>)}</fieldset><fieldset><legend>Kaynak türü</legend><label className="mx-filter-option"><input type="radio" name="kind" checked={!kind} onChange={() => setKind("")} /><span>Tüm kaynaklar</span></label>{kinds.map(k => <label className="mx-filter-option" key={k}><input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} /><span>{kindLabels[k]}</span></label>)}</fieldset><label className="mx-subject-label">Konu alanı<select value={subject} onChange={e => setSubject(e.target.value)}><option value="">Tüm alanlar</option>{subjects.map(s => <option key={s}>{s}</option>)}</select></label><div className="mx-filter-note"><Icon name="external" size={18} /><p>Her sonuç, materyalin bulunduğu özgün siteye götürür.</p></div></aside>
 <section className="mx-results" aria-label="Arama sonuçları"><div className="mx-results-heading"><div><h2>{query ? "Arama sonuçları" : (subject || selected.length || kind) ? "Seçtiğin kaynaklar" : "Açık kaynak koleksiyonu"}</h2><p role="status" aria-live="polite">{query && <><strong>“{query}”</strong> için </>}{filtered.length.toLocaleString("en-US")} kaynak{!query && " · Özgün kaynağında keşfet."}</p></div><label className="mx-sort">Sırala<select aria-label="Sonuçları sırala" value={sort} onChange={e => {
                setSort(e.target.value);
                setPage(1);
              }}><option value="relevance">İlgililik</option><option value="title">Başlık A-Z</option><option value="university">Üniversite</option></select></label></div>
 {(query || activeFilters > 0) && <div className="mx-active-filters">{query && <button onClick={() => {
              setQuery("");
              setInput("");
            }}>{query}<Icon name="close" size={13} /></button>}{selected.map(id => <button key={id} onClick={() => setSelected(s => s.filter(x => x !== id))}>{universities.find(u => u.id === id)?.short}<Icon name="close" size={13} /></button>)}{kind && <button onClick={() => setKind("")}>{kindLabels[kind]}<Icon name="close" size={13} /></button>}{subject && <button onClick={() => setSubject("")}>{subject}<Icon name="close" size={13} /></button>}</div>}
 {visible.length ? <div className="mx-resource-list">{visible.map(({
              r
            }) => {
              const u = universities.find(u => u.id === r.university)!;
              return <article className="mx-resource" key={r.id}><div className="mx-university-mark"  aria-label={u.name}>{u.mark}</div><div className="mx-resource-body"><div className="mx-resource-overline"><span>{u.short}</span><span className="mx-overline-dot">·</span><span>{r.author || r.subject}</span></div><h3><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}<span className="mx-sr"> (özgün kaynak, yeni sekme)</span></a></h3><p className="mx-resource-description">{r.description}</p><div className="mx-resource-meta"><span className={"mx-kind mx-kind-" + r.kind.replace(/ /g, "-").toLowerCase()}><Icon name="book" size={12} />{r.kind}</span><span>{r.subject}</span><span className="mx-format">{r.format}</span>{r.language && <span>{r.language === "tr" ? "Türkçe" : "English"}</span>}</div><div className="mx-resource-foot"><span>{new URL(r.url).hostname}</span><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">Ders / kaynak sayfası <Icon name="external" size={11} /></a></div>{r.sourceLicense && <p className="mx-source-credit"><a href={r.sourceLicenseUrl} target="_blank" rel="noopener noreferrer">{r.sourceLicense}</a><span> · </span><a href={r.termsUrl} target="_blank" rel="noopener noreferrer">Kullanım koşulları</a></p>}</div><a className="mx-open-resource" href={r.url} target="_blank" rel="noopener noreferrer" aria-label={r.title + " kaynağını özgün sitede aç"}><Icon name="external" size={19} /></a></article>;
            })}</div> : <div className="mx-empty"><span><Icon name="search" size={30} /></span><h3>Bu aramada kaynak bulunamadı.</h3><p>Daha genel bir İngilizce konu adı dene veya filtreleri kaldır.<br />Örneğin “eigenvalues”, “measure theory” ya da “calculus”.</p><button onClick={clear}>Aramayı ve filtreleri temizle</button><p className="mx-empty-caption">Sonuç olmaması, üniversitede bu konunun bulunmadığı anlamına gelmez.</p></div>}
 {filtered.length > 20 && <nav className="mx-pagination" aria-label="Sonuç sayfaları"><span>{(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, filtered.length)} / {filtered.length}</span><div><button aria-label="Önceki sonuç sayfası" disabled={currentPage <= 1} onClick={() => {
                setPage(currentPage - 1);
                resultsTop.current?.scrollIntoView({
                  block: "start"
                });
              }}>←</button><span>{currentPage} / {pageCount}</span><button aria-label="Sonraki sonuç sayfası" disabled={currentPage >= pageCount} onClick={() => {
                setPage(currentPage + 1);
                resultsTop.current?.scrollIntoView({
                  block: "start"
                });
              }}>→</button></div></nav>}
 <p className="mx-result-note">Katalogda Türkçe ve İngilizce materyaller bulunur. Erişim ve kullanım koşulları özgün kaynağa aittir.</p></section></div>
 <section id="universities" className="mx-universities"><div className="mx-section-title"><div><span className="mx-eyebrow">BİLGİNİN KAYNAĞINA GİT</span><h2>Bilginin geldiği yerler.</h2></div><p>{universities.length} üniversitenin açık materyalleri. Seç ve keşfet.</p></div><div className="mx-university-grid">{universities.map(u => <button key={u.id} onClick={() => pickUniversity(u.id)}><span className="mx-campus-mark" >{u.mark}</span><span className="mx-campus-info"><strong>{u.short}</strong><small>{totals[u.id]} kaynak · {u.country}</small></span><Icon name="arrow" size={17} /></button>)}</div></section>
 <section id="about" className="mx-about"><div><div className="mx-eyebrow">KATALOĞUN ARKASINDA</div><h2>Açık bilgiye<br />daha kısa bir yol.</h2><p>Matris, matematik öğrenmek isteyenlerin üniversiteler ve öğretim üyeleri tarafından açıkça paylaşılan materyalleri bulmasını kolaylaştırır.</p></div><div className="mx-about-details"><details open><summary>Arama nerede yapılıyor?</summary><p>Arama, bu siteye eklenen kaynakların başlıkları, yazarları, üniversiteleri ve konu etiketleri içinde yapılır. Canlı bir internet araması değildir; üniversitelerin bütün derslerini veya bütün açık materyallerini kapsamaz.</p></details><details><summary>Kaynaklar nasıl seçiliyor?</summary><p>Üniversitelerin ve öğretim üyelerinin yayımladığı ders notları, açık kitaplar, problem setleri ve sınav çalışmaları seçilir. Videolar, ücretli kitap mağazaları ve giriş isteyen ders portalları sonuçlara eklenmez. Açık erişim, açık lisans anlamına gelmez.</p></details><details><summary>Kaynak atıfları ve lisanslar</summary><p>Matris ücretsiz bir bağlantı dizinidir. Belge içerikleri özgün siteden açılır. MIT OpenCourseWare kaynakları Massachusetts Institute of Technology tarafından yayımlanır. <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">Genel lisans: CC BY-NC-SA 4.0</a>; materyale özgü istisnalar için <a href="https://ocw.mit.edu/pages/privacy-and-terms-of-use/" target="_blank" rel="noopener noreferrer">MIT kullanım koşullarını</a> incele. Başlıklar ve konu etiketleri arama için düzenlenmiştir. MIT OCW katalog kayıtları aynı lisansla paylaşılır. Ankara Üniversitesi Açık Ders kayıtlarında CC BY-NC-SA 4.0, ODTÜ OpenCourseWare kayıtlarında CC BY-NC-SA 3.0 kaynak lisansları belirtilir. Kaynağa özgü istisnalar ve diğer kullanım koşulları özgün sayfalarda geçerlidir.</p></details><details><summary>Türkiye’den hangi kaynaklar var?</summary><p>Boğaziçi, Bilkent, ODTÜ, Galatasaray, Hacettepe, Ankara, İYTE ve Mimar Sinan üniversitelerinin açıkça paylaşılan Türkçe ve İngilizce materyalleri eklendi. Koç ve Yıldız Teknik için bu güncellemede erişimi doğrulanmış, giriş veya şifre istemeyen uygun bir belge eklenemedi. Bu, bu üniversitelerde açık materyal bulunmadığı anlamına gelmez.</p></details><details><summary>Bağlantılar ve güncellik</summary><p>Kaynak bağlantıları katalog hazırlanırken kontrol edildi. Üniversiteler dosyaları taşıyabilir; bir bağlantı açılmazsa “Ders / kaynak sayfası” bağlantısını deneyebilirsin. Katalog güncellemesi: {resources.map(r => r.checked).sort().at(-1) || "2026-09-30"}. Matris listelenen üniversitelerle kurumsal olarak bağlantılı değildir.</p></details></div></section></main>
 <footer className="mx-footer"><a className="mx-brand" href="/"><span className="mx-brand-symbol">m<span>·</span></span><span>matris</span></a><p>Merakın kadar geniş bir kütüphane.</p><a href="#resource-query" onClick={e => {
        e.preventDefault();
        searchInput.current?.focus();
        window.scrollTo({
          top: 0
        });
      }}>Aramaya dön ↑</a></footer></div>;
}