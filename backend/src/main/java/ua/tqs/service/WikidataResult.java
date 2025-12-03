package ua.tqs.service;

public class WikidataResult {
    private final String id;
    private final String imageUrl;

    public WikidataResult(String id, String imageUrl) {
        this.id = id;
        this.imageUrl = imageUrl;
    }

    public String getId() { return id; }
    public String getImageUrl() { return imageUrl; }
}
