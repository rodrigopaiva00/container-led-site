# Container LED — site institucional

Site estático publicado no Cloudflare Pages, com uma Pages Function para o envio seguro de cópias dos formulários por e-mail.

## Modo de teste

As configurações ficam centralizadas no início de `script-v18.js`:

- `TEST_MODE`: ativado somente quando a URL contém `?test=1`
- `TEST_WHATSAPP: 5534998940736`
- `OFFICIAL_WHATSAPP: 5534999259499`
- `COMPANY_EMAIL: containerled08@gmail.com`

Na URL pública normal, os links usam o WhatsApp oficial. Para validar os fluxos sem afetar o atendimento oficial, acesse `https://container-led-site.pages.dev/?test=1#simulador`; nessa URL os links usam exclusivamente o WhatsApp de teste.

## Configuração do e-mail no Cloudflare Pages

O frontend chama `/api/contact-delivery`. A função está em `functions/api/contact-delivery.js` e usa a API do Resend. Nenhuma credencial fica no navegador ou no repositório.

No painel do Cloudflare:

1. Abra **Workers & Pages → container-led-site → Settings → Variables and Secrets**.
2. Adicione `RESEND_API_KEY` como **Secret**.
3. Adicione `EMAIL_FROM` como variável, usando um remetente verificado no Resend, por exemplo `Container LED <site@seudominio.com.br>`.
4. Adicione `COMPANY_EMAIL` com o valor `containerled08@gmail.com`.
5. Salve e faça um novo deploy.

O plano gratuito do Resend pode ser usado, respeitando os limites vigentes do serviço. O domínio/remetente precisa estar verificado no Resend. Enquanto as variáveis não existirem, a função responde com uma mensagem clara e não expõe qualquer segredo.

## Fluxos

### Simulador

1. Valida empresa, responsável, WhatsApp, e-mail opcional e consentimento.
2. Mantém os cálculos técnicos no navegador.
3. Gera o WhatsApp com a mensagem preenchida; o usuário confirma o envio.
4. O botão de e-mail envia a mesma simulação pela Pages Function.
5. O clique no WhatsApp também solicita a cópia por e-mail, sem enviar a mensagem do WhatsApp automaticamente.

### Formulário principal

1. Valida os campos obrigatórios e o WhatsApp.
2. Abre o WhatsApp com a mensagem preenchida.
3. Envia uma cópia do contato para o e-mail configurado.
4. O botão de cópia permite reenviar o e-mail separadamente.

## Segurança

- Sem SMTP, tokens ou senhas no frontend.
- Destinatário definido no ambiente do Cloudflare.
- Assunto, corpo e origem validados pela função.
- Mensagens do WhatsApp são apenas pré-preenchidas; o usuário precisa pressionar **Enviar**.
