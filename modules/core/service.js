/**
 * Phantasm
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
 * Module service is a part of PhantomJS framework - Phantasm.
 *
 * @package Phantasm
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 * @copyright Copyright (c) 2013 Selihov Sergei Stanislavovich.
 * @license http://www.gnu.org/licenses/gpl.html GNU GENERAL PUBLIC LICENSE (Version 3)
 *
 */

/**
 * Core modules of the framework.
 *
 * @subpackage core
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 */

/**
 * Documents the Service class.
 *
 * Following class is a base class for all services (e.q. wrappers classes for different sites and APIs).
 *
 * @subpackage Service
 * @author Selihov Sergei Stanislavovich <red331@mail.ru>
 */

// Modules include
var page = require('webpage');

var logmessage = require('../io/logmessage');
var srError = require('../error/serviceerror');
var deferred = require('../async/deferred');

var fileUtils = require('../utils/fileutils');

var Service = function(configObj, usrServiceName)
{
    /* Private members starts here */
    
    /**
     * @access private
     * @var object link to the current object
     */        
    
    var obj = this;     
        
    /**
     * @access private
     * @var string current service name
     */      
    
    var serviceName = 'service';    
    
    /**
     * @access private
     * @var object page object used for core mechanics
     */       
    
    var curPage = page.create();
    
    /**
     * @access private
     * @var boolean flag that indicates whether current operation has finished or not
     */    
    
    var isOpFinish = true; 
    
    /**
     * @access private
     * @var array of deferred objects of the operations
     */       
    
    var opDefStack = new Array();
    
    /**
     * @access private
     * @var array of functions, which are operations to be executed
     */        
    
    var opFuncStack = new Array();
    
    /**
     * @access private
     * @var array of arguments for operation functions
     */      
    
    var opFuncArgsStack = new Array();
       
    /**
     * @access private
     * @var array stack of callback functions which can be called when URL of the page is changed
     */      
    
    var urlChangeFuncStack = new Array();
    
    /**
     * @access private
     * @var array stack of callback functions which can be called when page content is loaded
     */      
    
    var pageLoadFuncStack = new Array();
    
    /**
     * @access private
     * @var string current page URL
     */       
    
    var curPageURL = '';
    
    /**
     * @access private
     * @var array stack that contains viewport size objects
     */           
    
    var viewportSizeStack = new Array();
    
    /* Private members ends here */
    
    /* Private core methods starts here */
       
    /**
     * Method that pushes deferred object of the operation to the stack.
     *
     * Simple method that pushes deferred object of the operation to the stack.
     *
     * @access private
     *
     * @param object usrDeferred deferred object
     * 
     * @throws string    
     *
     */      
    
    function pushOpDef(usrDeferred)
    {
        if (usrDeferred instanceof deferred.constFunc == false) {
            throw 'Passed parameter is not deferred object';
        }
        
        opDefStack.push(usrDeferred);
    }
    
    /**
     * Method that pulls deferred object of the operation from the stack.
     *
     * Simple method that pulls deferred object of the operation from the stack.
     *
     * @access private
     *
     * @return object first deferred object from the stack.
     * 
     */      
    
    function popOpDef()
    {
        return opDefStack.pop();
    }
    
    /**
     * Method that pushes operation function to the stack.
     *
     * Simple method that pushes operation function to the stack.
     *
     * @access private
     *
     * @param function func operation function
     * 
     * @throws string 
     *
     */    
    
    function pushOpFunc(func)
    {
        if (typeof func != 'function') {
            throw 'Passed operation is not a function';
        }
        
        opFuncStack.push(func);
    }
    
    /**
     * Method that pulls operation function from the stack.
     *
     * Simple method that pulls operation function from the stack.
     *
     * @access private
     *
     * @return object first operation function from the stack.
     * 
     */    
    
    function popOpFunc()
    {
        return opFuncStack.pop();
    }
    
    /**
     * Method that pushes operation function arguments to the stack.
     *
     * Simple method that pushes operation function arguments to the stack.
     *
     * @access private
     *
     * @param array args arguments for the operation function
     *
     */     
    
    function pushOpArgs(args)
    {
        opFuncArgsStack.push(args);
    }
    
    /**
     * Method that pulls operation function arguments from the stack.
     *
     * Simple method that pulls operation function arguments from the stack.
     *
     * @access private
     *
     * @return array of operation function arguments.
     * 
     */      
    
    function popOpArgs()
    {
        return opFuncArgsStack.pop();
    }
        
    /**
     * Method that executes first operation from the stack.
     *
     * If previous operation is finished and there is operation on the stack - it will be executed. When the operation finished 
     * this method will be called again.
     *
     * @access private
     * 
     */     
    
    function execOp()
    {
        if (opDefStack.length > 0 && isOpFinish == true) {               
            var def = popOpDef();
            var func = popOpFunc();
            var args = popOpArgs();

            var funcDef = func.apply(obj, args);
            isOpFinish = false;

            funcDef.done(function(){  
                def.resolve.apply(def, arguments);
                
                isOpFinish = true;
                execOp();
            });
            
            funcDef.fail(function(){               
                def.reject();
                isOpFinish = true;
                
                execOp();
            });            
        }
    }
    
    /* Pirvate core methods ends here */
    
    /* Private event handlers starts here */
    
    /**
     * PhantomJS event handler method that is called when the address URL is changed.
     *
     * Method saves new URL to the internal variable for later use. If there is a callback function on the 'urlChangeFuncStack' it
     * will be executed.
     *
     * @access private
     * 
     * @param string targetUrl current page URL
     * 
     * @see getCurPageURL()
     * @see pushURLChangeFunc()
     * @see popURLChangeFunc()
     * 
     */      
    
    curPage.onUrlChanged = function(targetUrl) {
        curPageURL = targetUrl; 
           
        if (urlChangeFuncStack.length > 0) {
            obj.popURLChangeFunc()(targetUrl);
        }
    };    
        
    /**
     * PhantomJS event handler method that is called when the page is loaded.
     *
     * If there is a callback function on the 'pageLoadFuncStack' it will be executed.
     *
     * @access private
     * 
     * @param string status of the page
     * 
     * @see pushPageLoadFunc()
     * @see popURLChangeFunc()
     * 
     */     
    
    curPage.onLoadFinished = function(status) {        
        if (pageLoadFuncStack.length > 0) {
            obj.popURLChangeFunc()(status);
        }
    };
    
    /* Pirvate event handlers ends here */
    
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
    
    this.configureService = function(configObj) {
        if (typeof configObj != 'object') {
            return;
        }
    }      

    /**
     * Method that logs service execution process.
     *
     * Method creates response object, stringify it and passes it to the console.log() method. 
     *
     * @access privileged
     * 
     * @param string url of the current page
     * @param string status of the operation, can take following values: starting, processing, finishing
     * @param string pageStatus status of the page, can take following values: fail, success
     * @param string operationStatus status of the sub operation (or step), can take following values: success, fail and unknown
     * @param string description additional descriptnio that will be logged
     * 
     */     
    
    this.logProcess = function(url, status, pageStatus, operationStatus, description)
    {
        var resp = logmessage.create(serviceName, url, status, pageStatus, operationStatus, description);
        console.log(JSON.stringify(resp)); 
    }
    
    /**
     * Method that starts an operation.
     *
     * Method accepts operation function and pushes it (and its arguments) to the stack, as well as a deferred object for it.
     * After that method calls execOp() method.
     *
     * @access privileged
     * 
     * @param function func operation function
     * @param array arguments for the current operation function
     * 
     * @return object deferred object.
     * 
     * @see execOp()
     * 
     */       
    
    this.startOp = function()
    {        
        var def = new deferred.create();
        var args = new Array();
        var i = 0;
        
        for (i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        pushOpDef(def);
        pushOpFunc(arguments[0]);
        pushOpArgs(args);
        
        execOp();
                
        return def;
    }
    
    /**
     * Method that pushes 'onURLchange' callback function to the stack.
     *
     * Simple method that pushes 'onURLchange' callback function to the stack.
     *
     * @access privileged
     *
     * @param function func callback function
     * 
     * @throws string 
     *
     */    
    
    this.pushURLChangeFunc = function(func)
    {
        if (typeof func != 'function') {
            throw 'Passed operation is not a function';
        }
        
        urlChangeFuncStack.push(func);
    }  
 
    /**
     * Method that pulls 'onURLchange' callback function from the stack.
     *
     * Simple method that pulls 'onURLchange' callback function from the stack.
     *
     * @access privileged
     *
     * @return object first 'onURLchange' callback function from the stack.
     * 
     */      
    
    this.popURLChangeFunc = function()
    {
        return urlChangeFuncStack.pop();
    } 
    
    /**
     * Method that pushes 'onPageLoad' callback function to the stack.
     *
     * Simple method that pushes 'onPageLoad' callback function to the stack.
     *
     * @access privileged
     *
     * @param function func callback function
     * 
     * @throws string 
     *
     */       

    this.pushPageLoadFunc = function(func)
    {
        if (typeof func != 'function') {
            throw 'Passed operation is not a function';
        }
        
        pageLoadFuncStack.push(func);
    }  
    
    /**
     * Method that pulls 'onPageLoad' callback function from the stack.
     *
     * Simple method that pulls 'onPageLoad' callback function from the stack.
     *
     * @access privileged
     *
     * @return object first 'onPageLoad' callback function from the stack.
     * 
     */      
    
    this.popURLChangeFunc = function()
    {
        return pageLoadFuncStack.pop();
    }  
    
    /**
     * Method that pushes viewport size object to the stack.
     *
     * Simple method that pushes viewport size object to the stack.
     *
     * @access privileged
     *
     * @param object sizeObj size object
     * 
     * @throws string 
     *
     */      
    
    this.pushViewportSize = function(sizeObj)
    {
        if (typeof sizeObj != 'object') {
            throw 'Viewport size must be passed as object';
        }
            
        viewportSizeStack.push(sizeObj);
    }
    
    /**
     * Method that pulls viewport size object from the stack.
     *
     * Simple method that pulls viewport size object from the stack.
     *
     * @access privileged
     *
     * @return object viewport size object.
     * 
     */      

    this.popViewportSize = function()
    {
        return viewportSizeStack.pop();
    }
        
    /**
     * Method that renders page (or part of the page) into the image file.
     *
     * Method accepts a bunch of optional parameters used to tune image snapshot process.
     *
     * @access privileged
     * 
     * @param string format (extension) of the file
     * @param string name of the file
     * @param string path to the image or path to the directory where image will be saved
     * @param int width of the snapshot
     * @param int height of the snapshot
     * @param int delay after which snapshot will be taken
     * 
     * @return object deferred object.
     * 
     */     
    
    this.takeSnapshot = function(format, name, path, width, height, delay)
    {        
        var imgFormat = 'png'; 
        var imgName = 'untitled';
        var dirPath = '';
        var curDelay = 0;
        
        var def = deferred.create();
        
        try {
            if (format !== undefined) {
                imgFormat = fileUtils.checkImgExt(format); 
            }
        
            if (name !== undefined) {
                imgName = fileUtils.checkImgName(name);
            }
        
            if (path !== undefined && fileUtils.isPathWritable(path)) {
                var dirPath = fileUtils.addSeparator(path)
            }
        } catch (e) {
            def.reject(e);
        }
        
        if (width !== undefined && (typeof width != 'number' || width <= 0)) {  
            def.reject('Snapshot width must be numeric and greater than zero');
        }
                 
        if (height !== undefined && (typeof height != 'number' || height <= 0)) {
            def.reject('Snapshot height must be numeric and greater than zero');
        }     
         
        if (delay !== undefined) {
            if (typeof delay != 'number' || delay < 0) {
                def.reject('Snapshot delay must be numeric and greater than zero');
            } else {
                curDelay = delay;
            }
        }
                
        var curPage = obj.getPage();
        
        if (width !== undefined && height !== undefined) {
            obj.pushViewportSize(curPage.viewportSize);       
            curPage.viewportSize = {'width': width, 'height': height};         
        }        
        
        setTimeout(function() {
            curPage.render(dirPath + imgName + '.' + imgFormat);
            
            if (width !== undefined && height !== undefined) {
                curPage.viewportSize = obj.popViewportSize();
            }
            
            def.resolve(dirPath + imgName + '.' + imgFormat);
        }, curDelay);
        
        return def;
    }
    
    /**
     * Method that generates service error object.
     *
     * Simple method that generates service error object.
     *
     * @access privileged
     * 
     * @param int code of the error
     * @param string message of the error
     *
     * @return object service erorr.
     * 
     * @throws string 
     * 
     */       
    
    this.createErrorObject = function(code, message) 
    {
        return srError.create(code, message);
    }
        
    /* Privileged core methods ends here */
    
    /* Privileged get methods starts here */
        
    /**
     * Method that returns current service name.
     *
     * Simple method that returns current service name.
     *
     * @access privileged
     * 
     * @return string service name.
     * 
     */     

    this.getServiceName = function()
    {
        return serviceName;
    }    
    
    /**
     * Method that returns current page object.
     *
     * Simple method that returns current page object.
     *
     * @access privileged
     * 
     * @return object page object.
     * 
     */      
    
    this.getPage = function()
    {
        return curPage;
    }
    
    /**
     * Method that returns current page URL.
     *
     * Simple method that returns current page URL.
     *
     * @access privileged
     * 
     * @return string page URL.
     * 
     */      
    
    this.getCurPageURL = function()
    {
        return curPageURL;
    }
        
    /* Privileged get methods ends here */
    
    /* Privileged set methods starts here */
        
    /**
     * Method that sets current service name.
     *
     * Simple method that sets current service name.
     *
     * @access privileged
     * 
     * @param string usrServiceName service name
     * 
     * @throws string 
     * 
     */       
    
    this.setServiceName = function(usrServiceName)
    {
        if (typeof usrServiceName != 'string') {
            throw 'Service name is not a string';
        }
        
        if (usrServiceName.length <= 0) {
            throw 'Service name length cannot be zero';
        }
        
        serviceName = usrServiceName;        
    }
    
    /* Privileged set methods ends here */  

    this.setServiceName(usrServiceName);
    this.configureService(configObj);
}

exports.constFunc = Service;
exports.create = function create(configObj, serviceName) {
    "use strict";
    
    return new Service(configObj, serviceName);
};