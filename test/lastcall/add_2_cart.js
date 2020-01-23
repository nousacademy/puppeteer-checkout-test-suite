module.exports = async (p) => {
  // wait for select options to load
  await p.waitFor(5000);

  await p.evaluate(() => {
    document.getElementById('prod55430252DD1').value = '26';
    document.querySelector('.topAddToCartButton').click();
  });
  // wait for minicart to load
  await p.waitFor(5000);

  const result = await p.evaluate(() => {
    let cartCounter = document.getElementById('btn_ShoppingBag').innerText;
    return { text: cartCounter }
  });
  return result.text;
}
