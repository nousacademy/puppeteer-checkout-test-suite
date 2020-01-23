module.exports = async (p) => {
  // evaluate script
  await p.evaluate(() => {
    // select size
    $('.Size ul > li:nth-child(4) .swatchanchor').click();
  });
  // wait for page to refresh
  await p.waitFor(4000);
  // evaluate script after content loaded
  await p.evaluate(() => {
    $('#add-to-cart').click();
  });
  await p.waitFor(4000);

  const result = await p.evaluate(() => {
    let viewCartBtn = $('.mini-cart-toggle').text();
    return { text: viewCartBtn }
  });
  return result.text;
}
