import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// const url = "https://lite.cnn.com/";
const url = "https://portal.wcsd.k12.ca.us/parent/LoginParent.aspx";

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

export async function handler(_event, _context) {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:
        process.env.CHROME_EXECUTABLE_PATH ||
        (await chromium.executablePath(
          "/var/task/node_modules/@sparticuz/chromium/bin",
        )),
    });

    const page = await browser.newPage();

    await page.goto(url);

    await page.waitForSelector("input[name=portalAccountUsername]");
    await page.$eval(
      "input[name=portalAccountUsername]",
      (el) => (el.value = "robin.zimmermann@gmail.com"),
    );

    await page.waitForSelector("#next");
    await page.click("#next");

    await page.waitForSelector("input[name=portalAccountPassword]");
    await page.$eval(
      "input[name=portalAccountPassword]",
      (el) => (el.value = "Wicked-duel-82"),
    );

    await page.waitForSelector("#LoginButton");
    await page.click("#LoginButton");

    await page.waitForNavigation({
      waitUntil: "networkidle2",
    });

    const grades = {};
    for (const card of await page.$$(".Card")) {
      // const textHeading = await card.$('.TextHeading');
      // if (textHeading) {
      //   const textValue = await textHeading.getProperty('innerText');
      //   console.log(`textValue: ${textValue}`);
      // }

      const textHeading = await card.$eval(
        ".TextHeading",
        (el) => el.textContent,
      );
      const gradeHtml = await card.$eval(".Grade", (el) => el.textContent);
      const grade = gradeHtml?.substring(0, gradeHtml.indexOf("(")) || "";
      // console.log(`textHeading: ${textHeading}, ${grade}`);

      let screenTime = 0;
      switch (grade) {
        case "A+":
          screenTime = 26;
          break;
        case "A":
        case "A-":
          screenTime = 24;
          break;
        case "B+":
          screenTime = 18;
          break;
        case "B":
        case "B-":
          screenTime = 16;
          break;
        case "C+":
          screenTime = 10;
          break;
        case "C":
          screenTime = 5;
          break;
      }

      switch (textHeading?.trim()) {
        // case 'Advisory Q2 - Quarter 2':
        //   grades.Advisory = { teacher: 'Mrs Albaugh', grade, screenTime };
        //   break;
        case "1 - Tech 1 - Q2 - Quarter 2":
          grades["Tech Theatre"] = { teacher: "Baez", grade, screenTime };
          break;
        case "PE 2 - Quarter 2":
          grades.PE = { teacher: "Mrs Kern", grade, screenTime };
          break;
        case "Eng 8 - Quarter 2":
          grades.English = { teacher: "Mrs Weems", grade, screenTime };
          break;
        case "4-Iantorno-Q2-Art1 - Quarter 2":
          grades.Art = { teacher: "Mrs Iantorno", grade, screenTime };
          break;
        case "Period 5 Barouki - Quarter 2":
          grades.Science = { teacher: "Mrs Barouki", grade, screenTime };
          break;
        case "Hist 8 - Quarter 2":
          grades.History = { teacher: "Mr Hurd", grade, screenTime };
          break;
        case "Math 8 - 7th - Quarter 2":
          grades.Mathematics = { teacher: "Mrs Jarman", grade, screenTime };
          break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(grades),
    };
    /*
    await page.waitForSelector(".title");

    const results = await page.$$eval("ul li", (articles) => {
      return articles.map((link) => {
        return {
          title: link.querySelector("a").innerText,
          url: link.querySelector("a").href,
        };
      });
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  */
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
}
