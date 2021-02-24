// BIG BETS BIG STOCKS THE ONLY WAY!!!!

let express = require('express');
let superagent = require('superagent');
let bodyParser = require('body-parser');
let Twitter = require('twit');
let schedule = require('node-schedule');
let {exec} = require('child_process');

//landing page 
let app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()); app.listen((process.env.PORT || 5000)); // Server index page
app.get('/', function (req, res) {
  res.send('Deploy Successful!');
});

//send GroupMe Message
function sendMessage(message, botId) {
  let headers = {
    'User-Agent': 'BigBetsBot/1.0',
    'Content-Type': 'application/json'
  }

  let options = {
    url: 'https://api.groupme.com/v3/bots/post',
    headers: headers,
    form: {'text': message, 'bot_id': botId}
  }

  superagent
    .post(options.url)
    .send(options.form)
    .set(options.headers)
    .then(res => {
      console.log('Message sent!');
      console.log(res);
	})
	.catch(err => {
	  console.log('Message not sent, unsuccessful');
	  console.log(err);
	})
}

function parseMessage(event) { //make sure the message is not truncated
	let message = '';
	let messagePrefix = `${event.user.screen_name}`;
	if (event.retweeted_status) {
		message = `RT @ ${event.retweeted_status.user.screen_name}: ${event.retweeted_status.text}`;
	} else if(event.extended_tweet) {
		message = event.extended_tweet.full_text;
	} else {
		message = event.text;
  	}
    
  return `${messagePrefix}: ${message} - https://twitter.com/${event.user.id_str}/status/${event.id_str}`;
}

// verify tweet originated from the selected followers and is not a reply
function verifyTweet(event) {
  let verified = false;
  if (process.env.FOLLOWING.toString().includes(event.user.id_str) && !event.in_reply_to_user_id && !event.in_reply_to_status_id) {
    verified = true;
  }
  return verified;
}

const config = {
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET
};

const twitter = new Twitter(config);
const params = { follow: process.env.FOLLOWING };
const stream = twitter.stream('statuses/filter', params);

stream.on('error', (error) => {
	console.log('ERROR', error);
});

stream.on('tweet', (event) => {
	if (verifyTweet(event)) {
		console.log('TWEET EVENT', event);
		sendMessage(parseMessage(event), process.env.BOT_ID);
	} else {
		// console.log('REPLY/RT LOG', event);
	}
});

stream.on('disconnect', function (disconnectMessage) {
	console.log('DISCONNECTED', disconnectMessage);
});

stream.on('reconnect', function (request, response, connectInterval) {
	console.log('RECONNECTING', connectInterval);
});

stream.on('connected', function (response) {
	console.log('CONNECTION MADE');
});

stream.on('connect', function (request) {
	console.log('CONNECTION ATTEMPTED');
});

// Health Check
let http = require('http');
setInterval(function() {
    http.get('http://bigbetsbot.herokuapp.com/');
}, 300000);

// Cron Jobs to startup/bring down app
const downRule = new schedule.RecurrenceRule();
downRule.minute = 0;
downRule.hour = 18;
downRule.tz = 'America/Chicago';
downRule.dayOfWeek = [new schedule.Range(1, 5)];

const downJob = schedule.scheduleJob(downRule, () => {
	let shutdown = exec('sh dynos.sh 0', (error, stdout, stderr) => {
		console.log(stderr);
		console.log(stdout);
		console.log(error);
	});
});

const upRule = new schedule.RecurrenceRule();
upRule.minute = 0;
upRule.hour = 8;
upRule.tz = 'America/Chicago';
upRule.dayOfWeek = [new schedule.Range(1, 5)];

const upJob = schedule.scheduleJob(upRule, () => {
	let shutdown = exec('sh dynos.sh 1', (error, stdout, stderr) => {
		console.log(stderr);
		console.log(stdout);
		console.log(error);
	});
});