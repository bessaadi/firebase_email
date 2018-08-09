/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
const admin = require("firebase-admin");
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const template = require('./template.js');
const envDev = require('./env-dev.json');
const envProd = require('./env-prod.json');

//firebase functions:config:set app.environment="prod" or dev
const serviceAccount = functions.config().app.environment === 'dev' ? envDev : envProd;
const gmailEmail = serviceAccount.mail.email;
const gmailPassword = serviceAccount.mail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.askConfirm = functions.https.onRequest((request, response) => {
  if(request.method !== "POST"){
    response.status(400).send('Please send a POST request');
  } else {
    let data = request.body;
    let ret = sendEmailConfirm(data,gmailEmail,"Thanks and Welcome!")
    .then(() =>  response.send( '{"status":"success"}'))
    .catch((error) =>  response.send('{"status":"failure", "error":"' + JSON.stringify(error)+'"}' ))
  }
});

const sendEmailConfirm = (datamail, from, subject) => { 
  const mailOptions = {
    from: from,
    to: datamail.user,
  };
  mailOptions.subject = subject;
  var data = {
  token: datamail.token
  }
  var html = template.getTemplateAskConfirm();
  const compiledTemplate = handlebars.compile(html);
  const htmlToSend = compiledTemplate(data);    
  mailOptions.html = htmlToSend;

  return mailTransport.sendMail(mailOptions);
}
