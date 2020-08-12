const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const passportMongoose = require('passport-local-mongoose')
var UserSchema = new mongoose.Schema({
	email : {
		type : String , required: true, maxLength : 50
	},
	image : {
		type : String,
	},
	password : {
		type : String
	}
})
UserSchema.methods.comparePassword = function comparePassword(password, callback) {
  bcrypt.compare(password, this.password);
};
UserSchema.pre("save", function(next){
	if(!this.isModified("password")){
		return next();
	}
	this.password = bcrypt.hashSync(this.password, 10);
	next();
})

module.exports = mongoose.model('User', UserSchema)