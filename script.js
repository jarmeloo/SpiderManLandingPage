// Registra o plugin que vamos usar
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin);
ScrollTrigger.normalizeScroll(true);
const smoother = ScrollSmoother.create({
  smooth: 3,
  effects: true,
  smoothTouch: 0.5,
});

// ===== PRELOADER =====
// Contador 0 -> 100; perto dos 90% a mão entra, solta a teia (DrawSVG)
// e, no 100%, "puxa" a tela preta revelando o site.
(function iniciarPreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return;

  const ehMobile = window.innerWidth <= 1024;
  const contadorEl = preloader.querySelector(".preloaderContador");
  const mao = preloader.querySelector(".preloaderMao");
  const teiaSvg = preloader.querySelector(".preloaderTeia");
  const teiaPath = preloader.querySelector(".teiaPath");
  const linhaSvg = preloader.querySelector(".preloaderLinha");
  const linha = linhaSvg.querySelector("line");

  // trava o scroll enquanto o preloader roda
  window.scrollTo(0, 0);
  smoother.paused(true);

  // Calcula os pontos da linha ANTES de esconder a mão (usa a posição
  // final dela, definida no CSS). A linha vai da mão até o centro da teia.
  const rMao = mao.getBoundingClientRect();
  const rTeia = teiaSvg.getBoundingClientRect();
  // Ponto da mão = ponta do dedo indicador (de onde a teia é disparada).
  // Frações medidas sobre a caixa da mão já rotacionada.
  const pontoMao = ehMobile
    ? { x: rMao.left + rMao.width * 0.72, y: rMao.top + rMao.height * 0.26 }
    : { x: rMao.left + rMao.width * 0.06, y: rMao.top + rMao.height * 0.72 };
  // Ponto da teia = centro (nó) da teia nova
  const pontoTeia = {
    x: rTeia.left + rTeia.width * 0.505,
    y: rTeia.top + rTeia.height * 0.56,
  };

  // No desktop, estica a origem da linha (mão) ao longo da mesma reta até a
  // borda direita da tela, para a teia "vir de fora". A ponta fica escondida
  // atrás da mão. Aumente PASSAR_DA_BORDA (em px) para começar mais pra fora.
  const PASSAR_DA_BORDA = 0; // ex.: 60 -> começa 60px fora da tela
  if (!ehMobile) {
    const dx = pontoMao.x - pontoTeia.x;
    const dy = pontoMao.y - pontoTeia.y;
    const bordaX = window.innerWidth + PASSAR_DA_BORDA;
    const t = (bordaX - pontoTeia.x) / dx;
    pontoMao.x = bordaX;
    pontoMao.y = pontoTeia.y + t * dy;
  }

  linha.setAttribute("x1", pontoMao.x);
  linha.setAttribute("y1", pontoMao.y);
  linha.setAttribute("x2", pontoTeia.x);
  linha.setAttribute("y2", pontoTeia.y);

  // Estados iniciais: mão fora da tela, linha e teia "zeradas"
  gsap.set(
    mao,
    ehMobile ? { xPercent: 120, yPercent: -120 } : { xPercent: 140 },
  );
  gsap.set(linha, { drawSVG: "0% 0%" });
  gsap.set(teiaPath, { drawSVG: "0% 0%", fillOpacity: 0 });
  gsap.set([linhaSvg, teiaSvg], { autoAlpha: 1 });

  const progresso = { valor: 0 };
  function atualizarContador() {
    contadorEl.textContent = `${Math.round(progresso.valor)}%`;
  }

  // No desktop a mão puxa para a direita (com leve rotação);
  // no mobile puxa de baixo para cima
  const puxada = ehMobile
    ? { yPercent: -130, rotation: -6 }
    : { xPercent: 130, y: "-8vh", rotation: -7 };

  const tlPreloader = gsap.timeline({
    defaults: { ease: "none" },
    onComplete: () => {
      preloader.style.display = "none";
      smoother.paused(false);
      // ScrollTrigger.refresh();
    },
  });

  tlPreloader
    // 0 -> 90
    .to(progresso, {
      valor: 90,
      duration: 2,
      ease: "power1.inOut",
      onUpdate: atualizarContador,
    })
    // a mão entra um pouco antes de bater os 90%
    .to(
      mao,
      { opacity:1, duration: .1 },
      
    )
    .to(
      mao,
      { xPercent: 0, yPercent: 0, duration: 0.7, ease: "power3.out" },
      "-=0.5",
    )
    // 90 -> 97: solta a teia (linha desenhada da mão até o canto)
    .to(
      progresso,
      { valor: 97, duration: 1.1, onUpdate: atualizarContador },
      ">-0.15",
    )
    .to(linha, { drawSVG: "0% 100%", duration: 0.45, ease: "power2.in" }, "<")
    // ... e a teia é desenhada no canto inferior esquerdo
    .to(
      teiaPath,
      { drawSVG: "0% 100%", duration: 0.7, ease: "power1.out" },
      ">-0.05",
    )
    .to(teiaPath, { fillOpacity: 1, duration: 0.3 }, ">-0.25")
    // 97 -> 100
    .to(
      progresso,
      { valor: 100, duration: 0.35, onUpdate: atualizarContador },
      ">-0.2",
    )
    // puxa a "cortina" preta (back.in dá a tensão de puxada antes de sair)
    .to(preloader, { ...puxada, duration: 1 }, "+=0.3");

  atualizarContador();
})();

