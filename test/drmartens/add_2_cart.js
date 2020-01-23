module.exports = async (p) => {
  await p.evaluate(() => {
      // select sz
      document.querySelector('#sizeSelector a[data-sku-code="883985340299"]').click();
      // click add to cart btn
      document.getElementById('addToCartButton').click();
    });
  // wait for minicart to load
  await p.waitFor(5000);

  const result = await p.evaluate(() => {
      let cartCounter = document.querySelector('.bag-count').innerText;
      return { text: cartCounter }
  });
  return result.text;
}
