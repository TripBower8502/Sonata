import { NextRequest, NextResponse } from 'next/server';

interface WikiSearchResult {
  id: string;
  url: string | null;
  thumbUrl: string | null;
  title: string | null;
  isAnimated: boolean;
  isVideo: boolean;
  description: string | null;
}

const IMAGE_EXTS = ['.gif', '.jpg', '.jpeg', '.png', '.svg', '.tif', '.tiff'];

function rankExt(title: string): number {
  const t = title.toLowerCase();
  if (t.endsWith('.gif')) return 3;
  if (t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.png')) return 2;
  if (t.endsWith('.svg')) return 1;
  return 0;
}

async function tryQuery(id: string, query: string): Promise<WikiSearchResult | null> {
  const base = 'https://commons.wikimedia.org/w/api.php';
  const searchUrl = `${base}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=50&format=json&origin=*`;
  const searchRes = await fetch(searchUrl, {});
  const searchData = await searchRes.json();
  const hits: Array<{ title: string }> = searchData?.query?.search ?? [];
  if (hits.length === 0) return null;

  const usable = hits
    .filter(h => IMAGE_EXTS.some(ext => h.title.toLowerCase().endsWith(ext)))
    .sort((a, b) => rankExt(b.title) - rankExt(a.title));

  if (usable.length === 0) return null;

  // Prefer GIFs; if any GIFs exist pick randomly from them, else pick randomly from all usable
  const gifs = usable.filter(h => h.title.toLowerCase().endsWith('.gif'));
  const pool = gifs.length > 0 ? gifs : usable;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  const infoUrl = `${base}?action=query&titles=${encodeURIComponent(chosen.title)}&prop=imageinfo&iiprop=url|thumburl|mediatype|extmetadata&iiurlwidth=480&format=json&origin=*`;
  const infoRes = await fetch(infoUrl, {});
  const infoData = await infoRes.json();
  const pages: Record<string, { imageinfo?: Array<{ url: string; thumburl?: string; extmetadata?: { ImageDescription?: { value: string } } }> }> = infoData?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;

  const lower = info.url.toLowerCase();
  const isAnimated = lower.endsWith('.gif');
  const isVideo = false;
  const rawDesc = info.extmetadata?.ImageDescription?.value ?? null;
  const description = rawDesc ? rawDesc.replace(/<[^>]+>/g, '').slice(0, 200) : null;

  return { id, url: info.url, thumbUrl: info.thumburl ?? info.url, title: chosen.title.replace('File:', ''), isAnimated, isVideo, description };
}

async function searchWikimedia(id: string, queries: string[]): Promise<WikiSearchResult> {
  // Shuffle so a different query leads each round → different images each quiz
  const shuffled = [...queries].sort(() => Math.random() - 0.5);
  for (const query of shuffled) {
    try {
      const result = await tryQuery(id, query);
      if (result) return result;
    } catch { /* try next query */ }
  }
  return { id, url: null, thumbUrl: null, title: null, isAnimated: false, isVideo: false, description: null };
}

export async function POST(req: NextRequest) {
  let body: { searches: Array<{ id: string; query: string; queries?: string[] }> };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(body.searches) || body.searches.length === 0)
    return NextResponse.json({ error: 'searches array required' }, { status: 400 });

  const searches = body.searches.slice(0, 10);
  try {
    const results = await Promise.all(
      searches.map(({ id, query, queries }) =>
        searchWikimedia(id, queries ?? [query]).catch(() => ({
          id, url: null, thumbUrl: null, title: null, isAnimated: false, isVideo: false, description: null,
        }))
      )
    );
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Search failed' }, { status: 500 });
  }
}
