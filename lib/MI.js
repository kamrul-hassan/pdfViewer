//==============================================================================
// MI.js
// version: 1.01
// purpose: Data exchange between MI and HTML app
//
// /!\ Common HTML5 script, do not modify
//------------------------------------------------------------------------------

// GLOBALS
////////////////////////////////////////////////////////////////////////////////

// Local dev flag
//..............................................................................
var _is_dev_mode =
	(
		(typeof parent.runHostScript === "undefined")
	&&  (window.location.hostname === "localhost")	// all offline devices - from MI11SU5 and local servers
	)  ? true : false;

// online/offline flag
//..............................................................................
var _is_offline =
	(
		(window.location.protocol === "file:")		// iPad only - up to MI11SU4
	||  (window.location.hostname === "localhost")	// all offline devices - from MI11SU5
	) ? true : false;

//..............................................................................
var callbackRegister = new Array();
var parametersRegister = new Array();

// Convert a JSON string to an Object
////////////////////////////////////////////////////////////////////////////////
function fromJson(s) { return (_is_offline === true) ? eval('(' + s + ')') : JSON.parse(s); } // TODO: check that JSON.parse() works on iPad

// Convert an Object to a JSON string
////////////////////////////////////////////////////////////////////////////////
function toJson(o) { return JSON.stringify(o); }

// Debug output
////////////////////////////////////////////////////////////////////////////////
function _echo(msg)
{
	if (!msg) msg = '! empty message !';
	var p = $('<p class="debug">').text(msg);
	$('#debug').append(p);
}

////////////////////////////////////////////////////////////////////////////////
function registerFunction(functionKey, callback)
{
	try { window.parent[functionKey] = callback; }
    catch(error) { alert("In registerFunction" + error.message); }
}

// Run a JS script in MI context
////////////////////////////////////////////////////////////////////////////////
function executeScript(scriptFileName, args, callback)
{
//	try
//	{
		if ((_is_dev_mode === true) && (typeof callback === 'function'))
		{
			_echo("function 'parent.runHostScript' not found, assuming DEV mode on local http server");
			return callback();
		}

		if ((_is_offline === true) && (navigator.platform === 'iPad'))
			runOfflineScript(scriptFileName, args, callback);
		else
			parent.runHostScript(scriptFileName, args, callback, document.location.pathname);
//	}
	// catch(e)
	// {
		// alert('exception in ExecuteScript('+scriptFileName+'): ' + e.message);
		// console.log('exception in ExecuteScript('+scriptFileName+'): ' + e.message);
	// }
}

////////////////////////////////////////////////////////////////////////////////
function runOfflineScript(scriptFileName, args, callback) 
{
	callbackRegister[scriptFileName] = callback;
	parametersRegister[scriptFileName] = args;

	var location = "runscript://ios/" + scriptFileName + ".js";
	window.location = location;
}

////////////////////////////////////////////////////////////////////////////////
function performOfflineScriptCallback(scriptFileName, result)
{
	if (callbackRegister[scriptFileName] != null && callbackRegister[scriptFileName] != undefined)
		callbackRegister[scriptFileName](result);
}

////////////////////////////////////////////////////////////////////////////////
function getOfflineParameter(scriptFileName)
{
	if (parametersRegister[scriptFileName] != null && parametersRegister[scriptFileName] != undefined)
		return parametersRegister[scriptFileName];
}

///////////////////////////////////////////////////////////////////////////////
function maximizeWidth()
{
	var w = window.parent;

	var level = 0;
	while (w && (level<3))
	{
	// Replace the 95% with 100% so we can use the whole popup space available
		var e = w.document.getElementById('HTMLCallbackEventHandler');
		if (e) e.style.width = "100%";

		var e = w.document.getElementById('htmlwrapper');
		if (e) e.style.width = "100%";
		
		var e = w.document.getElementById('detailContent');
		if (e) e.style = "overflow: hidden; padding: 0px; margin: 0px";

		var e = w.document.getElementById('detail');
		if (e) e.style = "padding-left: 0px; padding-right: 2px;"; //top: 7px;";
		
		w = w.parent;
		level ++;
	}
}

//==============================================================================
// EOS