const Assert = require('assert');
const { AuditState }  = require('./QuantstampAuditData');

const MAX_INT = 2**256 - 1;

class QuantstampAudit {

  onlyWhitelisted() {
    this.auditData.isWhitelisted(msg.sender);
  }

  constructor(auditDataAddress) { 
    this.auditData = auditDataAddress;
    this.assignedAudits = [];
    this.assignedRequestCount = {};
  	this.priceList = []; // increasingly sorted linked list of prices
  	this.auditsByPrice = {}; // map from price to a list of request IDs

    this.address = uniqueid;
    uniqueid = (Number(`0x${uniqueid}`) + 1).toString(16);// Increment address
  }

  refund(requestId) {

    const from = msg.sender;
    msg.sender = this.address;

  	const state = this.auditData.getAuditState(requestId);

    // check that the audit exists and is in a valid state
    if (state != AuditState.Queued &&
          state != AuditState.Assigned &&
            state != AuditState.Expired) {
      return false;
    }

    const requestor = this.auditData.getAuditRequestor(requestId);

    if (requestor != from) return;

    const refundBlockNumber = this.auditData.getAuditAssignBlockNumber(requestId) + 
    	this.auditData.auditTimeoutInBlocks;
    
    // check that the auditor has not recently started the audit (locking the funds)
    if (state == AuditState.Assigned) {
      if (block.number <= refundBlockNumber) return false;

      // the request is expired but not detected by getNextAuditRequest
      this.updateAssignedAudits(requestId);
    } else if (state == AuditState.Queued) {
      // remove the request from the queue
      // note that if an audit node is currently assigned the request, it is already removed from the queue
      this.removeQueueElement(requestId);
    }

    // set the audit state to refunded
    this.auditData.setAuditState(requestId, AuditState.Refunded);

    // return the funds to the user
    const price = this.auditData.getAuditPrice(requestId);

    return this.auditData.token.transfer(requestor, price);
  }

  requestAudit(contractUri, price) {
    Assert(price > 0);

    const from = msg.sender;
    msg.sender = this.address;

    // transfer tokens to this contract
    this.auditData.token.transferFrom(from, this.address, price);
    // store the audit
    const requestId = this.auditData.addAuditRequest(from, contractUri, price);

    // Add request to queue
    this.queueAuditRequest(requestId);

    return requestId;
  }

  submitReport(requestId, auditResult, reportHash) {
  	this.onlyWhitelisted();

    const from = msg.sender;
    msg.sender = this.address;

    if (AuditState.Completed != auditResult && AuditState.Error != auditResult) return;

    const auditState = this.auditData.getAuditState(requestId);
    if (auditState != AuditState.Assigned) return;

    // the sender must be the auditor
    if (from != this.auditData.getAuditAuditor(requestId)) return;

    // remove the requestId from assigned queue
    this.updateAssignedAudits(requestId);

    // auditor should not send a report after its allowed period
    const allowanceBlockNumber = this.auditData.getAuditAssignBlockNumber(requestId) + this.auditData.auditTimeoutInBlocks;
    if (allowanceBlockNumber < block.number) {
      // update assigned to expired state
      this.auditData.setAuditState(requestId, Expired);
      return;
    }

    // update the audit information held in this contract
    this.auditData.setAuditState(requestId, auditResult);
    this.auditData.setAuditReportHash(requestId, reportHash);
    this.auditData.setAuditReportBlockNumber(requestId, block.number);

    // validate the audit state
    Assert(this.isAuditFinished(requestId));

    if (auditResult == AuditState.Completed) {
      const auditPrice = this.auditData.getAuditPrice(requestId);

      // Validator get QST token as reward
      this.auditData.token.transfer(from, auditPrice);
    }
  }

