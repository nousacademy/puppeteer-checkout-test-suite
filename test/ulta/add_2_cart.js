module.exports = async (p) => {
  await p.waitFor('.AddToBag__button button');
  // click Add To Cart button
  await p.click('.AddToBag__button button');
  // wait for minicart to load
  await p.waitFor(4000);

  const result = await p.evaluate(() => {
    // mini cart item count
    let text = document.querySelector('.AddToBagSummary__Quantity').innerText;
    return { text }
  });
  return result.text;
}
