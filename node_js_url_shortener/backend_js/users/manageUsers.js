const userSchema = require('../schema/userSchema.js');
const userInfoValidation = require('./userInfoValidation.js');
const jwt = require('../jwt/jwt.js');

const signUp = async function signUp(username, email, password){
    const val = userInfoValidation.validateUserSignUp(username, email, password);
    // invalid inputs so return the error code
    if(val !== 200) return val;
    
    try {
        // since the model has the unique keyword there is no need to check for this as it would throw an error
        await userSchema.signUp(username, email, password);
        const generatedToken = jwt.generateAccessToken(username);
        return generatedToken; 
    }
    catch (error) {
        console.log({error});
        return 409;
    }
}

const login = async function login(username, password){
    const val = userInfoValidation.validateUserLogin(username, password);
    if(val !== 200) return 409;

    try {
        const user = await userSchema.findUser(username.toLowerCase());
        if(user !== undefined && user !== null && user.length > 0){
            if(password === user[0].password){
                const generatedToken = jwt.generateAccessToken(username);
                return generatedToken;
            }
            // invalid password
            return 404;
        }
        return 404;
    }
    catch (error) {
        console.log(error)
        return 404;
    }
}

const getUser = async function getUser(username) {
    let user;
    try {
        const data = await userSchema.findUser(username);
        user = data;
    }
    catch (error) {
        console.log(error);
        throw new Error(`Couldn\'t find the user ${username}`);
    }
    return user;
}

module.exports = {signUp, login, getUser};