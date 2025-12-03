package ua.tqs.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ua.tqs.model.Tool;
import ua.tqs.service.ToolService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ImageEnrichmentService {
    private final ToolService toolService;
    private final WikidataService wikidataService;
    private final RestTemplate rest = new RestTemplate();

    // Executa ao arranque e depois diariamente (ajusta conforme necessário)
    @Scheduled(initialDelay = 10_000, fixedDelay = 24 * 60 * 60 * 1000)
    public void enrichAll() {
        List<Tool> tools = toolService.listAll();
        for (Tool t : tools) {
            try {
                boolean needsImage = t.getImageUrl() == null || t.getImageUrl().isBlank();
                boolean needsDesc  = t.getDescription() == null || t.getDescription().isBlank();
                if (!needsImage && !needsDesc) continue;

                WikipediaSummary w = fetchWikipediaSummary(t.getName());
                if (w != null) {
                    if (needsImage && w.thumbnail != null && w.thumbnail.source != null) {
                        t.setImageUrl(w.thumbnail.source);
                        t.setImageSource("wikipedia");
                        t.setImageFetchedAt(Instant.now());
                    }
                    if (needsDesc && w.extract != null) {
                        t.setDescription(w.extract);
                    }
                    // se wikidata foi usado como fallback, wikidataId pode vir preenchido via fetch
                    if (w.wikidataId != null && !w.wikidataId.isBlank()) {
                        t.setWikidataId(w.wikidataId);
                    }
                    toolService.create(t); // use método de persistência apropriado
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    private WikipediaSummary fetchWikipediaSummary(String name) {
        try {
            String title = URLEncoder.encode(name.replace(' ', '_'), StandardCharsets.UTF_8);
            String[] langs = {"en", "pt"};
            for (String lang : langs) {
                try {
                    String url = "https://" + lang + ".wikipedia.org/api/rest_v1/page/summary/" + title;
                    ResponseEntity<WikipediaSummary> r = rest.getForEntity(url, WikipediaSummary.class);
                    if (r.getStatusCode().is2xxSuccessful() && r.getBody() != null) {
                        return r.getBody();
                    }
                } catch (Exception ignored) {
                    // tenta próximo idioma
                }
            }

            // Fallback para Wikidata: tenta obter P18 (imagem no Commons)
            Optional<WikidataResult> wd = wikidataService.findByLabel(name, "pt");
            if (wd.isPresent()) {
                WikidataResult res = wd.get();
                WikipediaSummary fallback = new WikipediaSummary();
                fallback.title = name;
                fallback.extract = null;
                fallback.wikidataId = res.getId();
                fallback.thumbnail = new WikipediaSummary.Thumbnail();
                fallback.thumbnail.source = res.getImageUrl();
                return fallback;
            }
        } catch (Exception e) {
            // ignora e retorna null
        }
        return null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class WikipediaSummary {
        public String title;
        public String extract;
        public String wikidataId;
        public Thumbnail thumbnail;
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class Thumbnail { public String source; public int width; public int height; }
    }
}
