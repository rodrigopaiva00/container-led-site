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

const leadForm = document.getElementById('simulator-lead-form');
const simulator = document.getElementById('led-simulator');
const simulatorAccess = document.getElementById('simulator-access');
const simulatorWorkspace = document.getElementById('simulator-workspace');
let simulatorLead = {};

const formatNumber = (value, digits = 1) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function updateSimulation() {
  if (!simulator) return;
  const data = new FormData(simulator);
  const width = Number(data.get('largura')) || 0;
  const height = Number(data.get('altura')) || 0;
  const pitch = Number(data.get('pitch')) || 6;
  const hours = Number(data.get('horas')) || 12;
  const tariff = Number(data.get('tarifa')) || 0.95;
  const type = data.get('ambiente');
  const profiles = {
    outdoor: { label: 'Painel outdoor', weight: 42, power: 0.75 },
    indoor: { label: 'Painel indoor', weight: 28, power: 0.55 },
    totem: { label: 'Totem digital', weight: 35, power: 0.60 },
    testeira: { label: 'Testeira para posto', weight: 30, power: 0.50 }
  };
  const profile = profiles[type] || profiles.outdoor;
  const area = width * height;
  const pixelsWide = Math.max(1, Math.round(width * 1000 / pitch));
  const pixelsHigh = Math.max(1, Math.round(height * 1000 / pitch));
  const weight = area * profile.weight;
  const maxPower = area * profile.power;
  const monthlyConsumption = maxPower * 0.42 * hours * 30;
  const monthlyCost = monthlyConsumption * tariff;

  document.getElementById('result-area').textContent = formatNumber(area) + ' m²';
  document.getElementById('result-resolution').textContent = pixelsWide.toLocaleString('pt-BR') + ' × ' + pixelsHigh.toLocaleString('pt-BR') + ' px';
  document.getElementById('result-weight').textContent = Math.round(weight).toLocaleString('pt-BR') + ' kg';
  document.getElementById('result-power').textContent = formatNumber(maxPower) + ' kW';
  document.getElementById('result-consumption').textContent = Math.round(monthlyConsumption).toLocaleString('pt-BR') + ' kWh/mês';
  document.getElementById('result-cost').textContent = monthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + '/mês';
  document.getElementById('preview-size').textContent = formatNumber(width) + ' × ' + formatNumber(height) + ' m';

  const preview = document.getElementById('led-preview');
  preview.style.aspectRatio = Math.max(0.5, Math.min(3, width / height));
  preview.classList.toggle('portrait', width < height);

  const lines = [
    'SIMULAÇÃO DE PROJETO — CONTAINER LED',
    '',
    'Empresa: ' + (simulatorLead.empresa || ''),
    'Contato: ' + (simulatorLead.nome || ''),
    'Documento: ' + (simulatorLead.documento || 'Não informado'),
    'WhatsApp: ' + (simulatorLead.whatsapp || ''),
    'E-mail: ' + (simulatorLead.email || ''),
    '',
    'Solução: ' + profile.label,
    'Aplicação: ' + data.get('aplicacao'),
    'Dimensões: ' + formatNumber(width) + ' × ' + formatNumber(height) + ' m',
    'Área: ' + formatNumber(area) + ' m²',
    'Pixel pitch: P' + pitch,
    'Resolução estimada: ' + pixelsWide + ' × ' + pixelsHigh + ' px',
    'Peso estimado: ' + Math.round(weight) + ' kg',
    'Potência máxima: ' + formatNumber(maxPower) + ' kW',
    'Consumo estimado: ' + Math.round(monthlyConsumption) + ' kWh/mês',
    'Custo estimado de energia: ' + monthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + '/mês',
    '',
    'Gostaria de receber uma avaliação técnica e comercial.'
  ];
  const subject = 'Simulação Container LED — ' + (simulatorLead.empresa || 'Novo projeto');
  document.getElementById('simulator-whatsapp').href = 'https://wa.me/5534998940736?text=' + encodeURIComponent(lines.join('\n'));
  document.getElementById('simulator-email').href = 'mailto:xrodrigopaiva@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
}

if (leadForm && simulator) {
  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!leadForm.reportValidity()) return;
    simulatorLead = Object.fromEntries(new FormData(leadForm).entries());
    simulatorAccess.hidden = true;
    simulatorWorkspace.hidden = false;
    updateSimulation();
    simulatorWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  simulator.addEventListener('submit', (event) => {
    event.preventDefault();
    updateSimulation();
  });
  simulator.addEventListener('input', updateSimulation);
  simulator.addEventListener('change', updateSimulation);

  document.getElementById('simulator-reset').addEventListener('click', () => {
    simulatorWorkspace.hidden = true;
    simulatorAccess.hidden = false;
    simulatorAccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
