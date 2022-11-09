# Steam-API
API that retrieves low price games and finds if it has trading cards

Made to find out if a cheap game has trading cards. If so, find out if you can  
make any profit from buying it and then seliing the cards in Steam's community market.


## Installation guide:  
Clone with:  
`$ git clone https://github.com/LucasGenovese/Steam-API`  

Cd into "Steam-API" folder and install packages with:  
`$ npm install`  


## Usage guide:  

Run the code using and keep it in the background:  
`$ node index.js`  

To test it open Postman and enter `http://localhost:3000/game-list`  
Then add the following keys:  
![screenshot](https://user-images.githubusercontent.com/72575906/200724240-e2b30f31-f1db-477b-9570-efad0071d2d3.png)  

To get the value for each key go to your [Steam Marketplace](https://steamcommunity.com/market/). Press f12 and go to Application -> Cookies and copy every matching name to its matching value in postman.  
Finally click "Send" in post man and wait. It takes arround 30 to 60 seconds depending on how many games you want it to show.

## Why does it use personal cookies?  

This is because Steam Marketplace does not echange equally trading card prices for every game.  
As you can see here Box Maze and CSGO have the same price in USD (both at USD$ 0,4) but when you change to ARS the price varies and makes it difficult to calculate profits.   
![final](https://user-images.githubusercontent.com/72575906/200729065-a5620cf3-3a8a-4176-8213-23048a7111d2.png)  
