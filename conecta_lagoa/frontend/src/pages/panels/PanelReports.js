// PanelReports.jsx — Conecta Lagoa
const V = {
  surface:'#ffffff', surface2:'#f0f3fa', border:'#e2e8f4',
  accent:'#1a3a8f', accent2:'#2d52c4', accent3:'#e07b00',
  green:'#10b981', red:'#ef4444', text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

function KpiCard({ icon, label, value, delta, deltaUp=true, color, delay=0 }) {
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:20, position:'relative', overflow:'hidden', animation:`fadeUp 0.5s ease ${delay}s both` }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(26,58,143,0.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
      <div style={{ position:'absolute', top:-30, right:-30, width:80, height:80, borderRadius:'50%', background:color, opacity:0.08 }}/>
      <div style={{ width:36, height:36, borderRadius:9, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, lineHeight:1, color:V.text }}>{value ?? '—'}</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, marginTop:8, padding:'2px 8px', borderRadius:20, background:deltaUp?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color:deltaUp?V.green:V.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </div>
    </div>
  );
}

function Card({ title, badge, badgeColor='blue', children }) {
  const bc = badgeColor==='green' ? {bg:'rgba(16,185,129,0.12)',color:V.green} : {bg:'rgba(26,58,143,0.1)',color:V.accent};
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22 }}>
      {(title||badge) && (
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
          {title && <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>{title}</div>}
          {badge && <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:bc.bg, color:bc.color }}>{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export default function PanelReports() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { icon:'🏆', label:'Cargo mais difícil', value:'Dev Sênior', delta:'42d médio',    deltaUp:false, color:V.accent3 },
          { icon:'💵', label:'Média Salarial Dev',  value:'R$12k',     delta:'8% mercado',   deltaUp:true,  color:V.accent2 },
          { icon:'🚶', label:'Taxa Turnover',        value:'9%',        delta:'2pp abaixo',   deltaUp:false, color:V.red     },
        ].map((k,i) => <KpiCard key={i} {...k} delay={0.05+i*0.05}/>)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title="Vagas por Dificuldade">
          {[['Dev Sênior Backend',85,V.red,'Alta'],['Data Scientist',75,V.accent3,'Média'],['UX Designer',55,V.accent3,'Média'],['Product Manager',40,V.green,'Baixa'],['Analista de Suporte',25,V.green,'Baixa']].map(([l,p,c,t],i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid rgba(226,232,244,0.6)` }}>
              <span style={{ fontSize:12 }}>{l}</span>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:120, height:4, background:V.border, borderRadius:2 }}><div style={{ width:`${p}%`, height:'100%', background:c, borderRadius:2 }}/></div>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:c }}>{t}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Médias Salariais por Função">
          {[['Dev Sênior','R$ 14.000'],['Data Scientist','R$ 12.500'],['Product Manager','R$ 11.000'],['UX Designer','R$ 8.500'],['Dev Pleno','R$ 9.000'],['Analista de Suporte','R$ 4.200']].map(([r,s],i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid rgba(226,232,244,0.6)` }}>
              <span style={{ fontSize:12 }}>{r}</span>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:V.text }}>{s}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Comparativo com Mercado" badge="Glassdoor · 2025" badgeColor="green">
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160, paddingTop:10 }}>
          {[['Dev Sr',80,75],['Data Sci',90,70],['PM',65,80],['UX',55,60],['Dev Pl',45,52]].map(([l,a,b],i)=>(
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ width:'100%', display:'flex', gap:3, alignItems:'flex-end', height:130 }}>
                <div style={{ flex:1, height:`${a}%`, background:V.accent, borderRadius:'4px 4px 0 0' }}/>
                <div style={{ flex:1, height:`${b}%`, background:V.accent3, opacity:0.7, borderRadius:'4px 4px 0 0' }}/>
              </div>
              <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:12 }}>
          {[['Nossa empresa',V.accent],['Média mercado',V.accent3]].map(([l,c])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.muted2 }}>
              <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>{l}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
