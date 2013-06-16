var response = function(url, status, pageStatus, operationStatus, description)
{
    this.setURL(url);
    this.setStatus(status);
    this.setPageStatus(pageStatus);
    this.setOperationStatus(operationStatus);
    this.setDescription(description);
}

/* Public members starts here */

/**
 * @access public
 * @var string current page URL
 */  

response.prototype.url = '';

/**
 * @access public
 * @var string status of the script, can take following values: starting, processing, finishing
 */  

response.prototype.status = 'starting';
response.prototype.pageStatus = 'fail';
response.prototype.operationStatus = 'fail';
response.prototype.description = '';

/* Public members ends here */

/* Public set methods starts here */

response.prototype.setURL = function(url)
{
    if (typeof url != 'string') {
        throw 'URL is not a string';        
    }
    
    if (url.length <= 0) {
        throw 'URL length is equal or less than zero';
    }
    
    this.url = url;
}

response.prototype.setStatus = function(status)
{
    if (typeof status != 'string') {
        throw 'Status is not a string';
    }
    
    status = status.toLowerCase();
    
    if (status != 'starting' && status != 'processing' && status != 'finishing') {
        throw 'Unknown status: ' + status;
    }
    
    this.status = status;
}

response.prototype.setPageStatus = function(status)
{
    if (typeof status != 'string') {
        throw 'Page status is not a string';
    }
    
    status = status.toLowerCase();
    
    if (status != 'success' && status != 'fail') {
        throw 'Unknown page status: ' + status;
    }
    
    this.pageStatus = status;
}

response.prototype.setOperationStatus = function(status)
{
    if (typeof status != 'string') {
        throw 'Operation status is not a string';
    }
    
    status = status.toLowerCase();
    
    if (status != 'success' && status != 'fail' && status != 'unknown') {
        throw 'Unknown operation status: ' + status;
    }
    
    this.operationStatus = status;
}

response.prototype.setDescription = function(description)
{
    if (typeof description != 'string') {
        throw 'Description is not a string';
    }
    
    this.description = description;
}

/* Public set methods ends here */

exports.response = response;