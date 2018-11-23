const CryptoJS = require('crypto-js');
const QuantstampAudit = require('./contracts/QuantstampAudit');
const { QuantstampAuditData, AuditState }  = require('./contracts/QuantstampAuditData');
// const QuantstampAuditView  = require('./contracts/QuantstampAuditView');
const QuantstampToken  = require('./contracts/QuantstampToken');
const Sample  = require('./contracts/Sample');
const User = require('./User');


/* Global variables */

// Define ethereum address seed as 4 (hex) character
global.uniqueid = "f001";

// Same as msg.sender of solidity
global.msg = { sender: null, value: null };

// Same as block.number of solidity
global.block = { number: 1000 };

// Create Users
let developer = new User();
let validator = new User();
let creator = new User();

// Create QST


/********************************
 0. Prepare
*********************************/

let QST, QSTAuditData, QSTAudit, QSTAuditView

// Creater deploy contracts
creator.run(function() {

  // QST ERC20 Token contract
  QST = new QuantstampToken();

  // The storage portion of the project. This contract contains all data 
  // meant to persist between all versions of the protocol, such as audit requests.
  QSTAuditData = new QuantstampAuditData(QST);

  // The logic portion of the project. This contract contains all logic and 
  // data relevant to the particular decisions of the protocol.
  QSTAudit = new QuantstampAudit(QSTAuditData);

  // The data interface portion of the project. 
  // This contract serves only to give access to information about the protocol’s data, 
  // primarily meant to be accessed by a web application through web3.
  // QSTAuditView = new QuantstampAuditView(QSTAudit);
});

block.number++;

creator.run(function() {

  // Developer is given tokens
  QST.transfer(developer.address, 1000);

  // Validaer is quarified
  QSTAuditData.addNodeToWhitelist(validator.address);

  // Set minimum audit price
  QSTAuditData.setMinAuditPrice(validator.address, 9);

});

block.number++;


/********************************
 1. Developer request audit
*********************************/

let Samp, requestId;

developer.run(function() {

  // Create a contract to be audit
  Samp = new Sample();

  // Cost of verification
  const cost = 10;

  QST.approve(QSTAudit.address, cost);

  // Request audit
  requestId = QSTAudit.requestAudit(Samp.address, cost);

});

block.number++;


/********************************
 2. Validator get audit request
*********************************/

validator.run(function() {

  // Get audit request
  QSTAudit.getNextAuditRequest();

});

block.number++;


/********************************
 3. Validator submit repot
*********************************/

validator.run(function() {

  // Report hash -> Following creation is not real
  const reportHash = CryptoJS.RIPEMD160(CryptoJS.SHA256(JSON.stringify(Samp))).toString();

  // Submit report
  QSTAudit.submitReport(requestId, AuditState.Completed, reportHash);

});

block.number++;


console.log({
  developer: JSON.stringify(developer),
  validator: JSON.stringify(validator),
  creator: JSON.stringify(creator),
  QST: JSON.stringify(QST),
  QSTAudit: JSON.stringify(QSTAudit),
  QSTAuditData: JSON.stringify(QSTAuditData),
  // QSTAuditView: JSON.stringify(QSTAuditView),
})
