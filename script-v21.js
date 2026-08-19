const SITE_CONFIG = Object.freeze({
  OFFICIAL_WHATSAPP: '5534999259499',
  COMPANY_EMAIL: 'containerled08@gmail.com',
  EMAIL_ENDPOINT: '/api/contact-delivery'
});
const ACTIVE_WHATSAPP = SITE_CONFIG.OFFICIAL_WHATSAPP;

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


const interestSelect = quoteForm?.querySelector('select[name="interesse"]');
const quoteSimulatorEntry = document.getElementById('quote-simulator-entry');
const syncQuoteSimulatorEntry = () => {
  if (!interestSelect || !quoteSimulatorEntry) return;
  quoteSimulatorEntry.hidden = clean(interestSelect.value) !== 'Comprar um painel de LED';
};
if (interestSelect) { interestSelect.addEventListener('change', syncQuoteSimulatorEntry); syncQuoteSimulatorEntry(); }

const simulator = document.getElementById('led-simulator');
const leadForm = document.getElementById('simulator-lead-form');
const leadStep = document.getElementById('simulator-lead-step');
const simulatorResult = document.getElementById('simulator-result');
const simulatorWhatsapp = document.getElementById('simulator-whatsapp');
const simulatorEmail = document.getElementById('simulator-email');
const simulatorStatus = document.getElementById('simulator-send-status');
let simulatorLead = {}, latestSimulation = null, simulatorEmailSending = false;
const formatNumber = (value, digits = 1) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const simulatorSolution = document.getElementById('simulator-solution');
const simulatorWidth = document.getElementById('simulator-width');
const simulatorHeight = document.getElementById('simulator-height');
const simulatorSizeLock = document.getElementById('simulator-size-lock');

function syncTotemDimensions() {
  const isTotem = clean(simulatorSolution?.value).toLowerCase() === 'totem digital';
  if (isTotem) {
    simulatorWidth.value = '0.6';
    simulatorHeight.value = '2';
  }
  simulatorWidth.disabled = isTotem;
  simulatorHeight.disabled = isTotem;
  simulatorSizeLock.hidden = !isTotem;
}
if (simulatorSolution) {
  simulatorSolution.addEventListener('change', syncTotemDimensions);
  syncTotemDimensions();
}

function calculateSimulation() {
  if (!simulator) return null;
  const application = clean(simulatorSolution?.value);
  const isTotem = application.toLowerCase() === 'totem digital';
  const width = isTotem ? 0.6 : Math.max(1, Math.round(Number(simulatorWidth?.value) || 3));
  const height = isTotem ? 2 : Math.max(1, Math.round(Number(simulatorHeight?.value) || 2));
  const profiles = {
    totem: {label:'Totem digital',pitch:3,weight:35,power:.60},
    indoor:{label:'Painel indoor',pitch:3,weight:28,power:.55},
    outdoor:{label:'Painel de LED',pitch:6,weight:42,power:.75}
  };
  const indoorApplications = ['Ambiente interno','Shopping center','Bar','Clínica','Escritório'];
  const profile = isTotem ? profiles.totem : (indoorApplications.includes(application) ? profiles.indoor : profiles.outdoor);
  const area=width*height;
  return {width,height,application,profile,area,pixelsWide:Math.max(1,Math.round(width*1000/profile.pitch)),pixelsHigh:Math.max(1,Math.round(height*1000/profile.pitch)),weight:area*profile.weight,maxPower:area*profile.power};
}
function renderSimulation() {
  const result=calculateSimulation(); if(!result)return;
  const {width,height,application,profile,area,pixelsWide,pixelsHigh,weight,maxPower}=result;
  document.getElementById('result-area').textContent=formatNumber(area,0)+' m²';
  document.getElementById('result-resolution').textContent=pixelsWide.toLocaleString('pt-BR')+' × '+pixelsHigh.toLocaleString('pt-BR')+' px';
  document.getElementById('result-weight').textContent=Math.round(weight).toLocaleString('pt-BR')+' kg';
  document.getElementById('result-power').textContent=formatNumber(maxPower)+' kW';
  document.getElementById('preview-size').textContent=width+' × '+height+' m';
  const preview=document.getElementById('led-preview'); preview.style.aspectRatio=Math.max(.45,Math.min(2.6,width/height)); preview.classList.toggle('portrait',width<height);
  const lines=['Gerei meu painel digital no site, quero ter mais informações','','DADOS DO CLIENTE',nonEmptyLine('Nome / Empresa: ',simulatorLead.nome_empresa),nonEmptyLine('Telefone: ',simulatorLead.telefone),'','PROJETO SIMULADO','Tipo de solução: '+profile.label,nonEmptyLine('Aplicação: ',application),'Dimensões aproximadas: '+width+' m x '+height+' m','Área total: '+formatNumber(area,0)+' m²','Resolução estimada: '+pixelsWide.toLocaleString('pt-BR')+' × '+pixelsHigh.toLocaleString('pt-BR')+' px','Peso estimado: '+Math.round(weight).toLocaleString('pt-BR')+' kg','Potência máxima: '+formatNumber(maxPower)+' kW','','Origem: Simulador gratuito do site Container LED.'].filter(line=>line!==null);
  latestSimulation={lines,subject:'Novo painel simulado — '+(clean(simulatorLead.nome_empresa)||'Novo projeto')};
  simulatorWhatsapp.href='https://wa.me/'+ACTIVE_WHATSAPP+'?text='+encodeURIComponent(lines.join('\n'));
  simulatorResult.hidden=false; simulatorResult.scrollIntoView({behavior:'smooth',block:'center'});
}
async function emailSimulation(){
  if(simulatorEmailSending||!latestSimulation)return false;
  simulatorEmailSending=true;simulatorEmail.disabled=true;setStatus(simulatorStatus,'Enviando resultado por e-mail...');
  try{await sendEmailCopy(latestSimulation.subject,latestSimulation.lines.join('\n'),'simulador-painel');setStatus(simulatorStatus,'Resultado enviado com sucesso por e-mail.');return true}
  catch(error){setStatus(simulatorStatus,error.message,true);return false}
  finally{simulatorEmailSending=false;simulatorEmail.disabled=false}
}
if(simulator&&leadForm){
  simulator.addEventListener('submit',event=>{event.preventDefault();if(!simulator.reportValidity())return;leadStep.hidden=false;simulatorResult.hidden=true;leadStep.scrollIntoView({behavior:'smooth',block:'center'});leadForm.querySelector('input')?.focus({preventScroll:true})});
  leadForm.addEventListener('submit',event=>{event.preventDefault();if(!leadForm.reportValidity())return;if(!validateContactFields(leadForm,'telefone'))return;simulatorLead=Object.fromEntries([...new FormData(leadForm).entries()].map(([key,value])=>[key,clean(value)]));renderSimulation()});
}
if(simulatorEmail)simulatorEmail.addEventListener('click',emailSimulation);
if(simulatorWhatsapp)simulatorWhatsapp.addEventListener('click',()=>{if(latestSimulation)emailSimulation()});


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
