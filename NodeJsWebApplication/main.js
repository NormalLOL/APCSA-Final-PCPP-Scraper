const { Builder, By, until } = require('selenium-webdriver');
const robotsParser = require('robots-parser');
const axios = require('axios');
require('chromedriver'); // Ensure you've installed chromedriver

const baseUrl = 'https://pcpartpicker.com';
const url = `${baseUrl}/products/video-card/`;
const robotsUrl = `${baseUrl}/robots.txt`;

// Function to parse robots.txt and get crawl delay and disallowed paths
const parseRobotsTxt = async (robotsUrl) => {
    try {
        const response = await axios.get(robotsUrl);
        if (response.status === 200) {
            const robotsTxt = response.data;
            const robots = robotsParser(robotsUrl, robotsTxt);
            const crawlDelay = robots.getCrawlDelay('User-agent: *') || 60; // Default to 60 seconds if not specified
            return { robots, crawlDelay };
        } else {
            console.error(`Failed to fetch ${robotsUrl}. Status code: ${response.status}`);
            return { robots: null, crawlDelay: 0 };
        }
    } catch (error) {
        console.error(`Error fetching ${robotsUrl}:`, error);
        return { robots: null, crawlDelay: 0 };
    }
};

// Function to scrape prices
const scrapePrices = async () => {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log(`Navigating to ${url}...`);
        await driver.get(url);

        console.log('Waiting for the table to load...');
        await driver.wait(until.elementLocated(By.id('paginated_table')), 10000);

        console.log('Scrolling to the Radeon RX 7900 XTX checkbox...');
        let radeonLabel = await driver.findElement(By.css('label[for="c_fi331"]'));
        await driver.executeScript("arguments[0].scrollIntoView(true);", radeonLabel);

        console.log('Clicking the Radeon RX 7900 XTX checkbox...');
        await radeonLabel.click();

        console.log('Waiting for the table to update...');
        await driver.wait(until.elementLocated(By.id('paginated_table')), 10000);

        console.log('Extracting prices...');
        let productRows = await driver.findElements(By.css('tr.tr__product'));
        let prices = [];
        for (let row of productRows) {
            let priceElement = await row.findElement(By.css('.td__price'));
            let price = await priceElement.getText();
            if (price) {
                prices.push(price.trim());
            }
        }

        return prices;
    } catch (error) {
        console.error('Error during scraping:', error);
        return [];
    } finally {
        console.log('Closing the WebDriver...');
        await driver.quit();
    }
};

module.exports = scrapePrices;
