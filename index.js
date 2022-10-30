const request = require('request');
const cheerio = require('cheerio');

const app = require('express')();
const PORT = 3000;

const fee = 0.87;

// replace with your own cookies
const webTradeEligibility = 'XXXXXX';
const browserid = 'XXXXXXX';
const steamLoginSecure = 'XXXXXX';
const sessionid = 'XXXXXXX';

let fullList = []; 

let tradingCardPricefl;

class fullDesc{
    constructor(name, gamePrice, cardAmmount, profit){
        this.name = name;
        this.gamePrice = gamePrice;
        this.cardAmmount = cardAmmount;
        this.profit = profit;
    }
}

function getInfo(){
    request('https://store.steampowered.com/search/?sort_by=Price_ASC&maxprice=840&category1=998&category2=29', (error, response, html)=> { // gets price and game name
        if (!error && response.statusCode == 200){
            const $ = cheerio.load(html);

            // gets game titles
            $('.col.search_capsule').each(function(i,element) { 
                let gameId = $(this).find('img').attr('src').split("/")[5].trim(); // grabs game ID from img src and then trims the ID

                let price = $(this).nextUntil('.col.search_price.discounted.responsive_secondrow').text().trim(); // gets game price
                price = price.split('$')[2];
                price = parseFloat(price.replace(',','.'));
                
                var options = {
                    'method': 'GET',
                    'url': 'https://steamcommunity.com/market/search?q=&category_753_Game%5B%5D=tag_app_' + gameId + '&category_753_cardborder%5B%5D=tag_cardborder_0&category_753_item_class%5B%5D=tag_item_class_2&appid=753#p1_price_asc',
                    'headers': {
                        'Cookie': 'webTradeEligibility='+ webTradeEligibility +' ; browserid='+ browserid +' ; steamLoginSecure= ' + steamLoginSecure +' ; sessionid=' + sessionid
                    }
                };

                // filters if games has trading cards
                request(options, (error, response, html)=> {
                    if (!error && response.statusCode == 200){
                        const $ = cheerio.load(html);
                        let tradingCardPrice = $('.normal_price').text().trim();
                        let tradingCardPriceTrimmed = tradingCardPrice.trim().split(' ')[3]; //trims the trading card price

                        let tradingCardAmmount = $('#searchResults_total').text() //gets ammount of trading cards
                        tradingCardAmmount = parseFloat(tradingCardAmmount);

                        if (tradingCardPriceTrimmed){ // validates that the value is not undefined
                            tradingCardPricefl = parseFloat(tradingCardPriceTrimmed.replace(',','.'));
                        }
                        
                        let gameName = $('.market_listing_game_name').first().text().trim();
                        let gameNameTrimmed = gameName.split(' ').slice(0, -2).join(' '); // cleans the game name (removes last two words)

                        let possibleCards = Math.round(tradingCardAmmount/2);
                        let calculateProfit = (possibleCards * (tradingCardPricefl)*fee) - price; // calculates profit

                        if (tradingCardPrice && (calculateProfit>0)){ // validates undefined and checks if profitable
                            console.log(gameNameTrimmed + " ✅");
                            console.log("Game price: " + price);
                            console.log("Possible trading cards dropped: " + possibleCards);
                            console.log("Possible profit: $" + calculateProfit);

                            let makeNode = new fullDesc(gameNameTrimmed, price, possibleCards, calculateProfit); // sends the data to an structure
                            fullList.push(makeNode);
                        }
                    }
                })
            });

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
            fullList: fullList
        })
    });    
}

getList();