  getNextAuditRequest() {
  	this.onlyWhitelisted();

    const from = msg.sender;
    msg.sender = this.address;

    // remove an expired audit request
    if (this.assignedAudits.length !== 0) {
      const potentialExpiredRequestId = this.assignedAudits[0];
      const allowanceBlockNumber = this.auditData.getAuditAssignBlockNumber(potentialExpiredRequestId) + 
        this.auditData.auditTimeoutInBlocks;
      if (allowanceBlockNumber < block.number) {
        this.updateAssignedAudits(potentialExpiredRequestId);
        this.auditData.setAuditState(potentialExpiredRequestId, AuditState.Expired);
      }
    }

    const isRequestAvailable = this.anyRequestAvailable(from);

    // there are no audits in the queue
    if (isRequestAvailable == AuditAvailabilityState.Empty) return;

    // check if the auditor's assignment is not exceeded.
    if (isRequestAvailable == AuditAvailabilityState.Exceeded) return;

    // there are no audits in the queue with a price high enough for the audit node
    const minPrice = this.auditData.getMinAuditPrice(from);
    const requestId = this.dequeueAuditRequest(minPrice);
    if (requestId === 0) return;

    // Update storage contract
    this.auditData.setAuditState(requestId, AuditState.Assigned);
    this.auditData.setAuditAuditor(requestId, from);
    this.auditData.setAuditAssignBlockNumber(requestId, block.number);
    this.assignedRequestCount[from]++;

    // push to the tail
    this.assignedAudits.push(requestId);
  }

  queueAuditRequest(requestId, existingPrice) {
    const price = this.auditData.getAuditPrice(requestId);
    const index = this.priceList.findIndex(item => item === price);
    if (index === -1) {
      // if a price bucket doesn't exist, create it next to an existing one
      const posi = this.priceList.findIndex(item => item > price);
      this.priceList.splice(posi, 0, price);
    }
    // push to the tail
    if (typeof this.auditsByPrice[price] === 'undefined') this.auditsByPrice[price] = [];
    this.auditsByPrice[price].push(requestId);
  }

  updateAssignedAudits(requestId) {
  	const index = this.assignedAudits.findIndex(item => item === requestId);
    this.assignedAudits.splice(index, 1);
    this.assignedRequestCount[this.auditData.getAuditAuditor(requestId)]--;
  }

  removeQueueElement(requestId) {
    const price = this.auditData.getAuditPrice(requestId);

    // the node must exist in the list
    Assert(typeof this.priceList[price] !== 'undefined');
    require(typeof this.auditsByPrice[price] !== 'undefined' &&
    	this.auditsByPrice[price].findIndex(item => item === requestId) !== -1);

    const index = this.auditsByPrice[price].findIndex(item => item === requestId);
    this.auditsByPrice[price].splice(index, 1);
    if (this.auditsByPrice[price].length === 0) {
    	const posi = this.priceList.findIndex(item => item === price);
    	this.priceList.splice(posi, 1);
    }
  }

  isAuditFinished(requestId) {
    const state = this.auditData.getAuditState(requestId);
    return state == AuditState.Completed || state == AuditState.Error;
  }

  anyRequestAvailable(from) {
    // there are no audits in the queue
    if (!this.auditQueueExists()) {
    	return AuditAvailabilityState.Empty;
    }

    // check if the auditor's assignment is not exceeded.
    if (this.assignedRequestCount[from] >= this.auditData.maxAssignedRequests) {
      return AuditAvailabilityState.Exceeded;
    }

    if (this.anyAuditRequestMatchesPrice(this.auditData.getMinAuditPrice(from)) === 0) {
      return AuditAvailabilityState.Underprice;
    }

    return AuditAvailabilityState.Ready;
  }

  auditQueueExists() {
    return this.priceList.length !== 0 ? true : false;
  }

  anyAuditRequestMatchesPrice(minPrice) {

    // picks the tail of price buckets
    const price = this.priceList[0];

    if (price < minPrice) {
      return 0;
    }
    return price;
  }

  dequeueAuditRequest(minPrice) {

    const price = this.anyAuditRequestMatchesPrice(minPrice);

    if (price > 0) {
      // picks the oldest audit request

      const result = this.auditsByPrice[price][0];
    	this.auditsByPrice[price].splice(0, 1);
      // removes the price bucket if it contains no requests
      if (this.auditsByPrice[price].lenght === 0) {
      	const posi = this.priceList.findIndex(item => item === price);
    		this.priceList.splice(posi, 1);
      }
      return result;
    }
    return 0;
  }
}

const AuditAvailabilityState = {
  Error: 0,
  Ready: 1,      // an audit is available to be picked up
  Empty: 2,      // there is no audit request in the queue
  Exceeded: 3,   // number of incomplete audit requests is reached the cap
  Underprice: 4  // all queued audit requests are less than the expected price
}

module.exports = QuantstampAudit;
