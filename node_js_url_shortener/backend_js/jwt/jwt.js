const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secretKey = crypto.randomUUID();

const generateAccessToken = function generateAccessToken(usernameToSave) {
    const payload = {
       username : usernameToSave
    };
    
    const options = { expiresIn: '1h' };
  
    return jwt.sign(payload, secretKey, options);
}

const verifyAccessToken = function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return {success : true, data : decoded };
    }
    catch (error) {
        return {success : false, error : error.message };
    }
}

module.exports = {generateAccessToken, verifyAccessToken, secretKey};