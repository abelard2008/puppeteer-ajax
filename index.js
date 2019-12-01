const puppeteer = require('puppeteer');
const { PendingXHR } = require('pending-xhr-puppeteer');

const clickLinkText = (text,page) => {
  return page.evaluate(text => [...document.querySelectorAll('a')].find(e => e.textContent.trim() === text).click(), text);
};

(async() => {
  try {
    //variable to hold the results
    const result = [];
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    const pendingXHR = new PendingXHR(page);
    page.on('console', msg => console.log(msg.text()));
    await page.emulate({
          'viewport': {
            'width': 1400,
            'height': 1000,
            'isMobile': false
          },
          'userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    })

    await page.goto('http://lpse.surakarta.go.id/eproc4/lelang', {waitUntil: 'networkidle0'});
    await clickLinkText('Semua',page);
    pendingXHR.waitForAllXhrFinished();

//get last page on pagination
const lastPageEl = await page.$('ul.pagination li:nth-last-child(3)');
const lastPage = await page.evaluate(lastPageEl => lastPageEl.textContent, lastPageEl);
for (let index = 1; index < parseInt(lastPage); index++) {
  // wait 1 sec for page load
  await page.waitFor(1500);
  // click the pagination
  const clickLink = await clickLinkText(''+index+'',page);
  // wait until ajax request finished
  pendingXHR.waitForAllXhrFinished();
  //parse the result
  const row = await page.$$eval('table tr', trs => trs.map(tr => {
    const tds = [...tr.getElementsByTagName('td')];
    return tds.map(td => td.textContent);
  }));
  result.push(row);
}

console.log(result);
console.log('total rows : '+result.length * 25);

} catch(error) {
  console.error(error);
  // expected output: ReferenceError: nonExistentFunction is not defined
  // Note - error messages will vary depending on browser
}
}
)();
