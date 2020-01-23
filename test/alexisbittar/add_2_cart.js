module.exports = async (p) => {
  // evaluate script
  await p.evaluate(() => {
    // avoid crashing testcase
    // because of "pinterestAddToCart is not defined" error
    try {
      // add item to cart
      window.atc();
    } catch(err){
      console.error(err);
    }
  });
  await p.waitFor(4000);

  const result = await p.evaluate(() => {
    let viewCartBtn = $('.bag-number').text();
    return { text: viewCartBtn }
  });
  return result.text;
}
