module.exports = async (p) => {
  // evaluate script
  await p.evaluate(() => {
    // ATC
    jQuery('.tocart').click();
  });
  await p.waitFor(4000);

  const result = await p.evaluate(() => {
    let viewCartBtn = jQuery('.counter-number').text();
    return { text: viewCartBtn }
  });
  return result.text;
}
