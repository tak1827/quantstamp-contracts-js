const Assert = require('assert');

const MAX_INT = 2**256 - 1;

class QuantstampAuditView {

  constructor(auditAddress) { 
    this.audit = auditAddress;
    this.auditData = this.audit.auditData;

    this.address = uniqueid;
    uniqueid = (Number(`0x${uniqueid}`) + 1).toString(16);// Increment address
  }

  findMinAuditPricesStats() {
    let sum;
    let n;
    let min = MAX_INT;
    let max;

    let currentWhitelistedAddress = this.auditData.getNextWhitelistedNode('');
    while (currentWhitelistedAddress != 0) {
      const minPrice = this.auditData.minAuditPrice(currentWhitelistedAddress);
      if (minPrice != MAX_INT) {
        n++;
        sum += minPrice;
        if (minPrice < min) {
          min = minPrice;
        }
        if (minPrice > max) {
          max = minPrice;
        }
      }
      currentWhitelistedAddress = this.auditData.getNextWhitelistedNode(currentWhitelistedAddress);
    }

    if (n == 0) {
      min = 0;
    }
    return new AuditPriceStat(sum, max, min, n);
  }
}

class AuditPriceStat {
	constructor(sum, max, min, n) {
		this.sum = sum;
		this.max = max;
		this.min = min;
		this.n = n;
	}
}

module.exports = QuantstampAuditView;
