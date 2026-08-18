const SITE_CONFIG = Object.freeze({
  TEST_MODE: true,
  TEST_WHATSAPP: '5534998940736',
  OFFICIAL_WHATSAPP: '5534999259499',
  COMPANY_EMAIL: 'containerled08@gmail.com',
  EMAIL_ENDPOINT: '/api/send-email'
});
const ACTIVE_WHATSAPP = SITE_CONFIG.TEST_MODE ? SITE_CONFIG.TEST_WHATSAPP : SITE_CONFIG.OFFICIAL_WHATSAPP;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const onlyDigits = (value) => clean(value).replace(/\D/g, '');
const isValidPhone = (value) => {
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 13;
};
const isValidEmail = (value) => !clean(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
const nonEmptyLine = (label, value) => {
  const safe = clean(value);
  return safe ? label + safe : null;
};
const setStatus = (element, message, error = false) => {
  if (!element) return;
  element.textContent = message;
  element.style.color = error ? '#ff7a45' : '';
};
const validateContactFields = (form, phoneName, emailName = null) => {
  if (!form.reportValidity()) return false;
  const data = new FormData(form);
  const phoneInput = form.elements[phoneName];
  if (!isValidPhone(data.get(phoneName))) {
    phoneInput.setCustomValidity('Informe um WhatsApp válido com DDD.');
    phoneInput.reportValidity();
    phoneInput.setCustomValidity('');
    return false;
  }
  if (emailName) {
    const emailInput = form.elements[emailName];
    if (!isValidEmail(data.get(emailName))) {
      emailInput.setCustomValidity('Informe um e-mail válido.');
      emailInput.reportValidity();
      emailInput.setCustomValidity('');
      return false;
    }
  }
  return true;
};
async function sendEmailCopy(subject, body, source) {
  const response = await fetch(SITE_CONFIG.EMAIL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: SITE_CONFIG.COMPANY_EMAIL, subject, body, source })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível enviar o e-mail.');
  return payload;
}

const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

const setMenuState = (open) => {
  if (!menu || !toggle) return;
  menu.classList.toggle('open', open);
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('menu-open', open);
};
const closeMenu = () => setMenuState(false);
if (menu && toggle) {
  toggle.addEventListener('click', () => setMenuState(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('hashchange', closeMenu);
  window.addEventListener('pageshow', closeMenu);
  window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); }, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
}
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
const quoteEmailCopy = document.getElementById('quote-email-copy');
const quoteStatus = document.getElementById('quote-send-status');
let quoteSending = false;

function getQuoteMessage() {
  const data = new FormData(quoteForm);
  const values = {
    nome: clean(data.get('nome')),
    empresa: clean(data.get('empresa')),
    telefone: clean(data.get('telefone')),
    cidade: clean(data.get('cidade')),
    interesse: clean(data.get('interesse')),
    mensagem: clean(data.get('mensagem'))
  };
  const lines = [
    'Olá! Novo contato recebido pelo site da Container LED.',
    '',
    nonEmptyLine('Nome: ', values.nome),
    nonEmptyLine('Empresa: ', values.empresa),
    nonEmptyLine('WhatsApp: ', values.telefone),
    nonEmptyLine('Cidade / UF: ', values.cidade),
    nonEmptyLine('Interesse: ', values.interesse),
    values.mensagem ? '' : null,
    values.mensagem ? 'Mensagem:' : null,
    values.mensagem || null,
    '',
    'Origem: Formulário do site Container LED.'
  ].filter((line) => line !== null);
  return {
    lines,
    subject: 'Novo contato do site — ' + (values.empresa || values.nome || 'Container LED')
  };
}

