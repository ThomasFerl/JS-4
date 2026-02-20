// backend/TFEmail.js
const globals    = require('./backendGlobals');
const nodemailer = require("nodemailer");

class TFEmail 
{
  constructor(options = {}) 
  {
        this.from        = options.from        || "";
        this.to          = options.to          || "";
        this.subject     = options.subject     || "";
        this.text        = options.text        || "";
        this.html        = options.html        || "";
        this.attachments = options.attachments || [];
    }

    async send() 
    {
        const transporter = nodemailer.createTransport({
                                                         host  : globals.smtpServer,
                                                         port  : globals.smtpPort,
                                                         secure: false,
                                                         auth  : {
                                                                   user: "",
                                                                   pass: ""
                                                                 }
                                                       });

        return transporter.sendMail({
                                       from       : this.from,
                                       to         : this.to,
                                       subject    : this.subject,
                                       text       : this.text,
                                       html       : this.html,
                                       attachments: this.attachments
                                   });
    }
}

module.exports.TFEmail = TFEmail;
