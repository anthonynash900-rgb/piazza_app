const joi = require('joi');

//registration validation
const registerValidation = (data) => {
    const schemaValidation = joi.object({
        username:joi.string().required().min(3).max(256),
        email:joi.string().required().min(6).max(256).email(),
        password:joi.string().required().min(6).max(1024)
    })
    return schemaValidation.validate(data)
}

//log-in validation
const loginValidation = (data) => {
    const schemaValidation = joi.object({
        email:joi.string().required().min(6).max(256).email(),
        password:joi.string().required().min(6).max(1024)
    })
    return schemaValidation.validate(data)
}

const postValidation = (data) => {
    const schema = joi.object({
        title: joi.string().required(),
        topic: joi.string().valid('Politics', 'Health', 'Sport', 'Tech').required(),
        messageBody: joi.string().required(),
        // Add this line to allow the field through the "gate"
        expirationMinutes: joi.number().integer().min(1).optional() 
    });
    return schema.validate(data);
};


module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation