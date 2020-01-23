module.exports = async (p) => {
  await p.evaluate(() => {
      document.getElementById('selected_product_size').value = "S";
      document.querySelector('.buttons_container .addProductButton').click();
    });
  // wait for minicart to load
  await p.waitFor(5000);

  const result = await p.evaluate(() => {
      let cartCounter = document.querySelector('.orders-header-___bag_button__bagButton___2xLFN span').innerText;
      return { text: cartCounter }
  });
  return result.text;
}
