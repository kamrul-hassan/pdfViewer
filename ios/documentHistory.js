var _scriptName = "documentHistory";
var _scriptVersion = "iOS-0.1";
try {
    var sc = { "Result": "", "Parameter": "" };

    //* offline only -->
    function _escape(s) { return s.replace(/'/g, '\\x27'); }
    function _echo(v) { helper.Control.WebView.EvaluateJavascript('_echo("' + v + '")'); }  
    sc.Parameter = helper.Control.WebView.EvaluateJavascript("getOfflineParameter('" + _scriptName + "')");
    var bo = helper.BusinessObject;
    // <-- */

	var params = sc.Parameter.split('|') || [];
	var documentId = 0;
	if(params[0]){
		documentId = params[0];
	}
    
    _echo("documentId", documentId);

    var qry = "";
	qry = "SELECT ";
	qry += "	h.document_id AS DOCUMENT_ID,  h.file_name AS FILE_NAME, h.attachment_type AS ATTACHMENT_TYPE,  ";
	qry += "	h.attachment_content AS ATTACHMENT_CONTENT ";
	qry += "    FROM document_history h ";   
	qry += "    WHERE h.document_id = -222";
	qry = qry.replace(/-222/g, documentId);

   _echo("Query:" + qry);
    
    var req = RequestFactory.CreateDataRequest("Search", bo.CreateParams.UserToken, "vt_query");
    req.CreateParams.Add("query_sql", qry.toString());
    var resp = DataRequest.Execute(req);
    
    var tabDocs = resp.Data.Tables["vt_query"];

    _echo("Got Documents");

    var result = helper.JsonSerializeTable(tabDocs);

    _echo(result);
    _echo("Completed, executing callback function");
    sc.Result = result;
    //* offline only -->
    helper.Control.WebView.EvaluateJavascript("performOfflineScriptCallback('" + _scriptName + "', '" + _escape(sc.Result) + "')");
}
catch (e) { helper.Control.WebView.EvaluateJavascript("alert('" + e.message + "')"); }
