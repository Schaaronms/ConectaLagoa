import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Conectando talentos locais com oportunidades
            </h1>
           <p className="hero-subtitle">
              A plataforma de recrutamento que une profissionais e empresas da nossa região
            </p>
            <div className="hero-buttons">
              <Link to="/registro?tipo=candidato" className="btn btn-primary btn-lg">
                Sou Candidato
              </Link>
              <Link to="/registro?tipo=empresa" className="btn btn-outline btn-lg">
                Sou Empresa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Como Funciona</h2>
          
          <div className="grid grid-2">
            {/* Para Candidatos */}
            <div className="feature-card">
              <div className="feature-icon candidato-icon">👤</div>
              <h3>Para Candidatos</h3>
              <ul className="feature-list">
                <li>✓ Cadastre seu currículo gratuitamente</li>
                <li>✓ Destaque suas habilidades e experiências</li>
                <li>✓ Seja encontrado por empresas locais</li>
                <li>✓ Acompanhe visualizações do seu perfil</li>
              </ul>
              <Link to="/registro?tipo=candidato" className="btn btn-primary btn-full">
                Cadastrar Currículo
              </Link>
            </div>

            {/* Para Empresas */}
            <div className="feature-card">
              <div className="feature-icon empresa-icon">🏢</div>
              <h3>Para Empresas</h3>
              <ul className="feature-list">
                <li>✓ Acesse banco de talentos locais</li>
                <li>✓ Busque por habilidades e experiência</li>
                <li>✓ Salve candidatos favoritos</li>
                <li>✓ Contrate os melhores profissionais</li>
              </ul>
              <Link to="/registro?tipo=empresa" className="btn btn-secondary btn-full">
                Buscar Talentos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="benefits">
        <div className="container">
          <h2 className="section-title">Por Que Escolher Emprega Lagoa?</h2>
          
          <div className="grid grid-3">
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h4>Foco Local</h4>
              <p>Especializados em conectar talentos e empresas da nossa região</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h4>Rápido e Fácil</h4>
              <p>Cadastro simples e busca intuitiva para encontrar o match perfeito</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">💼</div>
              <h4>Profissional</h4>
              <p>Plataforma completa com todos os recursos necessários</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h4>Seguro</h4>
              <p>Seus dados protegidos com total segurança e privacidade</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h4>Resultados</h4>
              <p>Acompanhe métricas e visualizações do seu perfil</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h4>Suporte</h4>
              <p>Equipe local pronta para ajudar quando você precisar</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta">
        <div className="container">
          <h2>Pronto para Começar?</h2>
          <p>Junte-se a centenas de profissionais e empresas da nossa região</p>
          <Link to="/registro" className="btn btn-primary btn-lg">
            Criar Conta Grátis
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
