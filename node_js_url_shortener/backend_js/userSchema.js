const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {type: String, unique: true, required: true},
    email : {type: String, unique: true, required: true},
    password :  { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const main = async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener');
};

main();

const signUp = async function signUp(usernameToLookup, emailToLookup, passwordToLookup){
    const user = new User({
        username : usernameToLookup,
        email : emailToLookup,
        password : passwordToLookup,
    });
    user.save();
};

const findUser = async function findUser(usernameToLookup){
    let userFound = await User.find({
        username : usernameToLookup
    });
    return userFound !== undefined && userFound.length > 0 
    ? userFound 
    : (await User.find({
            email: usernameToLookup.toLowerCase()
        })
    );
};

module.exports = {signUp, findUser}