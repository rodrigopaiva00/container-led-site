const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }
});

const clean = (value, max = 10000) => String(value ?? '').replace(/\r/g, '').trim().slice(0, max);

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return json({ error: 'Formato inválido.' }, 415);

    const data = await request.json();
    const subject = clean(data.subject, 180);
    const body = clean(data.body, 12000);
    const source = clean(data.source, 80);
    if (!subject || !body) return json({ error: 'Assunto e mensagem são obrigatórios.' }, 400);
    if (!['simulador-painel', 'formulario-contato'].includes(source)) return json({ error: 'Origem inválida.' }, 400);

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return json({ error: 'Envio de e-mail ainda não configurado no Cloudflare.' }, 503);
    }

    const destination = env.COMPANY_EMAIL || 'containerled08@gmail.com';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [destination],
        subject,
        text: body,
        headers: { 'X-Container-LED-Source': source }
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Falha no provedor de e-mail', response.status, result);
      return json({ error: 'Não foi possível concluir o envio do e-mail.' }, 502);
    }

    return json({ ok: true, id: result.id || null });
  } catch (error) {
    console.error('Erro no envio de e-mail', error);
    return json({ error: 'Erro inesperado ao enviar o e-mail.' }, 500);
  }
}

export function onRequest() {
  return json({ error: 'Método não permitido.' }, 405);
}
