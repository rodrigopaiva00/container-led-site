export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const assetUrl = new URL("/tela-digital.html", requestUrl.origin);
  const assetResponse = await context.env.ASSETS.fetch(assetUrl);
  if (!assetResponse.ok) return assetResponse;

  const slug = String(context.params.slug || "");
  const html = (await assetResponse.text()).replace(
    "</head>",
    `<script>window.CONTAINER_LED_TELA_SLUG=${JSON.stringify(slug)};<\/script></head>`
  );
  const headers = new Headers(assetResponse.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "public, max-age=300");
  return new Response(html, { status: 200, headers });
}
