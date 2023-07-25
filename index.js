const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const passportConfig = require('./config/passportConfig');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override')

const flash = require('express-flash')
dotenv.config(); // Load environment variables from the .env file

// DB connection
mongoose.connect(process.env.DATA_URL)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Failed to connect to the database', error);
  });

passportConfig(passport)


// Server setup
const server = express();
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'pages'));
server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(express.static('public'));
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(flash())
server.use(session({ secret: 'secret', resave: false, saveUninitialized: true, }));
server.use(passport.initialize());
server.use(passport.session());
server.use(methodOverride('_method'));


// Routes
const routes = require('./controller/routes');
server.use('/', routes);

// Start the server
const port = process.env.PORT;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
