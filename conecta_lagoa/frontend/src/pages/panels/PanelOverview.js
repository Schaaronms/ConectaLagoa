// PanelOverview.jsx — Conecta Lagoa
import { V, Pill, ScoreBar, Card, KpiCard } from './shared';




const PILL_LABEL = {
  'pill-green':  'Aprovado',
  'pill-red':    'Reprovado',
  'pill-purple': 'Entrevista',
  'pill-orange': 'Triagem',
  'pill-blue':   'Triagem',
  'pill-cyan':   'Recebido',
};

const FALLBACK_CANDIDATES = [
  { n:'Ana Lima',       loc:'São Paulo · SP',      v:'Dev Senior',   s:92, st:'pill-green',  stars:'★★★★★' },
  { n:'Carlos Mota',    loc:'Rio de Janeiro · RJ', v:'UX Designer',  s:85, st:'pill-purple', stars:'★★★★☆' },
  { n:'Juliana Rocha',  loc:'Belo Horizonte · MG', v:'Product Mgr',  s:78, st:'pill-orange', stars:'★★★★☆' },
  { n:'Rafael Souza',   loc:'Porto Alegre · RS',   v:'Dev Backend',  s:91, st:'pill-green',  stars:'★★★★★' },
  { n:'Fernanda Costa', loc:'Curitiba · PR',        v:'Data Analyst', s:67, st:'pill-cyan',   stars:'★★★☆☆' },
];

const BAR_DATA_FALLBACK = [
  { mes:'Jan', c:45, h:30 }, { mes:'Fev', c:60, h:45 }, { mes:'Mar', c:75, h:55 },
  { mes:'Abr', c:55, h:40 }, { mes:'Mai', c:85, h:65 }, { mes:'Jun', c:100, h:75 },
];

const FUNIL_FALLBACK = [
  { name:'Recebidos',    count:347, pct:100, color:V.accent  },
  { name:'Triados',      count:236, pct:68,  color:V.accent2 },
  { name:'Entrevistas',  count:146, pct:42,  color:V.accent3 },
  { name:'Contratados',  count:22,  pct:6,   color:'#059669'  },
];

const ALERTAS_FALLBACK = [
  { color:V.red,    msg:'3 candidatos sem resposta há +7 dias', time:'urgente' },
  { color:V.orange, msg:'Entrevista com Ana Lima — hoje 14h',   time:'em 2h'  },
  { color:V.accent, msg:'Vaga "Dev Senior" expira em 3 dias',   time:'03/mar' },
];

