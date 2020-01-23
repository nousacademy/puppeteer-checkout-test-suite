module.exports = async (p) => {
  // evaluate script
  await p.evaluate(() => {
    // ATC
    jQuery('#product-addtocart-button').click();
  });
  // wait for page to load after submitting form on ATC
  await p.waitForNavigation({ waitUntil: 'networkidle0' });

  const result = await p.evaluate(() => {
    let viewCartBtn = jQuery('.counter-number').text();
    return { text: viewCartBtn }
  });
  return result.text;
}
