const Assert = require('assert');

class QuantstampAuditData {

  onlyOwner() {
    return Assert(this.isOwner(msg.sender),
      `${msg.sender} is not owner`
    );
  }

  constructor(token) { 
  	this.owner = msg.sender;
    this.token = token;
    this.whitelistedNodesList = [];
    this.requestCounter = 0;
    this.audits = {};
    this.minAuditPrice = {};
    this.auditTimeoutInBlocks = 25;
    this.maxAssignedRequests = 10;

    this.address = uniqueid;
    uniqueid =(Number(`0x${uniqueid}`) + 1).toString(16);// Increment address
  }

  addAuditRequest(requestor, contractUri, price) {
    // assign the next request ID
    const requestId = ++this.requestCounter;

    // store the audit
    this.audits[requestId] = new Audit(requestor, contractUri, price, block.number,AuditState.Queued, 0, 0, "", 0, msg.sender);

    return requestId;
  }

  getAuditContractUri(requestId) {
    return this.audits[requestId].contractUri;
  }

  getAuditRequestor(requestId){
    return this.audits[requestId].requestor;
  }

  getAuditPrice(requestId) {
    return this.audits[requestId].price;
  }

  getAuditState(requestId) {
    return this.audits[requestId].state;
  }

  getAuditRequestBlockNumber(requestId) {
    return this.audits[requestId].requestBlockNumber;
  }

  setAuditState(requestId, state) {
    this.audits[requestId].state = state;
  }

  getAuditAuditor(requestId) {
    return this.audits[requestId].auditor;
  }

  getAuditRegistrar(requestId) {
    return this.this.audits[requestId].registrar;
  }

  setAuditAuditor(requestId, auditor) {
    this.audits[requestId].auditor = auditor;
  }

  getAuditAssignBlockNumber(requestId) {
    return this.audits[requestId].assignBlockNumber;
  }

  setAuditAssignBlockNumber(requestId, assignBlockNumber) {
    this.audits[requestId].assignBlockNumber = assignBlockNumber;
  }

  setAuditReportHash(requestId, reportHash) {
    this.audits[requestId].reportHash = reportHash;
  }

  setAuditReportBlockNumber(requestId, reportBlockNumber) {
    this.audits[requestId].reportBlockNumber = reportBlockNumber;
  }

  setAuditRegistrar(requestId, registrar) {
    this.audits[requestId].registrar = registrar;
  }

  setAuditTimeout(timeoutInBlocks) {
  	this.onlyOwner();
    this.auditTimeoutInBlocks = timeoutInBlocks;
  }

  setMaxAssignedRequests(maxAssignments) {
  	this.onlyOwner();
    this.maxAssignedRequests = maxAssignments;
  }

  getMinAuditPrice(auditor) {
    return this.minAuditPrice[auditor];
  }

  setMinAuditPrice(auditor, price) {
    this.minAuditPrice[auditor] = price;
  }

  addNodeToWhitelist(addr) {
  	this.onlyOwner();
  	this.whitelistedNodesList.unshift(addr);
  	return true;
  }

  getNextWhitelistedNode(addr) {
  	if(addr === '') return this.whitelistedNodesList[0];

  	const index = this.whitelistedNodesList.findIndex(function(elm){ elm === index });
    if(index === this.whitelistedNodesList.length - 1) return 0;

    return this.whitelistedNodesList[index + 1];
  }

  isOwner(addr) { return addr === this.owner; }

  isWhitelisted(node) { return this.whitelistedNodesList.includes(node); }
}

class Audit {
	constructor(
		requestor, contractUri, price, requestBlockNumber, state, 
		auditor, assignBlockNumber, reportHash, reportBlockNumber, registrar
	) {
		this.requestor = requestor;
		this.contractUri = contractUri;
		this.price = price;
		this.requestBlockNumber = requestBlockNumber;
		this.state = state;
		this.auditor = auditor;
		this.assignBlockNumber = assignBlockNumber;
		this.reportHash = reportHash;
		this.reportBlockNumber = reportBlockNumber;
		this.registrar = registrar;
	}
}

const AuditState = {
		None: 0,
    Queued: 1,
    Assigned: 2,
    Refunded: 3,
    Completed: 4,
    Error: 5,
    Expired: 6,
    Resolved: 7
}

module.exports = { QuantstampAuditData, AuditState };