async function emailQuoteCopy() {
  if (quoteSending || !validateContactFields(quoteForm, 'telefone')) return false;
  quoteSending = true;
  if (quoteEmailCopy) quoteEmailCopy.disabled = true;
  setStatus(quoteStatus, 'Enviando cópia por e-mail...');
  try {
    const message = getQuoteMessage();
    await sendEmailCopy(message.subject, message.lines.join('\n'), 'formulario-contato');
    setStatus(quoteStatus, 'Cópia enviada com sucesso para o e-mail de validação.');
    return true;
  } catch (error) {
    setStatus(quoteStatus, error.message, true);
    return false;
  } finally {
    quoteSending = false;
    if (quoteEmailCopy) quoteEmailCopy.disabled = false;
  }
}

if (quoteForm) {
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateContactFields(quoteForm, 'telefone')) return;
    const submitButton = quoteForm.querySelector('[type="submit"]');
    if (submitButton?.disabled) return;
    submitButton.disabled = true;
    const message = getQuoteMessage();
    const whatsappUrl = 'https://wa.me/' + ACTIVE_WHATSAPP + '?text=' + encodeURIComponent(message.lines.join('\n'));
    window.open(whatsappUrl, '_blank', 'noopener');
    emailQuoteCopy().finally(() => { submitButton.disabled = false; });
  });
}
if (quoteEmailCopy) quoteEmailCopy.addEventListener('click', emailQuoteCopy);

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
const simulatorWhatsapp = document.getElementById('simulator-whatsapp');
const simulatorEmail = document.getElementById('simulator-email');
const simulatorStatus = document.getElementById('simulator-send-status');
let simulatorLead = {};
let latestSimulation = null;
let simulatorEmailSending = false;

const formatNumber = (value, digits = 1) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const formatMoney = (value, digits = 2) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

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
    outdoor: { label: 'Painel Outdoor', weight: 42, power: 0.75 },
    indoor: { label: 'Painel Indoor', weight: 28, power: 0.55 },
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
  const application = clean(data.get('aplicacao'));

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
    'Olá! Nova simulação realizada no site da Container LED.',
    '',
    'DADOS DO CLIENTE',
    '',
    nonEmptyLine('Empresa: ', simulatorLead.empresa),
    nonEmptyLine('Responsável: ', simulatorLead.nome),
    nonEmptyLine('CPF/CNPJ: ', simulatorLead.documento),
    nonEmptyLine('WhatsApp: ', simulatorLead.whatsapp),
    nonEmptyLine('E-mail: ', simulatorLead.email),
    '',
    'PROJETO',
    '',
    'Tipo de solução: ' + profile.label,
    nonEmptyLine('Aplicação: ', application),
    'Dimensões: ' + formatNumber(width) + ' m x ' + formatNumber(height) + ' m',
    'Área total: ' + formatNumber(area) + ' m²',
    'Pixel pitch: P' + String(pitch).replace('.', ','),
    '',
    'ESTIMATIVA TÉCNICA',
    '',
    'Resolução estimada: ' + pixelsWide.toLocaleString('pt-BR') + ' × ' + pixelsHigh.toLocaleString('pt-BR') + ' px',
    'Peso estimado: ' + Math.round(weight).toLocaleString('pt-BR') + ' kg',
    'Potência máxima: ' + formatNumber(maxPower) + ' kW',
    'Uso diário: ' + formatNumber(hours, 0) + ' horas',
    'Consumo estimado: ' + Math.round(monthlyConsumption).toLocaleString('pt-BR') + ' kWh/mês',
    'Tarifa informada: R$ ' + formatMoney(tariff) + '/kWh',
    'Custo estimado de energia: R$ ' + formatMoney(monthlyCost) + '/mês',
    '',
    'Origem: Simulador do site Container LED.',
    '',
    'Gostaria de receber uma avaliação comercial deste projeto.'
  ].filter((line) => line !== null);

  latestSimulation = {
    lines,
    subject: 'Nova simulação de painel LED — ' + (clean(simulatorLead.empresa) || 'Novo projeto')
  };
  simulatorWhatsapp.href = 'https://wa.me/' + ACTIVE_WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
}

