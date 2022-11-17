import fetch from "node-fetch";
import * as cheerio from "cheerio";
import express from "express";
import cors from "cors";

const PORT = 3001;
const app = express();
app.use(cors())

let webTradeEligibility, browserid, steamLoginSecure, sessionid, steamparental;

let fullList = [];
let userGameID = [];
let priceList = [];
let idList = [];


class fullDesc{
    constructor(name, gamePrice, cardAmmount, profit, gameUrl, gameImg, gameID){
        this.name = name;
        this.gamePrice = gamePrice;
        this.cardAmmount = cardAmmount;
        this.profit = profit;
        this.gameUrl = gameUrl;
        this.gameImg = gameImg;
        this.gameID = gameID;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// gets user game list
async function getUserList(profileId){
    const res = await fetch('https://steamcommunity.com/profiles/' + profileId + '/games?tab=all&xml=1');
    const dat = await res.text();
    
    let datSplit = dat.split('<game>');
    
    for (let i=0; i<datSplit.length; i++){
        var filteredID = datSplit[i].substring(
            datSplit[i].indexOf("<appID>") + "<appID>".length,
            datSplit[i].indexOf("</appID>")
        );
        userGameID.push(parseInt(filteredID));
    }
    userGameID.splice(0,1);
    return userGameID;
}

async function filterTradingCard(price, gameId){
    const fee = 0.87;

    const response = await fetch('https://steamcommunity.com/market/search/render/?query=&start=0&count=10&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_'+gameId+'&category_753_cardborder%5B%5D=tag_cardborder_0&category_753_item_class%5B%5D=tag_item_class_2', {
        mode: 'cors',
        'headers': {
            'Cookie': 'sessionid='+ sessionid +'; steamLoginSecure='+ steamLoginSecure +'; browserid= '+ browserid +'; steamparental='+ steamparental +'; webTradeEligibility= '+ webTradeEligibility +'; browserid=' + browserid
        }
    });
    const data = await response.json();

    // gets price, trims it and parses it to float
    const $ = cheerio.load(data.results_html);
    let tradingCardPrice = $('.normal_price').text().trim();
    let tradingCardPriceTrimmed = /\d+(,\d+)?/.exec(tradingCardPrice)[0];
    
    if (tradingCardPriceTrimmed){
        tradingCardPriceTrimmed = parseFloat(tradingCardPriceTrimmed.replace(',','.'));    
    }

    // gets ammount of cards and parses it to float
    let tradingCardAmmount = parseFloat(data.total_count);

    // gets and trimms game name
    let gameName = $('.market_listing_game_name').first().text().trim();
    let gameNameTrimmed = gameName.split(' ').slice(0, -2).join(' ');

    // calculates profit
    let possibleCards = Math.round(tradingCardAmmount/2);
    let calculateProfit = (possibleCards * (tradingCardPriceTrimmed)*fee) - price;

    // shows only profitable games
    if (calculateProfit > 0){
        let makeNode = new fullDesc(gameNameTrimmed, 
            price, 
            possibleCards, 
            parseFloat(calculateProfit.toFixed(2)), 
            'https://store.steampowered.com/app/' + gameId, 
            'https://cdn.cloudflare.steamstatic.com/steam/apps/' + gameId + '/capsule_sm_120.jpg',
            parseInt(gameId)
        ); // sends the data to an structure
        fullList.push(makeNode);
    }
}


async function getInfo(){

    const response = await fetch ('https://store.steampowered.com/search/results/?query&start=0&count=100&dynamic_data=&sort_by=Price_ASC&snr=1_7_7_230_7&maxprice=840&category1=998&category2=29&infinite=1',
    {mode: 'cors'});
    const data = await response.json();

    const $ = cheerio.load(data.results_html);

    $('.col.search_price.discounted.responsive_secondrow').each(function(i,element){
        let str = $([...$(this).contents()]
            .find(e => e.type === "text" && $(e).text().trim()))
            .text()
            .trim();
        let match = /\d+(,\d+)?/.exec(str);
        let price = Number(match[0].replace(',', '.'));
        priceList.push(price);
    });

    $('.search_result_row.ds_collapse_flag').each(function(i,element) { 
        let gameId = $(this).find('img').attr('src').split("/")[5].trim(); // grabs game ID from img src and then trims the ID
        idList.push(gameId);
    });

}

async function main(){
    // generates idPriceList 
    await getInfo();

    for (let i=0; i<30; i++){ // change to i<idList.length to show complete list of games

        // every 20 requests waits 5 seconds so it wont block me for attempting too much
        if (i%20 === 0 && i!=0){
            await sleep(1000);
        }

        // retrieves and makes list of profitable games
        await filterTradingCard(priceList[i], idList[i]);
    }

    return fullList;
}

app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
)

// Gets profitable game list
app.get('/game-list', async (req, res) => {
    webTradeEligibility = req.query.webTradeEligibility;
    browserid = req.query.browserid;
    steamLoginSecure = req.query.steamLoginSecure;
    sessionid = req.query.sessionid;
    steamparental = req.query.steamparental;

    // cleans list before sending new one
    fullList = [];

    try {
        console.log("Retrieving game list...");
        var finalList = await main();
        console.log("Successfully retrieved profitable games");
        res.send(finalList);
    } catch (error) {
        console.log("Not found");
        res.status(404).send("Not found.");
    }
   
});

// Gets game list owned by the user
app.get('/user-game-list', async (req, res) => {
    webTradeEligibility = req.query.webTradeEligibility;
    browserid = req.query.browserid;
    steamLoginSecure = req.query.steamLoginSecure;
    sessionid = req.query.sessionid;
    steamparental = req.query.steamparental;

    fullList = [];
    userGameID = [];

    try {
        console.log("Retrieving user game list...");
        var gameIDList = await getUserList(steamLoginSecure.split('|')[0]);
        var finalList = await main();
        console.log("Successfully retrieved user game list!");
        finalList = finalList.filter(function(val) {
            return gameIDList.indexOf(val.gameID) === -1;
        });
        if (finalList.length == 0){
            throw new Error('Already have all games in library.');
        }
        res.send(finalList);
    } catch (error){
        console.log("Not found.");
        res.status(404).send("Not found.");
    }
    
});