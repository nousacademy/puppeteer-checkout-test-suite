module.exports = async (p) => {
  // wait for select options to load
  await p.waitFor(5000);

  await p.evaluate(() => {
    document.getElementById('prod146850039DD1').value = "5B / 35EU";
    // console.log()
    document.querySelector('.topAddToCartButton').click();
  });
  // wait for minicart to load
  await p.waitFor(5000);

  const result = await p.evaluate(() => {
    let cartCounter = document.querySelector('.bag-count').innerText;
    return { text: cartCounter }
  });
  return result.text;
}
