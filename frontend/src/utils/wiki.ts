export type WikiInfo = { extract?: string | null; thumbnail?: string | null } | null;

export async function fetchWikiInfo(name: string, width?: number): Promise<WikiInfo> {
    const langs = ["pt", "en"];

    for (const lang of langs) {
        try {
            const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
                name
            )}&srlimit=1&origin=*`;
            const searchResp = await fetch(searchUrl);
            if (!searchResp.ok) continue;
            const searchJson = await searchResp.json();
            const first = searchJson.query?.search?.[0];
            if (!first) continue;

            const title = first.title.replace(/ /g, "_");
            const sumResp = await fetch(
                `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            );
            if (!sumResp.ok) continue;
            const sumJson = await sumResp.json();
            const extract = sumJson.extract ?? null;
            let thumbnail = sumJson.thumbnail?.source ?? null;
            if (thumbnail && width) {
                // tenta preservar largura quando possível (Commons/FilePath aceita ?width)
                thumbnail = thumbnail.includes("Special:FilePath")
                    ? `${thumbnail}?width=${width}`
                    : thumbnail;
            }
            return { extract, thumbnail };
        } catch {
            /* ignore and try next language */
        }
    }

    // fallback para Wikidata Commons (busca P18)
    try {
        const sd = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=pt&type=item&search=${encodeURIComponent(
            name
        )}&origin=*`;
        const sdResp = await fetch(sd);
        if (!sdResp.ok) return null;
        const sdJson = await sdResp.json();
        const first = sdJson.search?.[0];
        if (!first) return null;
        const id = first.id;

        const gUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(
            id
        )}&props=claims&origin=*`;
        const gResp = await fetch(gUrl);
        if (!gResp.ok) return null;
        const gJson = await gResp.json();
        const entity = gJson.entities?.[id];
        const claims = entity?.claims?.P18;
        if (Array.isArray(claims) && claims.length > 0) {
            let fileName = claims[0].mainsnak?.datavalue?.value;
            if (fileName) {
                fileName = fileName.replace(/^File:/i, "").trim();
                const encoded = encodeURIComponent(fileName).replace(/\+/g, "%20");
                const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}${width ? `?width=${width}` : ""}`;
                return { extract: first.description ?? null, thumbnail: imageUrl };
            }
        }
    } catch {
        /* ignore */
    }

    return null;
}