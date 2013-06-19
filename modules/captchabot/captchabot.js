// Modules include
var page = require('webpage');
var response = require('../io/response');
var deferred = require('../async/deferred');

var captchabot = function()
{
    /* Private members starts here */
    
    /**
     * @access private
     * @var object link to the current object
     */        
    
    var obj = this;
    
    var mainPageURL = 'http://captchabot.com/rpc/xml.php';

    var moduleName = 'captchabot';

    var curPage = page.create();
    var curPageURL = '';    
    
    /**
     * @access private
     * @var string previous status of the page, can take following values: success, fail, unknown
     */      
    
    var prevPageStatus = 'unknown'
    
    /* Private members starts here */
    
    /* Private event handlers starts here */
    
    function onMainPageJump(status, def)
    {
        if (status == 'success') {
            var resp = response.create(moduleName, curPageURL, 'starting', status, 'unknown', 'Main page opened successfully...');
            console.log(JSON.stringify(resp));   
            
            def.resolve();
        } else {
            var resp = response.create(moduleName, curPageURL, 'starting', status, 'unknown', 'Fail to open main page...');
            console.log(JSON.stringify(resp));     
            
            def.reject();
        }
    }
    
    /* Private event handles ends here */
    
    /* Private (phantomJS) event handlers starts here */
    
    curPage.onUrlChanged = function(targetUrl) {
        curPageURL = targetUrl; 
    };

    curPage.onLoadFinished = function(status) {
        switch(curPageURL) {
            default:
                break;
        }
    };    
    
    /* Private (phantomJS) event handlers ends here */
    
    /* Privileged core methods starts here */
    
    this.openMainPage = function () {
        var def = new deferred.create();
     
        curPage.open(mainPageURL, function(status) {onMainPageJump(status, def)});    
        return def;
    };
    
    this.checkBalance = function() {
        var def = this.openMainPage();
        
        def.done(function(){console.log('fuck');});
    };
    
    /* Privileged core methods ends here */
    
    /* Privileged get methods starts here */
    /* Privileged get methods ends here */
    
    /* Privileged set methods starts here */
    /* Privileged set methods ends here */    
}

/* Public members starts here */
/* Public members ends here */

exports.create = function create() {
    "use strict";
    
    return new captchabot();
};