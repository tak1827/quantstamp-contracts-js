// const { randomBytes } = require('crypto');
// const { privateToAddress } = require('ethereumjs-util');

class User {
  
  constructor() {
  	this.address = uniqueid;
    uniqueid = (Number(`0x${uniqueid}`) + 1).toString(16);// Increment address
  }

  // Run contracts function
  run(callback) {
    msg.sender = this.address;
    callback.call(this);
  }
}

module.exports = User;