export default function PanelOverview({ kpis, candidates, evolucao, funil, alertas, goTo, onModal }) {
  const barData   = evolucao?.length > 0 ? evolucao : BAR_DATA_FALLBACK;
  const funilData = funil?.length   > 0 ? funil    : FUNIL_FALLBACK;
  const alertData = alertas?.length > 0 ? alertas  : ALERTAS_FALLBACK;

  // Normaliza max para o gráfico de barras
  const maxC = Math.max(...barData.map(b => b.c || b.candidaturas || 0)) || 1;
  const maxH = Math.max(...barData.map(b => b.h || b.contratacoes || 0)) || 1;

  return (
    <div>
      {/* KPIs */}
      {kpis.map((k,i)=>(
  <div
    key={i}
    onClick={() => {
      if (k.label === 'Vagas Ativas') goTo('vagas')
    }}
    style={{cursor:'pointer'}}
  >
    <KpiCard {...k}/>
  </div>
))}

      {/* Gráfico + Funil */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Evolução Mensal */}
        <Card title="Evolução Mensal" sub="Candidatos vs Contratações" badge="2025">
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, paddingTop:10 }}>
            {barData.map((b,i) => {
              const cVal = b.c ?? b.candidaturas ?? 0;
              const hVal = b.h ?? b.contratacoes ?? 0;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
                  <div style={{ width:'100%', display:'flex', gap:3, alignItems:'flex-end', height:90 }}>
                    <div style={{ flex:1, height:`${(cVal/maxC)*100}%`, background:V.accent, borderRadius:'4px 4px 0 0', transition:'height 0.6s', minHeight:2 }}/>
                    <div style={{ flex:1, height:`${(hVal/maxC)*100}%`, background:V.accent3, opacity:0.7, borderRadius:'4px 4px 0 0', transition:'height 0.6s', minHeight:2 }}/>
                  </div>
                  <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase' }}>{b.mes}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:12 }}>
            {[['Candidatos',V.accent],['Contratações',V.accent3]].map(([l,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.muted2 }}>
                <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>{l}
              </div>
            ))}
          </div>
        </Card>

        {/* Funil Geral */}
        <Card title="Funil Geral" sub="Pipeline atual" badge="Ao vivo" badgeColor="green">
          {funilData.map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:V.surface2, marginBottom:6, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.background=V.surface2;}}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <div style={{ fontSize:12, fontWeight:500, flex:1 }}>{s.name}</div>
              <div style={{ flex:1, height:4, background:V.border, borderRadius:2 }}>
                <div style={{ width:`${s.pct}%`, height:'100%', background:s.color, opacity:0.6, borderRadius:2 }}/>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, minWidth:32, textAlign:'right' }}>{s.count}</div>
              <div style={{ fontSize:11, color:V.muted, width:40, textAlign:'right' }}>{s.pct}%</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Tabela + Alertas */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <Card title="Candidatos Recentes" sub="Últimas aplicações" badge="+hoje">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>{['Candidato','Vaga','Score IA','Status','★'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {candidates.length > 0 ? candidates.map((c,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                    <td style={{ padding:'12px' }}>
                      <div style={{ fontWeight:500, fontSize:13 }}>{c.nome}</div>
                      <div style={{ fontSize:11, color:V.muted }}>{c.cidade || '—'}</div>
                    </td>
                    <td style={{ padding:'12px' }}>{c.vaga_titulo || '—'}</td>
                    <td style={{ padding:'12px' }}><ScoreBar val={c.score_ia ?? 75}/></td>
                    <td style={{ padding:'12px' }}>
                      <Pill cls={c.status==='Aprovado'?'pill-green':c.status==='Reprovado'?'pill-red':c.status==='Entrevista'?'pill-purple':'pill-orange'}>
                        {c.status || 'Triagem'}
                      </Pill>
                    </td>
                    <td style={{ padding:'12px', color:V.orange }}>{'★'.repeat(Math.min(5,Math.ceil((c.score_ia??75)/20)))}</td>
                  </tr>
                )) : FALLBACK_CANDIDATES.map((c,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)` }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                    <td style={{ padding:'12px' }}><div style={{ fontWeight:500, fontSize:13 }}>{c.n}</div><div style={{ fontSize:11, color:V.muted }}>{c.loc}</div></td>
                    <td style={{ padding:'12px' }}>{c.v}</td>
                    <td style={{ padding:'12px' }}><ScoreBar val={c.s}/></td>
                    <td style={{ padding:'12px' }}><Pill cls={c.st}>{PILL_LABEL[c.st] || 'Triagem'}</Pill></td>
                    <td style={{ padding:'12px', color:V.orange }}>{c.stars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alertas */}
        <Card title="Alertas & Lembretes">
          {alertData.map((a,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:V.surface2, marginBottom:8, fontSize:12, animation:`fadeUp 0.3s ease ${0.1+i*0.05}s both` }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, flexShrink:0 }}/>
              <span style={{ flex:1 }}>{a.msg}</span>
              <span style={{ fontSize:10, color:V.muted2, whiteSpace:'nowrap' }}>{a.time}</span>
            </div>
          ))}
          {alertData.length === 0 && (
            <div style={{ textAlign:'center', padding:24, color:V.muted2, fontSize:12 }}>
              ✅ Nenhum alerta no momento
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
