// _worker.js — Cloudflare Pages Worker (compatible con drag & drop upload)
// Este archivo en la RAÍZ del proyecto habilita el Worker sin necesitar Functions

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Solo interceptar /api/matches — todo lo demás lo sirve Pages normalmente
    if (url.pathname === '/api/matches') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (!env.FOOTBALL_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'FOOTBALL_API_KEY no configurada en Environment variables de Pages' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const resp = await fetch(
          'https://api.football-data.org/v4/competitions/WC/matches',
          { headers: { 'X-Auth-Token': env.FOOTBALL_API_KEY, 'Accept': 'application/json' } }
        );

        if (!resp.ok) {
          const detail = await resp.text().catch(() => '');
          return new Response(
            JSON.stringify({ error: 'football-data.org respondio ' + resp.status, detail: detail.slice(0, 200) }),
            { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        });

      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Error interno', detail: err.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Para todas las demás rutas, dejar que Cloudflare Pages sirva los archivos estáticos
    return env.ASSETS.fetch(request);
  },
};
