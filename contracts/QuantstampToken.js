const Assert = require('assert');

class QuantstampToken {

  constructor() { 
    this.name = "Quantstamp Token";
    this.symbol = "QSP";
    this.decimals = 18;
    this.totalSupply = 1000000000 * (10 ** this.decimals);
    this.balances = {};
    this.allowed = {};
    
    this.address = uniqueid;
    uniqueid = (Number(`0x${uniqueid}`) + 1).toString(16);// Increment address

    this.balances[msg.sender] = this.totalSupply;
  }

  transfer(to, value) {
    this.balances[msg.sender] -= value;
    if (typeof this.balances[to] === 'undefined') this.balances[to] = 0;
    this.balances[to] += value;
    return true;
  }

  transferFrom(from, to, value) {
    const allowance = this.allowed[from][msg.sender];
    this.balances[from] -= value;
    if (typeof this.balances[to] === 'undefined') this.balances[to] = 0;
    this.balances[to] += value;
    this.allowed[from][msg.sender] -= value;
    return true;
  }

  approve(spender, value) {
  	if (typeof this.allowed[msg.sender] === 'undefined') this.allowed[msg.sender] = {};
    this.allowed[msg.sender][spender] = value;
    return true;
  }
}

module.exports = QuantstampToken;
