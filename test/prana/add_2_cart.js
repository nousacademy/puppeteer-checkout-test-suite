module.exports = async (p) => {

      // await page.evaluate(() => {
      //   // select color
      //   document.querySelector('a.selectable[data-attr-url*="gave"]').click();
      // });
      // wait for page to refresh
      await p.waitFor(10000);

      await p.evaluate(() => {
        // select size
        document.querySelector('a.selectable[data-attr-value="S"]').click();
      });
      // wait for page to refresh
      await p.waitFor(8000);

      await p.evaluate(() => {
        // click add to cart btn
        document.querySelector('.btn__add-to-cart').click();
      });
      // wait for page to refresh
      await p.waitFor(8000);

      const result = await p.evaluate(() => {
        // cart counter
        let text = document.querySelector('.minicart-quantity').innerText;
        return { text }
      });
  return result.text;
}