const container = document.querySelector(".container");

const TOTAL_FRAMES = 74;
const CAMINHO_FRAMES = "assets/frames/";

function caminhoDoFrame(numero) {
  const numeroFormatado = String(numero).padStart(2, "0");
  return `${CAMINHO_FRAMES}img-${numeroFormatado}.webp`;
}

// 1) PRÉ-CARREGAMENTO

const imagens = [];
for (let i = 1; i <= TOTAL_FRAMES; i++) {
  const imagem = new Image();
  imagem.src = caminhoDoFrame(i);
  imagens.push(imagem);
}

// 2) CANVAS ONDE OS FRAMES SÃO DESENHADOS

const canvas = document.createElement("canvas");
canvas.classList.add("frames");
container.prepend(canvas); // fica atrás do conteúdo (ver CSS)
const ctx = canvas.getContext("2d");

function ajustarResolucaoDoCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;
  ctx.imageSmoothingQuality = "high"; // melhora o reescalonamento
}

// 3) OBJETO QUE O GSAP VAI ANIMAR
const estado = { frame: 0 };

// Desenha no canvas o frame indicado no estado, cobrindo todo o container
// sem distorcer (mesma lógica do "background-size: cover", feita na mão).
function mostrarFrameAtual() {
  const indice = Math.round(estado.frame);
  const imagem = imagens[indice];
  if (!imagem.complete) return; // ainda carregando: mantém o quadro anterior

  const cw = canvas.width;
  const ch = canvas.height;
  // Escala que faz a imagem preencher o canvas inteiro (a maior das duas)
  const escala = Math.max(cw / imagem.naturalWidth, ch / imagem.naturalHeight);
  const larguraDesenho = imagem.naturalWidth * escala;
  const alturaDesenho = imagem.naturalHeight * escala;
  // Centraliza (o excedente sobra igualmente para os lados / topo e base)
  const x = (cw - larguraDesenho) / 2;
  const y = (ch - alturaDesenho) / 2;

  ctx.drawImage(imagem, x, y, larguraDesenho, alturaDesenho);
}

history.scrollRestoration = "manual";

let larguraInicial = window.innerWidth;
let resizeTimer;

window.addEventListener("resize", () => {
  // atualiza o canvas imediatamente para não esticar a imagem
  ajustarResolucaoDoCanvas();
  mostrarFrameAtual();

  // espera o resize "assentar" (debounce) antes de decidir recarregar
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const mudancaLargura = Math.abs(window.innerWidth - larguraInicial);
    if (mudancaLargura > 80) {
      window.location.reload();
    }
  }, 300);
});

if (window.ResizeObserver) {
  new ResizeObserver(() => {
    ajustarResolucaoDoCanvas();
    mostrarFrameAtual();
  }).observe(container);
}

// Define a resolução inicial e desenha o primeiro frame quando ele carregar
ajustarResolucaoDoCanvas();
if (imagens[0].complete) {
  mostrarFrameAtual();
} else {
  imagens[0].onload = mostrarFrameAtual;
}

const tlHero = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "+=4000",
    pin: true,

    scrub: true,
  },
});
ScrollTrigger.refresh();
let endTl = "+=2000"
if (window.innerWidth <= 1024) {
  endTl = "+=1800";
}

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".conteudo",
    end: endTl,
    start: "top top",
    scrub: true,
  },
});

tlHero.to(estado, {
  frame: TOTAL_FRAMES - 1,
  duration: 2,
  onUpdate: mostrarFrameAtual,
});

tlHero.from(".trailer", {
  width: "0",
  height: "20vh",
  borderRadius: "4vw",
  duration: 1,
});

let movEsquerda = "-30vw";
let movDireita = "30vw";


if (window.innerWidth <= 1024) {
  movEsquerda = "0vw";
  movDireita = "0vw";
}

tlHero.to(
  ".esquerda",
  {
    x: movEsquerda,
    duration: 0.7,
  },
  "-=.8",
);
tlHero.to(
  ".direita",
  {
    x: movDireita,
    duration: 0.7,
  },
  "<",
);
tlHero.from(".playIcone", {
  opacity: 0,
  duration: 0.2,
});

