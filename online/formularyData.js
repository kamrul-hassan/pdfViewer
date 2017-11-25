var _scriptName = "formularyData";
var _scriptVersion = "iOS-0.1";

var sc = { "Result": "", "Parameter": "" };

//* online only -->
sc = Get("ServerCall");
var bo = Get("BusinessObject");
function _echo(v) { sc.Result += "\n"+v; }
var ass = System.Reflection.Assembly.LoadWithPartialName('Newtonsoft.Json');
var ut = ass.GetType('Newtonsoft.Json.JsonConvert');
var mths = ut.GetMethods('Static,InvokeMethod,Public');

function fromJson(s)
{
	for (var i = 0; i < mths.Length; ++i)
	{
		var m = mths[i];
		if (m.Name == 'DeserializeObject' && m.IsStatic && !m.IsGenericMethod && m.GetParameters().Length == 1)
			return m.Invoke(null, s);
	}
}

function toJson(o)
{
	for (var i = 0; i < mths.Length; ++i)
	{
		var m = mths[i];
		if (m.Name == 'SerializeObject' && m.IsStatic && !m.IsGenericMethod && m.GetParameters().Length == 1)
			return m.Invoke(null, o);
	}
}
// <-- online only */
_echo(_scriptName + "("+_scriptVersion+") initializing..."); 
// Get MI variables
var MIvars = Dendrite.Framework.EnvironmentVariables.Instance;
var token = bo.CreateParams.UserToken;
var _teamId      	= MIvars.GetValue(token, "@TEAM_ID").toString();
var _employeeId  	= MIvars.GetValue(token, "@EMPLOYEE_ID").toString();
var _alignmentId 	= MIvars.GetValue(token, "@ALIGNMENT_ID").toString();

_echo("Ready!");

var qry = "";
qry  = "SELECT ";
qry += "	d.document_id AS DOCUMENT_ID, d.ref_id AS REF_ID, d.name AS DOCUMENT_NAME, d.description AS DESCRIPTION, ";
qry += "	h.file_name AS FILE_NAME, h.attachment_type AS ATTACHMENT_TYPE, h.attachment_content AS ATTACHMENT_CONTENT ";
qry += "    FROM document d ";
qry += "	INNER JOIN  document_history h ON h.document_id = d.document_id ";
qry += "	INNER JOIN  document_distribution dd ON dd.document_id = d.document_id ";
qry += "    WHERE ";
qry += "    (dd.user_type = 'TEAM' AND dd.external_id = -222) ";
qry += "    OR	(dd.user_type = 'ALGN' AND dd.external_id = -333) ";
qry += "    OR	(dd.user_type = 'EMPL' AND dd.external_id = -444) ";

qry = qry.replace(/-222/g, _teamId);
qry = qry.replace(/-333/g, _alignmentId);
qry = qry.replace(/-444/g, _employeeId);

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