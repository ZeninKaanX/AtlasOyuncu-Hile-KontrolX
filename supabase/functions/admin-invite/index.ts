import { cors, json } from '../_shared/common.ts';

Deno.serve(async req => {
  const headers = cors(req.headers.get('Origin') || '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  return json({ error: 'Bu eski uç nokta kapatıldı. Davetleri yönetici panelinden oluşturun.' }, 410, headers);
});
