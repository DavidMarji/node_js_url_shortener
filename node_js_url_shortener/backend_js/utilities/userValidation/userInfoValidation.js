const validateUserSignUp= function validateUserSignUp(usernameToSave, emailToSave, passwordToSave) {
    if(usernameToSave === null || usernameToSave === undefined || usernameToSave.length === 0  || usernameToSave.includes(" ")){
        // invalid username
        return 409;
    }

    if(emailToSave === null || emailToSave === undefined || emailToSave.length === 0 
        || !emailToSave.includes("@")
        || emailToSave.includes(" ")){
        // invalid email
        return 409;
    }

    if(passwordToSave === null || passwordToSave === undefined || passwordToSave.length == 0  
        || passwordToSave.includes(" ")){
        // invalid password
        return 409;
    }
    return 200;
}

const validateUserLogin= function validateUserLogin(username, password) {
    
    if(username === null || username === undefined || username.length === 0  || username.includes(" ")){
        // invalid username
        return 409;
    }

    if(password === null || password === undefined || password.length == 0  
        || password.includes(" ")){
        // invalid password
        return 409;
    }

    return 200;
}

module.exports = {validateUserSignUp, validateUserLogin};