const textoHero1 = SplitText.create(".texto1", { type: "words, chars" });
const textoHero2 = SplitText.create(".texto2", { type: "words, chars" });
const textoHero3 = SplitText.create(".texto3", { type: "words, chars" });

tl.to(textoHero1.chars, {
  opacity: 0,
  stagger: {
    each: 0.03,
    from: "random",
  },
  duration: 1,
});
tl.from(
  textoHero2.chars,
  {
    opacity: 0,
    duration: 1,

    stagger: {
      each: 0.03,
      from: "random",
    },
  },
  "-=1.5",
);
tl.to(
  textoHero2.chars,
  {
    opacity: 0,
    duration: 1,
    stagger: {
      each: 0.03,
      from: "random",
    },
  },
  "+=3",
);
tl.from(
  textoHero3.chars,
  {
    opacity: 0,
    duration: 1,
    stagger: {
      each: 0.03,
      from: "random",
    },
  },
  "-=1.5",
);

// ===== PLAYER DO TRAILER =====

const trailer = document.querySelector(".trailer");
const trailerVideo = document.querySelector(".trailerVideo");

trailer.addEventListener("click", () => {
  trailer.classList.add("playing");
  trailerVideo.currentTime = 0;
  trailerVideo.muted = false;
  trailerVideo.loop = false;
  trailerVideo.controls = true;
  trailerVideo.play();
});

// ===== SEÇÃO ELENCO =====
const atoresImg = gsap.utils.toArray(".atorImg");
const atoresBloco = gsap.utils.toArray(".atorBloco");
const nomesLista = gsap.utils.toArray(".progressoNomes li");
const TOTAL_ATORES = atoresImg.length;

const NOME_ATIVO = "rgba(255, 255, 255, 0.8)";
const NOME_INATIVO = "#666666";

// Quebra cada NOME de ator em caracteres (para animar letra a letra, igual
// aos 3 textos da hero). O subtitulo (papel) fica inteiro, so com opacidade.
const nomeSplits = atoresBloco.map((bloco) =>
  SplitText.create(bloco.querySelector("h3"), { type: "words, chars" }),
);
const subtitulos = atoresBloco.map((bloco) => bloco.querySelector("p"));
const staggerNome = { each: 0.03, from: "random" };

gsap.set(atoresImg, { height: 0 });
gsap.set(atoresImg[0], { height: "100%" });
// letras dos nomes invisiveis (exceto o 1o); subtitulos idem
nomeSplits.forEach((split, i) => {
  gsap.set(split.chars, { opacity: i === 0 ? 1 : 0 });
});
gsap.set(subtitulos, { opacity: 0 });
gsap.set(subtitulos[0], { opacity: 1 });
gsap.set(nomesLista, { color: NOME_INATIVO });
gsap.set(nomesLista[0], { color: NOME_ATIVO });

const elencoTl = gsap.timeline({
  scrollTrigger: {
    trigger: ".elenco",
    start: "top top",
    end: "+=4000",
    pin: true,
    scrub: 1,
  },
});

const DURACAO_TOTAL = TOTAL_ATORES - 1;
elencoTl.to(
  ".aranha",
  { top: "100%", ease: "none", duration: DURACAO_TOTAL },
  0,
);
elencoTl.to(
  ".trilhaFill",
  { height: "100%", ease: "none", duration: DURACAO_TOTAL },
  0,
);

// Uma transição por ator (do ator i-1 para o i)
for (let i = 1; i < TOTAL_ATORES; i++) {
  const pos = i - 1; // começa quando a aranha deixa o nó anterior

  // revela a imagem do ator i (a div ganha altura, de baixo p/ cima)
  elencoTl.to(
    atoresImg[i],
    { height: "100%", ease: "power2.inOut", duration: 1 },
    pos,
  );

  // nome anterior some: letras em ordem aleatoria (igual aos textos da hero)
  elencoTl.to(
    nomeSplits[i - 1].chars,
    { opacity: 0, duration: 0.6, stagger: staggerNome },
    pos,
  );
  elencoTl.to(subtitulos[i - 1], { opacity: 0, duration: 0.4 }, pos);
  // nome novo aparece: letras em ordem aleatoria; subtitulo surge inteiro
  elencoTl.to(
    nomeSplits[i].chars,
    { opacity: 1, duration: 0.6, stagger: staggerNome },
    pos + 0.4,
  );
  elencoTl.to(subtitulos[i], { opacity: 1, duration: 0.4 }, pos + 0.5);

  // acende o nome atual na lista e apaga o anterior
  elencoTl.to(nomesLista[i - 1], { color: NOME_INATIVO, duration: 0.5 }, pos);
  elencoTl.to(nomesLista[i], { color: NOME_ATIVO, duration: 0.5 }, pos);
}
