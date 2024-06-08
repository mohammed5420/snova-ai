import puppeteer from "puppeteer";
import turndown from "turndown";
import minimist from "minimist";

const args = minimist(process.argv.slice(2), {
  alias: { q: "query" },
  string: ["q"],
});

const question = args.q;

if (!question) {
  console.error("Please provide a question");
  process.exit(1);
}

async function getInspirationChannels(question: string) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://fast.snova.ai/", {
      waitUntil: "load",
      timeout: 0,
    });

    const textArea = await page.waitForSelector("textarea");
    if (textArea) {
      await textArea.type(question);
      const button = await page.waitForSelector(
        '[data-testid="stChatInputSubmitButton"]',
      );

      if (!button) {
        console.log("No button found");
        return browser.close();
      }

      await button.click();
    }

    await page.waitForSelector(".metric-container")

    const chatResponseNode = await page.waitForSelector(
      'div.stChatMessage img[alt="assistant avatar"] + div',
    );

    if (!chatResponseNode) {
      console.log("No response found");
      return browser.close();
    }

    const responseHTML = await page.evaluate(
      (node) => node.innerHTML,
      chatResponseNode,
    );

    const turndownService = new turndown();
    const responseMarkdown = turndownService.turndown(responseHTML);
    console.log("Response: ", responseMarkdown);
    return browser.close();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

getInspirationChannels(question);
