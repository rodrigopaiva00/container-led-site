const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

const closeMenu = () => {
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-open');
};

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('menu-open', open);
});

menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelectorAll('[data-interest]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.querySelector('[name="interesse"]');
    const wanted = link.dataset.interest;
    const option = [...select.options].find(item => item.text.includes(wanted) || item.value === wanted);
    if (option) select.value = option.value;
  });
});

const quoteForm = document.getElementById('quote-form');
if (quoteForm) {
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = [
      'Olá! Vim pelo site da Container LED e gostaria de solicitar informações.',
      '',
      `Nome: ${data.get('nome')}`,
      `Empresa: ${data.get('empresa') || 'Não informada'}`,
      `WhatsApp: ${data.get('telefone')}`,
      `Cidade/UF: ${data.get('cidade')}`,
      `Interesse: ${data.get('interesse')}`,
      `Mensagem: ${data.get('mensagem') || 'Sem detalhes adicionais'}`
    ];
    window.open(`https://wa.me/5534999259499?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });
}

document.querySelectorAll('.map-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const drawer = button.closest('.location-card').querySelector('.map-drawer');
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
});

const simulator = document.getElementById('led-simulator');
if (simulator) {
  simulator.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(simulator);
    const width = Number(data.get('largura'));
    const height = Number(data.get('altura'));
    const area = width * height;
    const outdoor = data.get('ambiente') === 'outdoor';
    const pitch = outdoor ? 6 : 3;
    const pixelsWide = Math.round(width * 1000 / pitch);
    const pixelsHigh = Math.round(height * 1000 / pitch);
    const power = area * (outdoor ? 0.7 : 0.45);
    document.getElementById('result-area').textContent = area.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' m²';
    document.getElementById('result-format').textContent = (width / height).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ':1';
    document.getElementById('result-resolution').textContent = pixelsWide + ' × ' + pixelsHigh + ' px';
    document.getElementById('result-power').textContent = power.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' kW';
    const message = ['Olá! Fiz uma simulação grátis no site da Container LED.','','Ambiente: ' + data.get('ambiente'),'Aplicação: ' + data.get('aplicacao'),'Dimensões: ' + width + ' m × ' + height + ' m','Área estimada: ' + area.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' m²','Gostaria de receber uma avaliação do projeto.'].join('\n');
    document.getElementById('simulator-whatsapp').href = 'https://wa.me/5534999259499?text=' + encodeURIComponent(message);
    document.getElementById('simulator-result').hidden = false;
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
