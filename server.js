const express = require('express')
const bcrypt = require('bcrypt')
const session = require('express-session')
const handlebars = require('express-handlebars')
const passport = require('passport')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cookieParse = require('cookie-parser')
const flash = require('connect-flash')
//fs - filesystem 
var fs = require('fs')
//multer is like PIL, pillow in the python
//for storing Images create diskStorage 
var multer = require('multer')
var path = require('path')
var config = require('./config.json')
var LocalStrategy = require('passport-local').Strategy
var app = express()
var User = require('./Users')

var imgstorage = multer.diskStorage({
	destination: (req, file, callback) =>{
		callback(null, 'uploads')
	},
	filename: (req, file, callback) =>{
		callback(null, file.fieldname + '-' + Date.now())
	}
})
//return only png jpg jpeg extension
var imgFilter = (req, file , callback) =>{
	if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
		callback(null , true)
	} else {
		callback(null, false)
	}
}
var filehandler = multer({ storage : imgstorage, fileFilter : imgFilter })

app.post("/upload", function(req, res , next){
	var file = req.file;
	console.log(file);
})

//by default will store session in localstorage in the browser
app.use(session({
	secret: config.secret,
	resave: true,
	saveUninitialized: true,
	cookie : {maxAge : 90000, httpOnly : false}
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', express.static(path.join(__dirname, 'uploads')))
app.use(bodyParser.json())
app.use(express.urlencoded({ extended : true}))
app.engine( 'hbs', handlebars({
	extname : 'hbs',
	defaultLayout : 'main',
	layoutsDir: path.join(__dirname, 'views/layouts'),
	partialsDir : [
			path.join(__dirname, 'views/partials'),
	]
}))

passport.use(new LocalStrategy(
  function(email, password, done) {
    User.findOne({ email : email }, function (error, user) {
      if (error) { return done(error) }
      if (!user) { return done(null, false); }
      if (!user.comparePassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser((user, done) => {
	done(null, user)
})
passport.deserializeUser((_id, done) =>{
	User.findbyId(_id,(error, user) =>{
		if(error){ done(error)}
		else{done(null, user)}	
	})
})
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

app.post('/registration', filehandler.single('image'), (req, res) =>{
	if(req){
		if(req.file) console.log(req.file)
		console.dir(req.body)
			var user = new User({
				email : req.body.email,
				image : req.file.filename,
				password : req.body.password
			})
			user.save().then((user) =>{
				console.log(user.password)
				return res.send(user)				
			})
	}
})
app.post('/login', passport.authenticate('local', {successRedirect : '/', failureFlash : true}), 
													(req, res) =>{
				console.log(req.body)
				return res.send(`you are in`)															
})

app.get('/users', (req, res) =>{
	User.find({}).then((document) =>{
		return res.send(document)
	})
})
app.get('/', (req , res) =>{
	User.find({}).lean()
	.then(users =>{
		console.log(users)
		return res.render('layouts/main.hbs', {users})
	})
})
mongoose.connect(config.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) =>{
	mongoose.Promise = global.Promise;
	mongoose.connection.on('error', error =>{
		console.log(`Problem to connect to db:${error}`)
	})
	console.log(`connected to ${config.DB_URI}`)
	app.listen(config.PORT, () =>{
		console.log(`server is running on ${config.URL}`)
	})
})
