/* BUG:
- something is wrong with direct messages - count is 8, but only 5 is
  showing. If i reduce count to 5, only 3 shows.
*/

const express = require("express");
const Twit = require('twit');
const bodyParser = require("body-parser");
const moment = require('moment');
const app = express();
const router = express.Router();
const config = require("../config.js")
const T = new Twit(config);

const user = {};
const friends = [];
const messages = [];
const tweets = [];

app.use(bodyParser.urlencoded({ extended: false}));
app.set("view engine", "pug");
app.use(express.static('public'));

// Get your user information based on credentials
T.get('account/verify_credentials', (err, data, res, next) => {
	user.name = data.name;
	user.screenName = data.screen_name;
  user.id = data.id;
	user.picture = data.profile_image_url;
  user.background = data.profile_banner_url;
	user.friendCount = data.friends_count;
});

// Get your last 5 tweets
T.get('statuses/user_timeline', { count: 5 },  function (err, data, response) {
  data.forEach(function(tweet) {
    const tweetObject = {};
    tweetObject.text = tweet.text;
    tweetObject.date = moment(tweet.created_at).fromNow();
    tweetObject.retweets = tweet.retweet_count;
    tweetObject.likes = tweet.favorite_count;
    tweets.push(tweetObject);
    // console.log(tweetObject.date)
  });
})

// Getting 5 friends
T.get('friends/ids', { screen_name: user.screenName },  function (err, data, response) {
  const friendsArray = [];
  let count = 0;

  // Adding the 5 most recent friends to the friendsArray
  for (let i = 0; count < 5; i++){
    friendsArray.push(data.ids[i])
    count += 1;
  }

  // Adding friends information to a new array
  friendsArray.forEach(function(friend){
    T.get(`https://api.twitter.com/1.1/users/show.json?user_id=${friend}`, function (err, data, response) {
      friendObject = {
        "name" : data.name,
        "screenName" : data.screen_name,
        "picture" : data.profile_image_url_https,
        "user_id" : friend
      }
      friends.push(friendObject);
    })
  })
})

// Get the 5 most recent messages
T.get("direct_messages/events/list", { count:8 }, (err, data, res) => {
  data.events.forEach(message => {
    const messageObject = {};
    messageObject.text = message.message_create.message_data.text;
    messageObject.date = moment(parseInt(message.created_timestamp)).fromNow();
    messageObject.id = message.message_create.sender_id;

    // Getting name and picture based on sender_id
    T.get(`https://api.twitter.com/1.1/users/show.json?user_id=${messageObject.id}`, function (err, data, response) {
      messageObject.name = data.name;
      messageObject.picture = data.profile_image_url_https;
    });

    messages.push(messageObject);
  });
})

// Post a message when pressing tweet-button
router.post('/', (req, res) => {
	const tweet = req.body.status;
  T.post('statuses/update', { status: `${tweet}` }, function(err, data, response) {

    // Creating a new object for the tweet
    const tweetObject = {};
    tweetObject.text = `${tweet}`;
    tweetObject.date = "Just now";
    tweetObject.retweets = 0;
    tweetObject.likes = 0;

    // Removing the last tweet and adding the new one
    tweets.pop(tweets[4]);
	  tweets.unshift(tweetObject);

    // Loading the page after submitting
    res.render('index', { user, friends, messages, tweets });
  })
});

// Render index.pug
router.get('/', (req, res) => {
	res.render('index', { user, friends, messages, tweets });
});

// 404 error render
router.get('*', function(req, res){
  res.render('error');
});

// Removing an depreciation warning from Moment.
// If this was a live long-term site i would not use Moment, but
// it works for this project.
moment.suppressDeprecationWarnings = true;

module.exports = router;
