const request = require('request');
const cheerio = require('cheerio');
const app = require('express')();
const PORT = 3000;

let gameList = [];
let priceList = [];

request('https://store.steampowered.com/search/?sort_by=Price_ASC&maxprice=350&category1=998&os=win&filter=topsellers', (error, response, html)=> { // gets price and game name
    if (!error && response.statusCode == 200){
        const $ = cheerio.load(html);
        
        $('.title').each(function(i,element) {
            let gameTitle = $(this).text();
            gameList.push(gameTitle);
            //console.log(gameTitle);
        });
        
        $('.col.search_price.discounted.responsive_secondrow').each(function(i,element){
            let gamePrice = $(this).first().text(); // retrieves price
            let cutPrice = gamePrice.split("$")[2].trim(); // grabs correct price by splitting string
            let flPrice = parseFloat(cutPrice.replace(/,/g, '.')); // price parsed into float
            priceList.push(flPrice);
            //console.log(flPrice);
        })

    } else {
        console.log("Wrong response code: " + response.statusCode);
    }
});


/*
app.listen(
    PORT,
    () => console.log(`it's alive on http:localhost:${PORT}`)
)

app.get('/game-list', (req, res) => {
    res.status(200).send({
        prueba: 'algo',
        prueba2: 'otro algo'
    })
});
*/