(() => {
  "use strict";
  const telas = Array.isArray(window.CONTAINER_LED_TELAS) ? window.CONTAINER_LED_TELAS : [];
  const whatsapp = "5534999259499";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const present = (value) => value !== null && value !== undefined && String(value).trim() !== "";
  const telaNumber = (id) => "TELA " + String(id).padStart(2, "0");
  const dimensions = (tela) => present(tela.altura) && present(tela.largura) ? tela.altura + " m de altura × " + tela.largura + " m de largura" : "";
  const locality = (tela) => [tela.cidade, tela.estado].filter(present).join(" / ");
  const statusClass = (status) => String(status).toLowerCase().includes("constru") ? "is-building" : "is-live";
  const detailUrl = (tela) => "/telas-digitais/" + encodeURIComponent(tela.slug);
  const media = (tela, large = false) => tela.imagem
    ? `<img src="${esc(tela.imagem)}" alt="${esc(tela.imagemAlt || tela.nome)}" loading="${large ? "eager" : "lazy"}">`
    : `<div class="screen-placeholder" role="img" aria-label="Imagem da ${esc(tela.nome)} em breve"><span>IMAGEM EM BREVE</span></div>`;

  const setMenu = () => {
    const button = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".main-nav");
    if (!button || !menu) return;
    const close = () => { menu.classList.remove("open"); button.classList.remove("open"); button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-label", "Abrir menu"); };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      menu.classList.toggle("open", open);
      button.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
    window.addEventListener("resize", () => { if (window.innerWidth > 960) close(); }, {passive:true});
  };

  const renderCatalog = () => {
    const grid = document.getElementById("screens-catalog");
    if (!grid) return;
    grid.innerHTML = telas.map(tela => {
      const address = present(tela.endereco) ? `<p class="screen-address">${esc(tela.endereco)}</p>` : "";
      const neighborhood = present(tela.bairro) ? `<p class="screen-neighborhood">${esc(tela.bairro)}</p>` : "";
      const dims = dimensions(tela);
      const maps = present(tela.googleMaps)
        ? `<a class="catalog-button catalog-button-secondary" href="${esc(tela.googleMaps)}" target="_blank" rel="noopener">VER NO GOOGLE MAPS ↗</a>`
        : `<span class="catalog-button catalog-button-disabled" aria-disabled="true">LOCALIZAÇÃO EM BREVE</span>`;
      return `<article class="screen-card">
        <a class="screen-card-media" href="${detailUrl(tela)}" aria-label="Conhecer ${esc(tela.nome)}">
          ${media(tela)}
          <span class="screen-status ${statusClass(tela.status)}">${esc(tela.status)}</span>
        </a>
        <div class="screen-card-body">
          <span class="screen-id">${telaNumber(tela.id)}</span>
          <h2>${esc(tela.nome)}</h2>
          ${address}${neighborhood}
          <p class="screen-city">${esc(locality(tela))}</p>
          ${dims ? `<dl><div><dt>Dimensões</dt><dd>${esc(dims)}</dd></div></dl>` : ""}
          <div class="screen-card-actions">
            <a class="catalog-button catalog-button-primary" href="${detailUrl(tela)}">CONHECER ESTA TELA</a>
            ${maps}
          </div>
        </div>
      </article>`;
    }).join("");
  };

  const detailFacts = (tela) => [
    ["Dimensões", dimensions(tela)],
    ["Status", tela.status],
    ["Audiência", tela.audiencia],
    ["Inserções", tela.insercoes],
    ["Resolução", tela.resolucao],
    ["Horário de funcionamento", tela.horario],
    ["Duração dos anúncios", tela.duracao]
  ].filter(([,value]) => present(value));

  const whatsappUrl = (tela) => {
    const lines = [
      "Olá! Vim pelo site da Container LED.",
      "",
      "Gostaria de anunciar nesta tela:",
      "",
      present(tela.nome) ? "Tela: " + tela.nome : "",
      present(tela.endereco) ? "Endereço: " + tela.endereco : "",
      present(locality(tela)) ? "Cidade: " + locality(tela) : "",
      "",
      "Gostaria de receber informações sobre disponibilidade, planos e valores para anunciar neste ponto."
    ].filter(line => line !== "");
    return "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));
  };

  const renderDetail = () => {
    const root = document.getElementById("screen-detail");
    if (!root) return;
    const slug = window.CONTAINER_LED_TELA_SLUG || new URLSearchParams(location.search).get("slug") || decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "");
    const tela = telas.find(item => item.slug === slug);
    if (!tela) {
      document.title = "Tela não encontrada | Container LED";
      root.innerHTML = `<section class="screen-not-found"><div class="container"><span>CATÁLOGO DE TELAS</span><h1>Tela não encontrada.</h1><p>O endereço informado não corresponde a uma tela cadastrada.</p><a class="catalog-button catalog-button-primary" href="/telas-digitais">VOLTAR PARA TODAS AS TELAS</a></div></section>`;
      return;
    }
    document.title = tela.nome + " | Telas Digitais Container LED";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = "Conheça a tela digital " + tela.nome + " da Container LED em " + locality(tela) + ".";
    const facts = detailFacts(tela).map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
    const addressParts = [tela.endereco, tela.bairro, locality(tela)].filter(present);
    const mapSection = present(tela.mapaEmbed) ? `<section class="screen-map-section"><div class="container screen-map-grid"><div><span class="catalog-kicker">LOCALIZAÇÃO</span><h2>Veja onde sua marca vai aparecer.</h2><p>${addressParts.map(esc).join("<br>")}</p><a class="catalog-button catalog-button-primary" href="${esc(tela.googleMaps)}" target="_blank" rel="noopener">VER NO GOOGLE MAPS ↗</a></div><iframe title="Mapa da tela ${esc(tela.nome)}" src="${esc(tela.mapaEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div></section>` : `<section class="screen-location-pending"><div class="container"><span>LOCALIZAÇÃO</span><h2>Informações em atualização.</h2><p>Os dados completos deste ponto serão publicados assim que estiverem confirmados.</p></div></section>`;
    root.innerHTML = `
      <section class="screen-detail-hero"><div class="container">
        <a class="screen-back" href="/telas-digitais">← VOLTAR PARA TODAS AS TELAS</a>
        <div class="screen-detail-grid">
          <div class="screen-detail-copy">
            <span class="catalog-kicker">${telaNumber(tela.id)} · ${esc(locality(tela))}</span>
            <span class="screen-status ${statusClass(tela.status)}">${esc(tela.status)}</span>
            <h1>${esc(tela.nome)}</h1>
            ${present(tela.descricao) ? `<p>${esc(tela.descricao)}</p>` : ""}
            ${addressParts.length ? `<address>${addressParts.map(esc).join("<br>")}</address>` : ""}
            <a class="catalog-button catalog-button-primary screen-whatsapp" href="${whatsappUrl(tela)}" target="_blank" rel="noopener">QUERO ANUNCIAR NESTA TELA ↗</a>
          </div>
          <figure class="screen-detail-photo">${media(tela, true)}</figure>
        </div>
      </div></section>
      <section class="screen-facts"><div class="container"><dl>${facts}</dl></div></section>
      ${mapSection}
      <section class="screen-detail-footer-cta"><div class="container"><p>Conheça os outros pontos da rede Container LED.</p><a class="catalog-button catalog-button-secondary" href="/telas-digitais">VOLTAR PARA TODAS AS TELAS</a></div></section>`;
  };

  setMenu();
  renderCatalog();
  renderDetail();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();