const request = require('request');
const cheerio = require('cheerio');

const app = require('express')();
const PORT = 3000;

let gameList = [];
let priceList = [];

function getInfo(){
    request('https://store.steampowered.com/search/?sort_by=Price_ASC&maxprice=350&category1=998&os=win&filter=topsellers', (error, response, html)=> { // gets price and game name
        if (!error && response.statusCode == 200){
            const $ = cheerio.load(html);

            // gets game titles
            $('.col.search_capsule').each(function(i,element) { 
                let gameId = $(this).find('img').attr('src').split("/")[5].trim(); // grabs game ID from img src and then trims the ID

                // filters if games has trading cards
                request('https://steamcommunity.com/market/search?q=&category_753_Game%5B%5D=tag_app_' + gameId + '&category_753_cardborder%5B%5D=tag_cardborder_0&category_753_item_class%5B%5D=tag_item_class_2&appid=753', (error, response, html)=> {
                    if (!error && response.statusCode == 200){
                        const $ = cheerio.load(html);
                        let tradingCardPrice = $('.normal_price').text().trim();
                        let gameName = $('.market_listing_game_name').first().text().trim();
                        let gameNameTrimmed = gameName.split(' ').slice(0, -2).join(' '); // cleans the game name (removes last two words)

                        if (tradingCardPrice){
                            console.log(gameNameTrimmed + " does have trading cards ✅");
                            gameList.push(gameNameTrimmed);
                        }
                    }
                })
            });

            // gets game price
            $('.col.search_price.discounted.responsive_secondrow').each(function(i,element){
                let gamePrice = $(this).first().text(); // retrieves price
                let cutPrice = gamePrice.split("$")[2].trim(); // grabs correct price by splitting string
                let flPrice = parseFloat(cutPrice.replace(/,/g, '.')); // price parsed into float
                priceList.push(flPrice);
            })

        } else {
            console.log("Wrong response code: " + response.statusCode);
        }
    });
}

app.listen(
    PORT,
    () => console.log(`it's alive on http:localhost:${PORT}`)
)

// once getInfo is ready it will send the list in the GET method
async function getList(){
    getInfo();
    app.get('/game-list', (req, res) => {
        res.status(200).send({
            gameList: gameList,
            //priceList: priceList
        })
    });    
}

getList();
