require('babel-register')({
  presets: ['es2015', 'react']
});

const router = require('./sitemapRoutes').default;
const Sitemap = require('react-router-sitemap').default;
const fetch = require('node-fetch');

async function generateSitemap() {
  try {
    const [magiceden, opensea] = await Promise.all([
      fetch('https://metricnft.com/api/magiceden'),
      fetch('https://metricnft.com/api/opensea'),
    ]);
    const magicedenCollections = await magiceden.json();
    const openseaCollections = await opensea.json();

    let symbols = [];

    // for(var i = 0; i < posts.length; i++) {
    //   idMap.push({ symbol: posts[i].postId });
    // }

    magicedenCollections.map((magicedenCollection) => {
      symbols.push({ symbol: magicedenCollection.symbol });
    })

    openseaCollections.map((openseaCollection) => {
      symbols.push({ symbol: openseaCollection.slug });
    })

    const paramsConfig = {
      "/collection/:symbol": symbols,
    };

    return (
      new Sitemap(router)
          .applyParams(paramsConfig)
          .build("https://www.metricnft.com")
          .save("./public/sitemap.xml")
    );
  } catch(e) {
    console.log(e);
  } 
}

generateSitemap();