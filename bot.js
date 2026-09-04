const { OpenAI } = require("openai");
const puppeteer = require("puppeteer");

// Initialize OpenAI (it will read your API key from GitHub Secrets later)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runBot() {
  console.log("Generating motivation quote...");

  try {
    // 1. Ask OpenAI for the quote and hashtags
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and efficient for text tasks
      messages: [
        {
          role: "system",
          content: "You are a deeply inspiring Christian motivational writer."
        },
        {
          role: "user",
          content: "Generate a deep, engaging, and motivational Christian-themed quote that sounds authentic and personal. It should focus on faith, God's grace, or perseverance. Also, generate 5 to 6 relevant trending hashtags related to the message (e.g., #GodIsGood, #Faith, #ChristianThreads). Format your response cleanly with the quote text first, followed by the hashtags at the bottom."
        }
      ],
    });

    const aiOutput = completion.choices[0].message.content;
    console.log("Generated Content:\n", aiOutput);

    // 2. Render HTML & Take Screenshot with Puppeteer
    console.log("Launching browser to create image card...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport size for an X (Twitter) style card look
    await page.setViewport({ width: 1200, height: 675 });

    // HTML template with dark mode X styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              background-color: #000000;
              color: #e7e9ea;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background-color: #16181c;
              border: 1px solid #2f3336;
              border-radius: 20px;
              padding: 40px;
              width: 800px;
              box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            }
            .quote {
              font-size: 32px;
              line-height: 1.5;
              font-weight: 500;
              margin-bottom: 24px;
              white-space: pre-wrap;
            }
            .hashtags {
              font-size: 20px;
              color: #1d9bf0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="quote">${aiOutput}</div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Save the screenshot as quote.png
    await page.screenshot({ path: 'quote.png' });
    
    await browser.close();
    console.log("Success! Screenshot saved as quote.png");

  } catch (error) {
    console.error("Error running bot:", error);
    process.exit(1);
  }
}

runBot();