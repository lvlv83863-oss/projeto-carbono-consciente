/* =========================================================
   CARBONO CONSCIENTE — script.js (página única)
   Tema claro/escuro, acordeão, cards expansíveis, menu mobile,
   scrollspy do menu e animações de entrada ao rolar a página.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- TEMA CLARO / ESCURO ---------- */
  const raiz = document.documentElement;
  const botaoTema = document.querySelector('.theme-toggle');
  const TEMA_SALVO = localStorage.getItem('carbono-tema');

  /* Padrão do site: tema escuro (inspirado na imagem de referência) */
  const temaInicial = TEMA_SALVO || 'escuro';
  if (temaInicial === 'escuro') {
    raiz.setAttribute('data-theme', 'escuro');
  } else {
    raiz.removeAttribute('data-theme');
  }

  if (botaoTema) {
    botaoTema.addEventListener('click', () => {
      const temaAtual = raiz.getAttribute('data-theme') === 'escuro' ? 'escuro' : 'claro';
      const novoTema = temaAtual === 'escuro' ? 'claro' : 'escuro';

      if (novoTema === 'claro') {
        raiz.removeAttribute('data-theme');
      } else {
        raiz.setAttribute('data-theme', 'escuro');
      }
      localStorage.setItem('carbono-tema', novoTema);
    });
  }

  /* ---------- MENU HAMBÚRGUER (mobile) ---------- */
  const botaoMenu = document.querySelector('.menu-hamburguer');
  const navPrincipal = document.querySelector('.nav-principal');

  if (botaoMenu && navPrincipal) {
    botaoMenu.addEventListener('click', () => {
      navPrincipal.classList.toggle('mobile-aberto');
    });
    navPrincipal.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navPrincipal.classList.remove('mobile-aberto'));
    });
  }

  /* ---------- ACORDEÃO (O que é Carbono Consciente) ---------- */
  const itensAcordeao = document.querySelectorAll('.acordeao-item');

  itensAcordeao.forEach(item => {
    const cabecalho = item.querySelector('.acordeao-cabecalho');
    cabecalho.addEventListener('click', () => {
      const jaAberto = item.classList.contains('aberto');
      itensAcordeao.forEach(i => i.classList.remove('aberto'));
      if (!jaAberto) item.classList.add('aberto');
    });
  });

  /* ---------- CARDS DE DICAS EXPANSÍVEIS ---------- */
  const cardsDica = document.querySelectorAll('.dica-card');

  cardsDica.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('aberto');
    });
  });

  /* ---------- ANIMAÇÃO DE ENTRADA AO ROLAR ---------- */
  const elementosRevelar = document.querySelectorAll(
    '.reveal, .planta-coluna, .dica-card, .noticia-card, .lista-curiosidades li'
  );

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.18 });

  elementosRevelar.forEach(el => observador.observe(el));

  /* ---------- SCROLLSPY DO MENU ---------- */
  const linksNav = document.querySelectorAll('.nav-principal a[href^="#"]');
  const secoes = Array.from(linksNav)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const observadorNav = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      const id = '#' + entrada.target.id;
      const linkCorrespondente = document.querySelector(`.nav-principal a[href="${id}"]`);
      if (!linkCorrespondente) return;
      if (entrada.isIntersecting) {
        linksNav.forEach(l => l.classList.remove('ativo'));
        linkCorrespondente.classList.add('ativo');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  secoes.forEach(sec => observadorNav.observe(sec));

});
