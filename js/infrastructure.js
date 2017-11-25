var callbackRegister = new Array();
var parametersRegister = new Array();

function executeScript(scriptFileName, scriptCallback, args) 
{
    var scriptCallbackWithJsonParam = createScriptCallBackWithJsonParam(scriptCallback);

    if (isTouchOffline())
        runOfflineScript(scriptFileName, args, scriptCallbackWithJsonParam);
    else if (isTouchOnline())
        parent.runHostScript(scriptFileName, args, scriptCallbackWithJsonParam, document.location.pathname);
    else
        getDesignTimeData(scriptFileName, scriptCallbackWithJsonParam);
}

function createScriptCallBackWithJsonParam(originalScriptCallback)
{
    if (originalScriptCallback == null)
        return null;

    return function (jsonResult)
    {
        try{
            if (typeof jsonResult == "string")
                jsonResult = JSON.parse(jsonResult);
        }
        catch(e){}

        originalScriptCallback(jsonResult);
    }
}

function runOfflineScript(scriptFileName, args, callback) {
    callbackRegister[scriptFileName] = callback;
    parametersRegister[scriptFileName] = args;

    var location = "runscript://ios/" + scriptFileName + ".js";
    window.location = location;
}

function performOfflineScriptCallback(scriptFileName, result) {
    if (callbackRegister[scriptFileName] != null)
        callbackRegister[scriptFileName](result);
}

function getOfflineParameter(scriptFileName) {
    if (parametersRegister[scriptFileName] != null)
        return parametersRegister[scriptFileName];
}

function getDesignTimeData(scriptFileName, scriptCallback)
{
    $.getJSON("designTimeData/" + scriptFileName + ".json", function (json) {
        if (scriptCallback != null){
            if (scriptCallback != null)
			try{
            if (typeof json == "string")
                json = JSON.parse(json);
        }
        catch(e){}
        scriptCallback(json);
        //setTimeout(scriptCallback, json.postponeTime != null ? json.postponeTime : 0, json);
    }            
    });
}

function isTouchOffline()
{
    return window.location.protocol == "file:";
}

function isTouchOnline() {
    return !isInDesignMode() && window.location.protocol != "file:";
}

function isInDesignMode()
{
    var isInIframe = window.frameElement && window.frameElement.nodeName == "IFRAME";
    return !isInIframe && window.location.protocol != "file:";
}