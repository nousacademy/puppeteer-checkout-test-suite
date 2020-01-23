module.exports = async (p) => {
  // click Add To Cart button
  await p.click('[data-test="shippingATCButton"]');
  // wait for item to get added to cart
  await p.waitFor(5000);
  const result = await p.evaluate(() => {
      let cartCounter = document.querySelector('.cartLinkQuantity').innerHTML;
      return { text: cartCounter }
    });
  return result.text;
}
