import React from "react";
import { Link } from "react-router-dom";
import "./Sobre.css"; // opcional, para estilização

const Sobre = () => {
  return (

<main>
  <section className="sobre-landing">
    <h1>Conecta Lagoa</h1>
    <p>
      Nascemos para facilitar a conexão entre você e as melhores oportunidades de trabalho na nossa região.
Aqui, cada vaga e cada talento têm vez, porque acreditamos que encontrar o emprego ideal deve ser simples, rápido e feito com carinho.
Junte-se a nós e faça parte dessa transformação!
    </p>
    <Link to="/registro" className="btn-primary">Comece agora</Link>
  </section>

  <section className="sobre-missao-valores">
    <h2>Missão</h2>
<p>Facilitar o encontro entre o candidato ideal e a vaga certa, valorizando talentos da nossa região.</p>


    <h2>Valores</h2>
    <ul>
      <li>Transparência e confiança</li>
      <li>Conexões que fazem a diferença</li>
      <li>Valorização do talento local</li>
    </ul>
  </section>
</main>

  
  );
};
export default Sobre;
