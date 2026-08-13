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

document.getElementById('quote-form').addEventListener('submit', (event) => {
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

document.getElementById('year').textContent = new Date().getFullYear();
