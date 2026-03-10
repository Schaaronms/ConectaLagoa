// PanelHistory.jsx — Conecta Lagoa
const V = {
  surface:'#ffffff', surface2:'#f0f3fa', border:'#e2e8f4',
  accent:'#1a3a8f', accent2:'#2d52c4', accent3:'#e07b00',
  green:'#10b981', red:'#ef4444', orange:'#e07b00',
  text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

const PILL = {
  'pill-blue':   { bg:'rgba(26,58,143,0.1)',   color:'#1a3a8f' },
  'pill-green':  { bg:'rgba(16,185,129,0.12)', color:'#10b981' },
  'pill-orange': { bg:'rgba(224,123,0,0.12)',  color:'#e07b00' },
  'pill-red':    { bg:'rgba(239,68,68,0.12)',  color:'#ef4444' },
  'pill-purple': { bg:'rgba(224,123,0,0.12)',  color:'#c96a00' },
  'pill-cyan':   { bg:'rgba(45,82,196,0.12)',  color:'#2d52c4' },
};

function Pill({ cls, children }) {
  const p = PILL[cls] || PILL['pill-blue'];
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:p.bg, color:p.color }}>{children}</span>;
}

function KpiCard({ icon, label, value, delta, deltaUp=true, color, delay=0 }) {
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:20, animation:`fadeUp 0.5s ease ${delay}s both` }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';}}>
      <div style={{ width:36, height:36, borderRadius:9, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, lineHeight:1, color:V.text }}>{value ?? '—'}</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, marginTop:8, padding:'2px 8px', borderRadius:20, background:deltaUp?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color:deltaUp?V.green:V.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </div>
    </div>
  );
}

export default function PanelHistory() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { icon:'📣', label:'Engajamento Top Vaga',  value:'Dev Sr',  delta:'148 apps',        deltaUp:true,  color:V.accent  },
          { icon:'⚡', label:'Resp. Média Candidato', value:'2.4h',    delta:'Melhor do setor',  deltaUp:true,  color:V.green   },
          { icon:'⭐', label:'Reputação Employer',    value:'4.6',     delta:'+0.3 pts',         deltaUp:true,  color:V.orange  },
          { icon:'🏃', label:'Taxa de Desistência',   value:'12%',     delta:'Meta: 10%',        deltaUp:false, color:V.red     },
        ].map((k,i) => <KpiCard key={i} {...k} delay={0.05+i*0.05}/>)}
      </div>

      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${V.border}` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>Histórico de Vagas com Maior Engajamento</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>{['Vaga','Período','Apps','Contratados','Conversão','Tempo Médio','Reputação'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[
                ['Dev Sênior Backend','Jan–Fev 2025',148,3,'pill-orange','2%',  '38d','★★★★☆'],
                ['UX Designer Pleno', 'Fev 2025',    92, 2,'pill-blue',  '2.2%','22d','★★★★★'],
                ['Product Manager',   'Dez–Jan 2025',67, 1,'pill-green', '1.5%','18d','★★★★☆'],
                ['Data Analyst Jr',   'Jan 2025',    203,5,'pill-green', '2.5%','15d','★★★★★'],
                ['Dev Frontend React','Dez 2024',    119,2,'pill-orange','1.7%','27d','★★★★☆'],
              ].map(([v,p,a,c,pc,cv,t,r],i) => (
                <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                  <td style={{ padding:'12px', fontWeight:500 }}>{v}</td>
                  <td style={{ padding:'12px', color:V.muted }}>{p}</td>
                  <td style={{ padding:'12px' }}>{a}</td>
                  <td style={{ padding:'12px' }}>{c}</td>
                  <td style={{ padding:'12px' }}><Pill cls={pc}>{cv}</Pill></td>
                  <td style={{ padding:'12px' }}>{t}</td>
                  <td style={{ padding:'12px', color:V.orange }}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