async function emailSimulation() {
  if (simulatorEmailSending || !latestSimulation) return false;
  simulatorEmailSending = true;
  simulatorEmail.disabled = true;
  setStatus(simulatorStatus, 'Enviando resultado por e-mail...');
  try {
    await sendEmailCopy(latestSimulation.subject, latestSimulation.lines.join('\n'), 'simulador-painel');
    setStatus(simulatorStatus, 'Resultado enviado com sucesso para o e-mail de validação.');
    return true;
  } catch (error) {
    setStatus(simulatorStatus, error.message, true);
    return false;
  } finally {
    simulatorEmailSending = false;
    simulatorEmail.disabled = false;
  }
}

if (leadForm && simulator) {
  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateContactFields(leadForm, 'whatsapp', 'email')) return;
    simulatorLead = Object.fromEntries([...new FormData(leadForm).entries()].map(([key, value]) => [key, clean(value)]));
    simulatorAccess.hidden = true;
    simulatorWorkspace.hidden = false;
    updateSimulation();
    simulatorWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  simulator.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!simulator.reportValidity()) return;
    updateSimulation();
  });
  simulator.addEventListener('input', updateSimulation);
  simulator.addEventListener('change', updateSimulation);

  document.getElementById('simulator-reset').addEventListener('click', () => {
    simulatorWorkspace.hidden = true;
    simulatorAccess.hidden = false;
    setStatus(simulatorStatus, '');
    simulatorAccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
if (simulatorEmail) simulatorEmail.addEventListener('click', emailSimulation);
if (simulatorWhatsapp) simulatorWhatsapp.addEventListener('click', () => {
  if (!latestSimulation) return;
  emailSimulation();
});


// Reprodução inteligente dos vídeos da seção Soluções
const solutionVideos = document.querySelectorAll('.solution-video');

const setSolutionVideoButton = (video, playing) => {
  const button = video.closest('.solution-video-media')?.querySelector('.solution-video-toggle');
  if (!button) return;
  const title = button.dataset.title || 'Solução';
  button.textContent = playing ? 'Ⅱ' : '▶';
  button.setAttribute('aria-label', (playing ? 'Pausar vídeo de ' : 'Reproduzir vídeo de ') + title);
};

const solutionVideoObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio >= 0.32) {
      video.play().then(() => setSolutionVideoButton(video, true)).catch(() => setSolutionVideoButton(video, false));
    } else {
      video.pause();
      setSolutionVideoButton(video, false);
    }
  });
}, { threshold: [0, 0.32, 0.65] }) : null;

solutionVideos.forEach((video) => {
  if (solutionVideoObserver) solutionVideoObserver.observe(video);
  video.addEventListener('play', () => setSolutionVideoButton(video, true));
  video.addEventListener('pause', () => setSolutionVideoButton(video, false));
});

document.querySelectorAll('.solution-video-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const video = button.closest('.solution-video-media')?.querySelector('.solution-video');
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setSolutionVideoButton(video, false));
    } else {
      video.pause();
    }
  });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) solutionVideos.forEach((video) => video.pause());
});




// Controle acessível do vídeo principal
const heroMainVideo = document.querySelector('.hero-main-video');
const heroMainVideoToggle = document.querySelector('.hero-video-toggle');

const updateHeroVideoToggle = () => {
  if (!heroMainVideo || !heroMainVideoToggle) return;
  const playing = !heroMainVideo.paused;
  heroMainVideoToggle.textContent = playing ? 'Ⅱ' : '▶';
  heroMainVideoToggle.setAttribute('aria-label', playing ? 'Pausar vídeo principal' : 'Reproduzir vídeo principal');
};

if (heroMainVideo && heroMainVideoToggle) {
  heroMainVideo.addEventListener('play', updateHeroVideoToggle);
  heroMainVideo.addEventListener('pause', updateHeroVideoToggle);
  heroMainVideoToggle.addEventListener('click', () => {
    if (heroMainVideo.paused) {
      heroMainVideo.play().catch(updateHeroVideoToggle);
    } else {
      heroMainVideo.pause();
    }
  });
  updateHeroVideoToggle();
}


document.getElementById('year').textContent = new Date().getFullYear();
