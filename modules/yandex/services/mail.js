/**
 * Bogey
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the GNU GENERAL PUBLIC LICENSE (Version 3)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.gnu.org/licenses/gpl.html
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to red331@mail.ru so we can send you a copy immediately.
 *
 * Module mail is a part of PhantomJS framework - Bogey.
 *
 * @package Bogey
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 * @copyright Copyright (c) 2013 Selihov Sergei Stanislavovich.
 * @license http://www.gnu.org/licenses/gpl.html GNU GENERAL PUBLIC LICENSE (Version 3)
 *
 */

/**
 * Modules for Yandex service (http://www.yandex.ru).
 *
 * @subpackage yandex
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 */

/**
 * Services that are working with yandex (http://www.yandex.ru).
 *
 * @subpackage services
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 */

/**
 * Documents the Mail class.
 *
 * Following code represents a wrapper class for Yandex-mail service.
 *
 * @subpackage Mail
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 * 
 */

// Modules include
var service = require('../../core/service');
var deferred = require('../../async/deferred');

var Mail = function(configObj)
{ 
    service.constFunc.call(this, configObj, 'yandex_mail');
    
    /* Private members starts here */
    
    /**
     * @access private
     * @var object link to the current object
     */        
    
    var obj = this;   
        
    /**
     * @access private
     * @var string main URL of the service
     */        
    
    var mainPageURL = 'http://mail.yandex.ru/';
        
    /**
     * @access private
     * @var int timeout (in milliseconds) for operation which is responsible for opening main page of the service
     */      
    
    var openMainPageTimeout = 5000;
    
    /**
     * @access private
     * @var int timeout (in milliseconds) for operation which is responsible for opening registration page of the service
     */          
    
    var openRegPageTimeout = 10000;
    
    /**
     * @access private
     * @var int logout operation timeout in milliseconds
     */       
    
    var logOutTimeout = 10000;   
    
    /**
     * @access private
     * @var int user mail registration operation timeout in milliseconds
     */           
    
    var registerMailAccountTimeout = 200000;
    
    /**
     * @access private
     * @var int timeout after which registration form will be rechecked for input errors
     */       
    
    var recheckRegisterFromTimeout = 10000;
 
    /**
     * @access private
     * @var int delay before main page (while logged in) is checked
     */      
 
    var logedInPageCheckDelay = 5000;
       
    /* Private members ends here */
    
    /* Private core methods starts here */ 
    
    /**
     * Method that saves captcha to the designated folder.
     *
     * Method uses supplied data to set clipping rectangle for the current page and save the snapshot of the captcha to the designated folder.
     *
     * @access private
     * 
     * @param int top offset of the clipping rectangle
     * @param int left offset of the clipping rectangle
     * @param int width of the clipping rectangle
     * @param int height of the clipping rectangle
     *
     * @return string relative path to captcha snapshot.
     */      
    
    function saveCaptchaImage(top, left, width, height)
    {
        var def = deferred.create();  
        var curPage = obj.getPage();
        var oldClipRect = curPage.clipRect;
        
        var path = 'captchas';
        var name = 'captcha_' + Date.now();
        
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Taking captcha snapshot...'); 
                
        curPage.clipRect = {
            'top': top, 
            'left': left, 
            'width': width, 
            'height': height
        };
        
        obj.takeSnapshot('jpeg', name, path).done(function(fullPath){
            obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'success', 'Captcha snapshot successful ("' + fullPath + '")...'); 
            def.resolve(fullPath);
        }).fail(function(err){
            obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'fail', 'Captcha snapshot fail...'); 
            def.reject(err);
        }).always(function(){
            curPage.clipRect = oldClipRect;
        });
        
        return def.promise();
    }
    
    /**
     * Method that is responsible for opening main page of the service.
     *
     * Complex method that tries to open main page of the service.
     *
     * @access private
     *
     * @return object operation promise.
     */      
   
    function openMainPage()
    {
        var curPage = obj.getPage();
        var curPageName = obj.getCurPageName();
        
        var def = deferred.create();
        var curPing = obj.getPing();

        // reject if timeout
        setTimeout(function(){
            if (!def.isProcessed()) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Opening main page takes too long...');
                def.reject(obj.createErrorObject(1, 'Main page open timeout'));
            }
        }, openMainPageTimeout + curPing);      
                
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Opening main page...'); 
        
        // check if main page is already open
        if (obj.getCurPageURL() == mainPageURL || curPageName == 'mainPage') {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'success', 'Main page already opened...'); 
            
            this.setCurPageName('mainPage');
            def.resolve();
        } else {         
            // open main page
            curPage.open(mainPageURL, function(status) {
                if (status == 'success' && !def.isProcessed()) {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', status, 'success', 'Main page successfuly opened...'); 
                    
                    obj.setCurPageName('mainPage');
                    def.resolve();
                } else {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', status, 'fail', 'Cannot open main page...'); 
                    def.reject(obj.createErrorObject(3, 'Main page cannot be opened'));
                }           
            });                                  
        }
                
        return def.promise();
    }  
    
    /**
     * Method that is responsible for opening registration page of the service.
     *
     * Complex method that tries to open registration page of the service.
     *
     * @access private
     *
     * @return object operation promise.
     */     
    
    function openRegPage()
    {
        var curPage = obj.getPage();      
        var curPageName = obj.getCurPageName();
        
        var def = deferred.create();  
        var curPing = obj.getPing();
         
        // reject if timeout
        setTimeout(function(){
            if (!def.isProcessed()) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Opening registration page takes too long...');
                def.reject(obj.createErrorObject(1, 'Registration page open timeout'));
            }
        }, openRegPageTimeout + logedInPageCheckDelay + curPing);      
        
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Opening registration page...'); 
        
        // check if the registration page is already open
        if (curPageName == 'regPage') {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'success', 'Registration page is already loaded...');
            def.resolve();
            return def.promise();
        }
        
        // check if we already logged in
        isLogedIn().done(function(){
            obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Already loged in, trying to logout...'); 
            
            // trying to logout
            logOut().done(function(){                
                // open main page
                openMainPage().done(function(){
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'success', 'Registration page successfully loaded...');
                    def.resolve();
                }).fail(function(error){
                    obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Cannot open registration page...');
                    def.reject(error);
                });                               
            }).fail(function(error){
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Cannot open registration page...');     
                def.reject(error);
            });                        
        }).fail(function(error){
            if (typeof error == 'object' && (error.code == 3 || error.code == 1)) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Cannot open registration page, error while checking login status...');               
                def.reject(error);
                
                return def.promise();
            }
                       
            // page change callback
            obj.pushPageLoadFunc(function(status){      
                if (status == 'success') {
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Checking registration page...');
                    obj.validatePageBySchema('yandex/schemas/sandbox/mail/validation/regform.js', 'yandex', 'regForm', 'plain-objects', ['sandbox/utils.js']).done(function(result){                          
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'success', 'Registration page valid...');
                        obj.setCurPageName('regPage');
                        
                        def.resolve(result);      
                    }).fail(function(error){
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'Invalid registration page...');
                        def.reject(error);                             
                    });                                           
                } else {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Error while redirecting to registration page...');
                    def.reject(obj.createErrorObject(3, 'Error while redirecting to registration page'));
                }                                          
            });   
        
            // page created callback
            obj.pushPageCreatedFunc(function(page){      
                obj.setPage(page);           
            });         
                       
            obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Not logged in, trying to open registration page...');      
            
            // run dummy schema (click logout button)
            var schema = require('../schemas/dummy/mail/clickmakeemail').schema;

            obj.runDummySchema(schema).done(function(){                             
                obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', '"dummy" schema successfully processed...');
                //obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Checking for additional overlay...');
                
                
                // if additional overlay is open - click the button
                /*schema = require('../schemas/dummy/mail/clickmakeemailoverlay').schema;
                obj.runDummySchema(schema).done(function(){ 
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Additional overlay found...');
                }).fail(function(error){
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'No additional overlay found...');
                });*/               
            }).fail(function(error){
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'Cannot run "dummy" schema for "click make email"...');
                def.reject(obj.createErrorObject(4, error));
            });            
        });    
        
        return def.promise();
    }
    
    /**
     * Method that starts checks whether current object logged in to mail.yandex or not.
     *
     * Current uses schema to parse main page and to find out evidence that the current object logged in to mail.yandex or not.
     *
     * @access private
     * 
     * @return object promise.
     * 
     */    
       
    function isLogedIn()
    {
        var def = deferred.create();  
        var curURL = obj.getCurPageURL();
        
        var result = null;
        
        var validate = function() {
            // parse toolbar
            result = obj.validatePageBySchema('yandex/schemas/sandbox/mail/validation/mailtoptoolbar.js', 'yandex', 'mailTopToolbar', 'plain-objects', ['sandbox/utils.js']).done(function(result){
                def.resolve(result);
            }).fail(function(error){
                def.reject(error);   
            });              
        }

        // check if any page is open
        if (curURL == '' || curURL == 'about:blank') {
            openMainPage().done(function(){
                setTimeout(function(){
                    validate(); 
                }, logedInPageCheckDelay);                                 
            }).fail(function(error){
                def.reject(error);
            });
        } else {
            setTimeout(function(){
                validate(); 
            }, logedInPageCheckDelay);            
        }
        
        return def.promise();
    }    
    
    /**
     * Method that tries to logout from the current service.
     *
     * Complex method that utilizes different methods to logout from the service.
     *
     * @access privileged
     * 
     * @return object promise.
     * 
     */       
    
    function logOut()
    {
        var curPage = obj.getPage();
        var def = deferred.create();  
        
        var curPing = obj.getPing();
        
        // reject if timeout
        setTimeout(function(){
            if (!def.isProcessed()) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Logout takes too long...');
                def.reject(obj.createErrorObject(1, 'Logout timeout'));
            }
        }, logOutTimeout + logedInPageCheckDelay + curPing);   
        
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Starting logout process...');
        
        // checking top toolbar
        obj.validatePageBySchema('yandex/schemas/sandbox/mail/validation/mailtoptoolbar.js', 'yandex', 'mailTopToolbar', 'plain-objects', ['sandbox/utils.js']).done(function(result){
            obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Top toolbar found, trying to log out...');
     
            // page change callback
            obj.pushPageLoadFunc(function(status){                   
                if (status == 'success') {
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Checking if are logged out...');
                    
                    isLogedIn().done(function(){
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'We still loged in...');
                        def.reject();
                    }).fail(function(error){
                        if (typeof error == 'object' && (error.code == 3 || error.code == 1)) {
                            obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'Cannot logout, error while checking login status...');               
                            def.reject(error);
                
                            return def.promise();
                        }
                       
                        obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'success', 'Not logged in, logout successful...');   
                        def.resolve();                       
                    });
                } else {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Error while redirecting after logout...');
                    def.reject(obj.createErrorObject(3, 'Error while redirecting after logout'));
                }                                   
            });   
            
            // run dummy schema (click logout button)
            var schema = require('../schemas/dummy/mail/clicklogout').schema;
            obj.runDummySchema(schema).done(function(){                             
                obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', '"dummy" schema successfully processed...');   

            }).fail(function(error){
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'Cannot run "dummy" schema for "click logout"...');
                def.reject(obj.createErrorObject(4, error));
            });                                 
        }).fail(function(error){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot find top toolbar...');
            def.reject(error);            
        });
        
        return def.promise();
    }    
    
    /**
     * Method that registers mail account on the service.
     *
     * Complex method that utilizes all the necessary resources and methods to register mail account.
     *
     * @access private
     * 
     * @param object usrAccount mail account settings
     *
     * @return object promise.
     */        
    
    function registerMailAccount(usrAccount)
    {
        var def = deferred.create();  
        var dummyVars = {};
        var regVars;
        
        var recheckTimeout;
        var curPing = obj.getPing();
        
        var key;
        
        var onLoadCallbackFunc = function(status){   
            if (obj.getCurPageURL() == 'https://passport.yandex.ru/registration/simple/') {
                obj.pushPageLoadFunc(onLoadCallbackFunc);
                return;
            }
                
            obj.logProcess(obj.getCurPageURL(), 'processing', 'success', 'unknown', 'Form submited...');
            clearTimeout(recheckTimeout);      
            
            obj.takeSnapshot('jpeg', 'submit_click_redirect', obj.getLogSnapDir()).always(function(){
                if (status == 'success') {                    
                    setTimeout(function(){
                        obj.validatePageBySchema('yandex/schemas/sandbox/mail/validation/mailtoptoolbar.js', 'yandex', 'mailTopToolbar', 'plain-objects', ['sandbox/utils.js']).done(function(result){
                            obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'success', 'New email account registered, main toolbar found...');                                        
                            def.resolve(regVars);
                        }).fail(function(error){
                            obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Fail to register new email account, main toolbar not found...');
                            def.reject(error);
                        });   
                    }, logedInPageCheckDelay);                                                                                                       
                } else {
                    obj.logProcess(obj.getCurPageURL(), 'finishing', 'fail', 'fail', 'Error while trying to register new email...');
                    def.reject(obj.createErrorObject(3, 'Error while trying to register new email'));
                } 
            });                                                                               
        }
        
        // reject if timeout
        setTimeout(function(){
            if (!def.isProcessed()) {
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Mail account registration takes too long...');
                  
                obj.takeSnapshot('jpeg', 'register_timeout', obj.getLogSnapDir()).always(function(){
                    def.reject(obj.createErrorObject(1, 'Mail registration timeout'));
                });
                                             
                def.reject(obj.createErrorObject(1, 'Mail registration timeout'));
            }
        }, registerMailAccountTimeout + logedInPageCheckDelay + curPing);   
        
        obj.logProcess(obj.getCurPageURL(), 'starting', 'unknown', 'unknown', 'Starting mail account registration process...'); 
        
        // check input data
        if (typeof usrAccount != 'object') {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Input data is not an object...');
            def.reject(obj.createErrorObject(5, 'Input data is not an object'));
            return def.promise();
        }
        
        if (typeof usrAccount.firstName != 'string' || usrAccount.firstName.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'First name is not a string...');
            def.reject(obj.createErrorObject(5, 'First name is not a string'));  
            return def.promise();
        }
        
        if (typeof usrAccount.lastName != 'string' || usrAccount.lastName.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Last name is not a string...');
            def.reject(obj.createErrorObject(5, 'Last name is not a string'));  
            return def.promise();
        }     
        
        if (typeof usrAccount.login != 'string' || usrAccount.login.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Login is not a string...');
            def.reject(obj.createErrorObject(5, 'Login is not a string'));  
            return def.promise();
        }          
        
        if (typeof usrAccount.password != 'string' || usrAccount.password.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Password is not a string...');
            def.reject(obj.createErrorObject(5, 'Password is not a string'));  
            return def.promise();
        }    
        
        if (typeof usrAccount.passwordConfirm != 'string' || usrAccount.passwordConfirm.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Password confirmation is not a string...');
            def.reject(obj.createErrorObject(5, 'Password confirmation is not a string'));  
            return def.promise();
        }          
        
        if (typeof usrAccount.optionIndex != 'number' || usrAccount.optionIndex < 1 || usrAccount.optionIndex > 11){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Hint question option is not a number...');
            def.reject(obj.createErrorObject(5, 'Hint question option is not a number'));  
            return def.promise();
        }     
        
        if (typeof usrAccount.hintAnswer != 'string' || usrAccount.hintAnswer.length <=0){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Hint answer is not a string...');
            def.reject(obj.createErrorObject(5, 'Hint answer is not a string'));  
            return def.promise();
        }    

        if (usrAccount.phoneNumber === undefined) {
            usrAccount.phoneNumber = ' ';
        }
        
        if (typeof usrAccount.phoneNumber != 'string'){
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Phone number is not a string...');
            def.reject(obj.createErrorObject(5, 'Phone number is not a string'));  
            return def.promise();
        }         

        // prepare dummy vars
        dummyVars.firstName = {'text': usrAccount.firstName};
        dummyVars.lastName = {'text': usrAccount.lastName};
        dummyVars.login = {'text': usrAccount.login};
        dummyVars.password = {'text': usrAccount.password};
        dummyVars.passwordConfirm = {'text': usrAccount.passwordConfirm};
        dummyVars.hintQuestionId = {'optionIndex': usrAccount.optionIndex};
        dummyVars.hintAnswer = {'text': usrAccount.hintAnswer};
        dummyVars.phoneNumber = {'text': usrAccount.phoneNumber};

        // open registration page
        openRegPage().done(function(){            
            obj.logProcess(obj.getCurPageURL(), 'processing', 'unknown', 'unknown', 'Entering account data...');
       
            // page change callback
            obj.pushPageLoadFunc(onLoadCallbackFunc);        
           
            // enter account data
            var schema = require('../schemas/dummy/mail/enterregdata').schema;

            // fill registration data
            obj.runDummySchema(schema, dummyVars).done(function(resVars){                             
                obj.logProcess(obj.getCurPageURL(), 'processing', 'unknown', 'unknown', '"dummy" schema successfully processed...');
                
                regVars = new Array();

                for (key in resVars) {
                    regVars.push({'key': key, data: resVars[key]})
                }
                
                // recheck registration form after timeout
                recheckTimeout = setTimeout(function(){
                    obj.logProcess(obj.getCurPageURL(), 'processing', 'unknown', 'unknown', 'Rechecking entered data...');
 
                    obj.validatePageBySchema('yandex/schemas/sandbox/mail/validation/invalidregformdata.js', 'yandex', 'invalidRegFormData', 'plain-objects', ['sandbox/utils.js']).done(function(result){
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'unknown', 'Entered data is valid...');
                    }).fail(function(error){
                        obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Entered data is not valid...');
                        
                        obj.takeSnapshot('jpeg', 'invalid_enter_data', obj.getLogSnapDir()).always(function(){
                            def.reject(error);
                        });                       
                    });  
                }, recheckRegisterFromTimeout + curPing);             
            }).fail(function(error){
                obj.logProcess(obj.getCurPageURL(), 'finishing', 'success', 'fail', 'Cannot run "dummy" schema (registration data)...');
                if (typeof error == 'object') {
                    def.reject(error);
                } else {
                    def.reject(obj.createErrorObject(4, error));
                }
            });   
                       
        }).fail(function(error) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot register new mail account...');
            def.reject(error);
        });
        
        return def.promise();
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
    
    /**
     * Operation method that starts (or puts to the stack) operation 'openMainPage'.
     *
     * Method that starts operation that tries to open main page of the service.
     *
     * @access privileged
     *
     * @return object operation promise.
     */      
       
    this.openMainPage = function()
    {
        try {
            return obj.startOp(openMainPage);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "openMainPage"...');
        }           
    } 
    
    /**
     * Operation method that starts (or puts to the stack) operation 'openRegPage'.
     *
     * Method that starts operation that tries to open registration page of the service.
     *
     * @access privileged
     *
     * @return object operation promise.
     */     
    
    this.openRegPage = function()
    {
        try {
            return obj.startOp(openRegPage);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "openRegPage"...');
        }            
    }
    
    /**
     * Operation method that starts (or puts to the stack) operation 'registerMailAccount'.
     *
     * Method that starts operation that tries to register mail account on the service.
     *
     * @access privileged
     * 
     * @param object usrAccount mail account settings
     *
     * @return object operation promise.
     * 
     */       
    
    this.registerMailAccount = function(usrAccount)
    {
        try {
            return obj.startOp(registerMailAccount, usrAccount);
        } catch(e) {
            obj.logProcess(obj.getCurPageURL(), 'finishing', 'unknown', 'fail', 'Cannot start operation "registerMailAccount"...');
        }          
    }
        
    /* Privileged core methods ends here */
    
    /* Privileged event handlers starts here */
    
    /**
     * Event handler that is called when the captcha needs to be parsed.
     *
     * Method recieves information about element that contains captcha on the page, saves the captcha to the file and sends it to 
     * the current scenario for future parsing.
     *
     * @access privileged
     * 
     * @param object elm captcha element
     *
     * @return object operation promise.
     * 
     */      
    
    this.onParseCaptchaByElm = function(elm)
    {
        var def = deferred.create();
       
        saveCaptchaImage(elm.top, elm.left, elm.width, elm.height).done(function(path){
           obj.getScenario().onParseCaptchaByPath(path).done(function(data) {
               def.resolve(data);
           }).fail(function(err){
               def.reject(err);
           });
        }).fail(function(err){
            def.reject(err);
        });

        return def.promise();
    }
    
    /* Privileged event handlers ends here */    
 
    this.configureService(configObj);
}

exports.constFunc = Mail;
exports.create = function create(configObj) {
    "use strict";
    Mail.prototype = service.create(configObj, 'yandex_mail');
    return new Mail(configObj, 'yandex_mail');
};   