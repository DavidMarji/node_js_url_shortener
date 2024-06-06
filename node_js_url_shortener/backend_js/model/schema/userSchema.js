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

const signUp = async function signUp(usernameToLookup, emailToLookup, passwordToLookup) {
    const user = new User({
        username : usernameToLookup,
        email : emailToLookup,
        password : passwordToLookup,
    });
    return user.save();
};

const findUser = async function findUser(usernameToLookup) {
    let userFound = await User.findOne({
        username : usernameToLookup
    });
    console.log(userFound);
    return userFound !== undefined && userFound !== null 
    ? userFound 
    : (await User.findOne({
            email: usernameToLookup
        })
    );
};

const findAllUsers = async function findAllUsers() {
    let users = await User.find({});
    return users;
}

module.exports = {signUp, findUser, findAllUsers}