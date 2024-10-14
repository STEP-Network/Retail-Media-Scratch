const express = require('express');
const cors = require('cors');
const path = require('path');
const puppeteer = require('puppeteer');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
var message = "";

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to poll for the iframe until it is found or times out
async function waitForIframe(page, selector, timeout = 30000) {
    const pollingInterval = 1000; // Poll every second
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const frame = page.frames().find(frame => frame.url().includes('doubleclick')); // Adjust as needed
        if (frame) {
            return frame;
        }
        // Wait for the next polling cycle
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }

    throw new Error('Iframe with ad content not found after waiting');
}

app.get('/ad-content', async (req, res) => {
    try {
        // Launch Puppeteer
        message = "1. Launching Puppeteer";
        const browser = await puppeteer.launch({ headless: true });
        message = "2. Browser launched";
        const page = await browser.newPage();
        message = "3. Page created";

        // Load the HTML page with your Google Ad Manager setup
        await page.setContent(`
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Display a fixed-sized test ad." />
                <title>Display a test ad</title>
                <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" crossorigin="anonymous"></script>
                <script>
                    window.googletag = window.googletag || { cmd: [] };

                    googletag.cmd.push(() => {
                        // Define an ad slot for div with id "banner-ad".
                        googletag
                            .defineSlot("/21809957681/step/stepclient.dk/matas_test", [1, 1], "banner-ad")
                            .addService(googletag.pubads());

                        // Enable the PubAdsService.
                        googletag.enableServices();
                    });
                </script>
            </head>
            <body>
                <div id="ad_slot">
                    <p>Annonce</p>
                    <div id="banner-ad"></div>
                    <script>
                        googletag.cmd.push(() => {
                            // Request and render an ad for the "banner-ad" slot.
                            googletag.display("banner-ad");
                        });
                    </script>
                </div>
            </body>
            </html>
        `);
        message = "4. Page content set";

        // Wait for the iframe to load inside the banner-ad div
        await page.waitForSelector('#banner-ad iframe');
        message = "5. Waiting for iframe";

        console.log('Iframe loaded');

        // Get the iframe element and switch to its context
        const frame = await page.frames().find(frame => frame.url().includes('doubleclick')); // Adjust the condition to match the iframe's URL
        message = "6. Frame found";
        console.log('Frame found:', frame);

        if (!frame) {
            throw new Error('Iframe with ad content not found');
        }

        // Wait for the content inside the iframe to load (e.g., the specific element that contains nextaContent)
        await frame.waitForSelector('.GoogleActiveViewElement');
        message = "7. Waiting for content inside iframe";
        console.log('Content loaded inside the iframe');

        // Extract the nextaContent data
        const nextaContent = await frame.evaluate(() => {
            console.log('Extracting nextaContent');
            message = "8. Extracting nextaContent";
            const adDataElement = document.querySelector('.GoogleActiveViewElement');
            message = "9. Ad Data Element";
            console.log('Ad Data Element:', adDataElement);
            return adDataElement ? adDataElement.textContent : null;
        });
        message = "10. Nexta Content";
        console.log('Nexta Content:', JSON.stringify(nextaContent));

        await browser.close();
        message = "11. Browser closed";

        // Send the retrieved content as JSON
        res.json({ nextaContent });
    } catch (err) {
        console.error('Error fetching ad content:', err);
        res.status(500).send('Error fetching ad content: ' + message);
    }
});

app.post('/receive-nexta-content', (req, res) => {
    console.log('Received nextaContent:', JSON.stringify(req.body));
    const { nextaContent } = req.body;
    if (nextaContent) {
        console.log('Received nextaContent:', nextaContent);
        // Further processing...
        res.status(200).send('nextaContent received successfully: ' + JSON.stringify(nextaContent));
    } else {
        res.status(400).send('nextaContent is missing');
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Call the /ad-content route on server startup
    try {
        const response = await axios.get(`https://testingretailmedia.azurewebsites.net/ad-content`);
        console.log('Ad Content:', response.data);
    } catch (err) {
        console.error('Error calling /ad-content on startup:', err.message);
    }
});