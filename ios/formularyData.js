var _scriptName = "formularyData";
var _scriptVersion = "iOS-0.1";
try {
    var sc = { "Result": "", "Parameter": "" };

    //* offline only -->
    function _escape(s) { return s.replace(/'/g, '\\x27'); }
    function _echo(v) { helper.Control.WebView.EvaluateJavascript('_echo("' + v + '")'); }
    function fromJson(s) { return Newtonsoft.Json.JsonConvert.DeserializeObject(s); } // JSON string to object (parse)
    function toJson(o) { return Newtonsoft.Json.JsonConvert.SerializeObject(o); } // object to JSON string (stringify)
    
    sc.Parameter = helper.Control.WebView.EvaluateJavascript("getOfflineParameter('" + _scriptName + "')");
    var bo = helper.BusinessObject;
    // <-- */

    // Get MI variables
    var MIvars = Dendrite.Framework.EnvironmentVariables.Instance;
    var token = bo.CreateParams.UserToken;
    var _teamId = MIvars.GetValue(token, "@TEAM_ID").toString();
    var _employeeId = MIvars.GetValue(token, "@EMPLOYEE_ID").toString();
    var _alignmentId = MIvars.GetValue(token, "@ALIGNMENT_ID").toString();

    _echo("Ready!");

    var qry = "";
    qry = "SELECT ";
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

    var result = helper.JsonSerializeTable(tabDocs);

    _echo(result);
    _echo("Completed, executing callback function");
    sc.Result = result;
    //* offline only -->
    helper.Control.WebView.EvaluateJavascript("performOfflineScriptCallback('" + _scriptName + "', '" + _escape(sc.Result) + "')");
}
catch (e) { helper.Control.WebView.EvaluateJavascript("alert('" + e.message + "')"); }
