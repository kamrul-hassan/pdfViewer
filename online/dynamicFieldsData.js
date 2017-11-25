var _scriptName = "documentHistory";
var _scriptVersion = "iOS-0.1";

var sc = { "Result": "", "Parameter": "" };

//* online only -->
sc = Get("ServerCall");
var bo = Get("BusinessObject");
function _echo(v) { sc.Result += "\n"+v; }
// <-- online only */
_echo(_scriptName + "("+_scriptVersion+") initializing..."); 

// - Parameters are sent as values separated by pipes
var params = sc.Parameter.split('|') || [];
var documentId = 0;
if(params[0]){
	documentId = params[0];
}
_echo("documentId", documentId);

var qry = "";
qry = "SELECT ";
qry += "	FIELD_LABEL, FIELD_NAME, FIELD_INIT, DATA_TYPE,  ";
qry += "	IS_VISIBLE, IS_MANDATORY, SORT_ORDER, LEFT, TOP, LENGTH, WIDTH, PAGE_NUMBER ";
qry += "    FROM document_history h ";   
qry += "    WHERE h.document_id = -222";
qry = qry.replace(/-222/g, documentId);

_echo("Query:" + qry);

var req = RequestFactory.CreateDataRequest("Search", bo.CreateParams.UserToken, "vt_query");
req.CreateParams.Add("query_sql", qry.toString());
var resp = DataRequest.Execute(req);

var tabDocs = resp.Data.Tables["vt_query"];

_echo("Got Documents");
var result = JsonSerializeTable(tabDocs);
_echo(result);
_echo("Completed, executing callback function");
sc.Result = result;