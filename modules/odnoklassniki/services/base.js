// Modules include
var service = require('../../core/service');
var dummy = require('../../core/dummy');
var deferred = require('../../async/deferred');
var sandboxutils = require('../../utils/sandboxutils');

var Base = function(configObj)
{ 
    service.constFunc.call(this, configObj, 'odnoklassniki_base');
    
    /* Private members starts here */
    
    /**
     * @access private
     * @var object link to the current object
     */        
    
    var obj = this;    
    
    var mainPageURL = 'http://www.odnoklassniki.ru/';
    
    var logInTimeout = 6000;
    var logOutTimeout = 6000;
    var openMainPageTimeout = 3000; 
    
    /* Private members ends here */
      
    /* Private core methods starts here */  
    
    function openMainPage()
    {
        var curPage = this.getPage();
        var def = deferred.create();
        
        // reject if timeout
        setTimeout(function(){
            if (!def.isDone()) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Opening main page takes too long...');
                def.reject();
            }
        }, openMainPageTimeout);      
                
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Opening main page...'); 
        
        // check if main page is already open
        if (obj.getCurPageURL() == mainPageURL) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'success', 'Main page already opened...'); 
            def.resolve();
        } else {         
            // open main page
            curPage.open(mainPageURL, function(status) {
                if (status == 'success') {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', status, 'success', 'Main page successfuly opened...'); 
                    def.resolve();
                } else {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', status, 'fail', 'Cannot open main page...'); 
                    def.reject();
                }           
            });                                  
        }
                
        return def;
    }    
    
    
    function logOut()
    {
        var curPage = obj.getPage();
        var def = deferred.create();  
        
        def.resolve();
        
        return def;
    }
    
    function logIn()
    {
        var curPage = obj.getPage();
        var def = deferred.create();
        
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Opening login page...');    
        obj.logOut().done(function() {                               

            // open main page
            obj.openMainPage().done(function(){
                
                // reject if timeout
                setTimeout(function(){
                    if (!def.isDone()) {
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Login takes too long...');
                        def.reject();
                    }
                }, logInTimeout); 

                // check login page and find offset of the elements
                var result = curPage.evaluate(function(trimFunc, findOffsetFunc, checkElementsBySchemaFunc, bindShowMarkOnClickFunc) {
                    // check by schema
                    var schema = {
                        elm1: {
                            sel: '#loginPanel',
                            sub: {
                                elm1: {
                                    sel: 'h2',
                                    text: [trimFunc, 'Log in']
                                },
                                elm2: {
                                    sel: '#field_email',
                                    func: findOffsetFunc
                                },
                                elm3: {
                                    sel: '#field_password',
                                    func: findOffsetFunc
                                },
                                elm4: {
                                    sel: '#hook_FormButton_button_go',
                                    func: findOffsetFunc
                                }
                            }
                        }
                    }
                    bindShowMarkOnClickFunc();
                    try {
                        return JSON.stringify(checkElementsBySchemaFunc(schema));    
                    } catch(e) {
                        return JSON.stringify({error: true, message: e});
                    }
                    
                }, sandboxutils.trim, sandboxutils.findOffset, sandboxutils.checkElementsBySchema, sandboxutils.bindShowMarkOnClick);
                   console.log(result);
                // check result
                result = JSON.parse(result);
                        
                if (result.error != undefined && result.error == true) {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Invalid login page...'); 
                    def.reject();
                } else {
                    curPage.viewportSize = {width: 800, height: 600};
  
                    var curDummy = dummy.create(curPage);
                    var subResult = result.slice(0, 2);
                    
                    subResult[0].text = 'login';
                    subResult[1].text = 'pass';
                    curDummy.fillTextInputBunch(subResult);
                    
                    
                                        //curPage.sendEvent('mousepress', result[0].top + 10, result[0].left + 10, 'left');
                    //curPage.sendEvent('keypress', 'a', null, null);
                    
                    //curPage.settings.javascriptEnabled = true;
                    //curPage.settings.loadImages = true;
                    //curPage.clipRect = { top: 0, left: 0, width: 1024, height: 1024 };
                    //curPage.viewportSize = { width: 800, height: 600 };

                    //curPage.sendEvent('click', result[1].left, result[1].top, 'left');
                    //curPage.sendEvent('keypress', 'c', null, null);                    
               
                    obj.takeSnapshot('jpeg', 'test', '/', 1024, 768); 
                    
                }                                          
            }).fail(function(){
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Cannot open login page...'); 
                def.reject();                
            });   
        }).fail(function(){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Cannot open login page...'); 
            def.reject();
        });
         
        return def;        
    }
    
    /* Private core methods ends here */
    
    /* Privileged core methods starts here */
    
    /**
     * Method that configures current service.
     *
     * Every new service must overload this method to configure only necessary options.
     *
     * @access privileged
     *
     * @param object configObj object with configuration options
     *
     */     
    
    this.configureService = function(configObj) 
    {
        if (typeof configObj != 'object') {
            return;
        }
    } 
    
    this.logIn = function()
    {
        try {
            return this.startOp(logIn);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "logIn"...');
        }        
    }     
    
    this.logOut = function()
    {
        try {
            return this.startOp(logOut);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "logOut"...');
        }        
    }    
    
    this.openMainPage = function()
    {
        try {
            return this.startOp(openMainPage);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "openMainPage"...');
        }           
    }       
    
    /* Privileged core methods ends here */

    this.configureService(configObj);
}

exports.constFunc = Base;
exports.create = function create(configObj) {
    "use strict";
    
    Base.prototype = service.create(configObj, 'odnoklassniki_base');
    return new Base(configObj, 'odnoklassniki_base');
};