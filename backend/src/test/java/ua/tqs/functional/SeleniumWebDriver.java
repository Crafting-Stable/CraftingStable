package ua.tqs.functional;

import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

import io.github.bonigarcia.wdm.WebDriverManager;

public class SeleniumWebDriver {
    private static final ThreadLocal<FirefoxDriver> driver = new ThreadLocal<>();

    public static FirefoxDriver getDriver() {
        if (driver.get() == null) {
            initDriver();
        }
        return driver.get();
    }

    public static void initDriver() {
        WebDriverManager.firefoxdriver().setup();
        FirefoxOptions options = new FirefoxOptions();
        options.addArguments("--start-maximized");
        // Visual mode enabled - browser window will be visible
        // To enable headless mode, uncomment the line below:
        FirefoxDriver firefoxDriver = new FirefoxDriver(options);
        driver.set(firefoxDriver);
    }

    public static void quitDriver() {
        if (driver.get() != null) {
            driver.get().quit();
            driver.remove();
        }
    }

    public static void navigateTo(String url) {
        getDriver().navigate().to(url);
    }

    public static void closeWindow() {
        getDriver().close();
    }

    public static String getCurrentUrl() {
        return getDriver().getCurrentUrl();
    }

    public static String getPageTitle() {
        return getDriver().getTitle();
    }
}
