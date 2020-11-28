require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const cors = require('cors');
const url = require('url');
const { json } = require('body-parser');
const { Schema } = mongoose;

const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('we are conncected to the db!');
});

// console.log(mongoose.connection.readyState);

const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: String,
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(req.body.url);
  next();
});

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new', function (req, res, next) {
  const input = req.body.url;
  const reg = /^https:\/\//;
  if (reg.test(input)) {
    const url = new URL(input);
    dns.lookup(url.host, async (err, address, family) => {
      if (err) {
        res.status(400).json({ error: 'invalid url' });
      } else {
        const newUrl = await Url.create({ original_url: url.href });
        res.status(201).json({ original_url: url.href, short_url: newUrl._id });
      }
    });
  } else {
    return res.status(400).json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  const id = req.params.id;
  Url.findById(id, function (err, url) {
    if (err) return console.error(err);
    res.redirect(url.original_url);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
