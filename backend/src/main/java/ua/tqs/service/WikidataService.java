package ua.tqs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class WikidataService {

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public Optional<WikidataResult> findByLabel(String label, String lang) {
        try {
            String searchUrl = UriComponentsBuilder.fromHttpUrl("https://www.wikidata.org/w/api.php")
                    .queryParam("action", "wbsearchentities")
                    .queryParam("format", "json")
                    .queryParam("language", lang)
                    .queryParam("type", "item")
                    .queryParam("search", label)
                    .build().toUriString();

            String searchResp = rest.getForObject(searchUrl, String.class);
            JsonNode searchJson = mapper.readTree(searchResp);
            JsonNode first = searchJson.path("search").path(0);
            if (first.isMissingNode()) return Optional.empty();

            String id = first.path("id").asText();

            String getUrl = UriComponentsBuilder.fromHttpUrl("https://www.wikidata.org/w/api.php")
                    .queryParam("action", "wbgetentities")
                    .queryParam("format", "json")
                    .queryParam("ids", id)
                    .queryParam("props", "labels|descriptions|claims")
                    .queryParam("languages", lang + "|en")
                    .build().toUriString();

            String getResp = rest.getForObject(getUrl, String.class);
            JsonNode getJson = mapper.readTree(getResp);
            JsonNode entity = getJson.path("entities").path(id);
            JsonNode claims = entity.path("claims").path("P18");

            if (claims.isArray() && claims.size() > 0) {
                String fileName = claims.get(0).path("mainsnak").path("datavalue").path("value").asText(null);
                if (fileName != null && !fileName.isEmpty()) {
                    String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()).replace("+", "%20");
                    String imageUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encoded;
                    return Optional.of(new WikidataResult(id, imageUrl));
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
