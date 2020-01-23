module.exports = async (p) => {
  // evaluate script
  await p.evaluate(() => {
    // click select bar
    document.querySelector('.toggleSwatchControl').click();
    // select size
    document.querySelector('.beltsize .swatchanchor[desc="30"]').click();
  });
  // wait for page to refresh
  await p.waitFor(4000);
  // evaluate script after content loaded
  await p.evaluate(() => {
    document.getElementById('add-to-cart').click();
  });
  await p.waitFor(4000);
  
  const result = await p.evaluate(() => {
    let viewCartBtn = document.querySelector('.mini-cart-icon').innerText;
    return { text: viewCartBtn }
  });
  return result.text;
}
