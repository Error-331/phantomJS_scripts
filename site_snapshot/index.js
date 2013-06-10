var page = require('webpage');
var system = require('system');

var curPage = null;

var url = null;
var imgFormat = 'png';
var imgName = 'untitled';

function filterImgFormat(imgFormat)
{
    if (typeof imgFormat != 'string') {
        console.log('Image format is not a string');
        phantom.exit();
    }
    
    if (imgFormat.length == 0) {
        console.log('File format length is zero');
        phantom.exit();        
    }
    
    imgFormat = imgFormat.toLowerCase();
    
    switch(imgFormat) {
        case 'png':
        case 'jpeg':
        case 'gif':
        case 'pdf':
            return imgFormat;
            break;
        default:
            console.log('Unrecognised file format: "' + imgFormat + '"');
            phantom.exit();
            break;
    }
}

function filterImgName(imgName)
{
    if (typeof imgName != 'string') {
        console.log('Image name is not a string');
        phantom.exit();
    }   
    
    if (imgName.length == 0) {
        console.log('Image name length is zero');
        phantom.exit();        
    }
    
    return imgName;
}

if (system.args.length < 2) {
    console.log('Usage: site_url [png|jpeg|gif|pdf] [snapshot_image_name]');
    phantom.exit();   
} else if (system.args.length == 2) {
    url = system.args[1];   
} else if (system.args.length == 3) {
    url = system.args[1];
    imgFormat = filterImgFormat(system.args[2]);  
} else if (system.args.length >= 4) {
    url = system.args[1];
    imgFormat = filterImgFormat(system.args[2]);  
    imgName = filterImgName(system.args[3]);
}

curPage = page.create();
curPage.open(url, function () {
    curPage.render(imgName + '.' + imgFormat);
    phantom.exit();
});