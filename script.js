const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

const closeMenu = () => {
  menu?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-open');
};

toggle?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('menu-open', open);
});

menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelectorAll('[data-interest]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.querySelector('[name="interesse"]');
    if (!select) return;
    const wanted = link.dataset.interest;
    const option = [...select.options].find(item => item.text.includes(wanted) || item.value === wanted);
    if (option) select.value = option.value;
  });
});

document.querySelectorAll('.map-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.location-card');
    const drawer = card.querySelector('.map-drawer');
    const open = drawer.hidden;
    drawer.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? '−' : '+';
  });
});

const simulator = document.getElementById('led-simulator');
simulator?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(simulator);
  const width = Number(data.get('largura'));
  const height = Number(data.get('altura'));
  const environment = data.get('ambiente');
  const application = data.get('aplicacao');
  const pitch = environment === 'indoor' ? 2.5 : 6;
  const area = width * height;
  const pixelsWide = Math.round((width * 1000) / pitch);
  const pixelsHigh = Math.round((height * 1000) / pitch);
  const power = area * (environment === 'indoor' ? 0.55 : 0.7);
  const divisor = (a, b) => b ? divisor(b, a % b) : a;
  const scaledWidth = Math.round(width * 10);
  const scaledHeight = Math.round(height * 10);
  const common = divisor(scaledWidth, scaledHeight);

  document.getElementById('result-area').textContent = `${area.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²`;
  document.getElementById('result-format').textContent = `${scaledWidth / common}:${scaledHeight / common}`;
  document.getElementById('result-resolution').textContent = `${pixelsWide} × ${pixelsHigh} px`;
  document.getElementById('result-power').textContent = `${power.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kW`;

  const message = [
    'Olá! Fiz uma simulação gratuita no site da Container LED.',
    '',
    `Ambiente: ${environment === 'indoor' ? 'Indoor' : 'Outdoor'}`,
    `Aplicação: ${application}`,
    `Dimensões: ${width} m × ${height} m`,
    `Área estimada: ${area.toFixed(1)} m²`,
    `Resolução estimada: ${pixelsWide} × ${pixelsHigh} px`,
    '',
    'Gostaria de receber uma avaliação técnica e uma proposta.'
  ];
  document.getElementById('simulator-whatsapp').href = `https://wa.me/5534999259499?text=${encodeURIComponent(message.join('\n'))}`;
  document.getElementById('simulator-result').hidden = false;
});

const quoteForm = document.getElementById('quote-form');
quoteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const lines = [
    'Olá! Vim pelo site da Container LED e gostaria de solicitar informações.',
    '',
    `Nome: ${data.get('nome')}`,
    `Empresa ou ramo de atuação: ${data.get('empresa') || 'Não informado'}`,
    `WhatsApp: ${data.get('telefone')}`,
    `Cidade/UF: ${data.get('cidade')}`,
    `Interesse: ${data.get('interesse')}`,
    `Mensagem: ${data.get('mensagem') || 'Sem detalhes adicionais'}`
  ];
  window.open(`https://wa.me/5534999259499?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

