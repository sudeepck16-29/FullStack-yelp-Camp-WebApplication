//mongodb + srv://Our-project:<password>@cluster0.j66us.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
//DB_URL = mongodb + srv://Our-project:NfWeQ6QiNUCRjFHy@cluster0.j66us.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');

//**********express-mongo-sanitize  [Security]  db.users.find({username : {"$gt" : ""}}) */
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');


/********  SESSION AND FLASH****** */
const session = require('express-session');
const flash = require('connect-flash');

const User = require('./models/user');

/*passportfor auth */
const passport = require('passport');
const LocalStrategy = require('passport-local')

/* ERROR HANDLER*/
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');

// routes
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');


// mongo session connect
const MongoDBStore = require('connect-mongo');

//process.env.DB_URL;
// process.env.DB_URL || 
const db_URL =process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(db_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,

});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))


app.use(express.urlencoded({ extended: true })); // post
app.use(methodOverride('_method'));// delete
app.use(express.static(path.join(__dirname, 'public')));// refering public directory
app.use(mongoSanitize({
    replaceWith: '_'
}))

/****************************************************** 
    session-config  AND FLASH  And possport for Authinectation
 ************************************************/
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = MongoDBStore.create({
    mongoUrl: db_URL,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("Session Error", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure: true,
        expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/", // added to styleSrcUrls
    "https://use.fontawesome.com/" // added to styleSrcUrls
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = ["https://cdn.jsdelivr.net/"];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dgf7rejtu/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            // fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);





app.use(passport.initialize());// inbuild function to auth
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    //console.log(req.body);
    res.locals.currentUser = req.user; // currently logined in user
    res.locals.success = req.flash('success');//flash msg
    res.locals.error = req.flash('error')
    next();
})
/***************************************************** 
                       routers
***************************************************** */
app.get('/', (req, res) => {
    res.render('home')
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);



app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port`)
})