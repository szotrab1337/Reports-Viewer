using Microsoft.Reporting.WebForms;
using Newtonsoft.Json;
using Reports_Viewer.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;

namespace Report_Viewer.Controllers
{
    [AllowAnonymous]
    public class RestController : Controller
    {
        public string Output;

        //private SqlConnection connection;
        //private Context Context = new Context();

        public ActionResult Json()
        {
            string ResponseJson = "";
            string Action = Request.QueryString["a"];

            try
            {
                switch (Action)
                {
                    case "ReportParameters":
                        ResponseJson = GetReportParameters();
                        break;
                    default:
                        break;
                }
            }
            catch (Exception ex)
            {
                Response.Write(ex.ToString());
            }

            Response.Write(ResponseJson);

            return View();
        }

        private string GetReportParameters()
        {
            string Output = "";
            string Message = "";
            List<string> Messages = new List<string>();

            if (Request.Params["reportname"] == null || Request.Params["parametername"] == null)
            {
                Output = "ReportName or ParameterName is not provided.";
                return Output;
            }

            try
            {
                string ReportName = Request.Params["reportname"];
                string ParamName = Request.Params["parametername"];

                Messages.Add("ReportName: " + ReportName + ".");
                Messages.Add("ParamName: " + ParamName + ".");

                foreach (string Key in Request.Params.AllKeys)
                {
                    //Messages.Add("Key" + ": '" + Request.Params[Key] + "'<br />\r\n");
                }

                // Report processing
                ServerReport Report = new ServerReport();

                // Namespace diagnostics
                try
                {
                    Report.ReportServerUrl = new Uri(WebConfigurationManager.AppSettings["Reports_Url"]);
                }
                catch (Exception ex)
                {
                    return "ServerUrl: " + ex.ToString();
                }

                Report.ReportServerCredentials = new ReportServerCredentials(
                    WebConfigurationManager.AppSettings["Reports_Username"],
                    WebConfigurationManager.AppSettings["Reports_Password"],
                    "acarsad"
                );
                Report.ReportPath = "/" + WebConfigurationManager.AppSettings["Reports_Folder"] + "/" + ReportName;

                // Connection diagnostics
                try
                {
                    Report.GetServerVersion();
                }
                catch (Exception ex)
                {
                    return "ServerVersion: " + ex.ToString();
                }

                // Parameters to set
                string Value;
                string[] Values;

                ReportParameter CurrentParameter;
                ReportParameterInfo ChangedParameter;
                ReportParameterInfoCollection ReportParameters;
                List<ReportParameterInfo> ParametersToRefresh;
                ReportParameters = Report.GetParameters();
                Dictionary<string, string> ValidValues = new Dictionary<string, string>();

                // Specified parameter is not present in the report.
                if (ReportParameters.Count(o => o.Name.ToLower() == ParamName) != 1)
                {
                    Messages.Add("There is no such parameter in the report: " + ParamName + ".");
                    return JsonConvert.SerializeObject(Messages);
                    Output = "There is no such parameter in the report: " + ParamName + ".";
                    return Output;
                }

                ChangedParameter = ReportParameters.First(o => o.Name.ToLower() == ParamName);
                Messages.Add("Changed parameter is: " + ChangedParameter.Name);
                // Parameters to refresh are dependants parameters, distincted.
                ParametersToRefresh = GetDependents(ChangedParameter);
                ParametersToRefresh = ParametersToRefresh.Distinct().ToList();
                string TextValues = Request.Params[ChangedParameter.Name.ToLower()];
                if (TextValues == null)
                    TextValues = Request.Params[ChangedParameter.Name.ToLower() + "[]"];
                Values = TextValues.Split(',');
                //CurrentParameter = new ReportParameter(ChangedParameter.Name, Values);
                //Report.SetParameters(CurrentParameter);

                // Set the values for report parameters that are not meant to be refreshed
                Messages.Add("All report parameters are:");
                foreach (ReportParameterInfo RPI in ReportParameters)
                {
                    Messages.Add("- " + RPI.Name);
                }

                // Displays parameter dependants.
                Messages.Add("Parameters to refresh are:");
                foreach (ReportParameterInfo RPI in ParametersToRefresh)
                {
                    Messages.Add("- " + RPI.Name);
                }

                List<ReportParameter> ParametersToApply = new List<ReportParameter>();

                // Set the values for the parameters in the report. Only fill the parameters that conform to their rules, ex. cannot be null or single value only...
                ValidValues.Clear();
                Messages.Add("Refreshing parameters...");
                foreach (ReportParameterInfo P in ReportParameters)
                {
                    Messages.Add("- " + P.Name);
                    if (Request.Params[P.Name.ToLower()] != null && Request.Params[P.Name.ToLower()] != string.Empty)
                    {
                        Messages.Add("-- supplied with value '" + Request.Params[P.Name.ToLower()] + "'");
                        if (P.MultiValue)
                        {
                            ValidValues.Clear();
                            Values = Request.Params[P.Name.ToLower()].Split(',');
                            foreach (ValidValue V in P.ValidValues)
                            {
                                ValidValues.Add(V.Value, V.Label);
                            }
                            List<string> ValuesNotPresent = Values.ToList().Except(ValidValues.Keys).ToList();
                            CurrentParameter = new ReportParameter(P.Name, Values.ToList().Except(ValuesNotPresent).ToArray());
                        }
                        else
                        {
                            Value = Request.Params[P.Name.ToLower()];
                            CurrentParameter = new ReportParameter(P.Name, Value);
                        }
                        if (CurrentParameter.Values != null)
                        {
                            ParametersToApply.Add(CurrentParameter);

                            string[] StringValues = new string[CurrentParameter.Values.Count];
                            CurrentParameter.Values.CopyTo(StringValues, 0);
                            Messages.Add("-- param added: " + CurrentParameter.Name + " => (" + string.Join(", ", StringValues) + ")");
                        }
                    }
                }

                Messages.Add("Setting the parameters.");
                Report.SetParameters(ParametersToApply);
                Messages.Add("Getting the parameters.");
                Report.GetParameters();

                Messages.Add("Now, the valid values are:");
                foreach (KeyValuePair<string, Dictionary<string, string>> V in GetParametersValidValues(Report))
                {
                    Messages.Add("--- " + V.Key + ": [" + string.Join(", ", V.Value.Keys) + "] => (" + string.Join(", ", V.Value.Values) + ").");
                }

                // Get report's current values and available values that can be selected and combine them into the object for JSON serialization.
                try
                {
                    Output = JsonConvert.SerializeObject(new List<object>() { GetParametersCurrentValues(Report), GetParametersValidValues(Report), Messages });
                }
                catch (Exception ex)
                {
                    return "SetParameters: " + ex.ToString();
                }

            }
            catch (Exception ex)
            {
                Output = "General: " + ex.ToString();
            }
            return Output;
        }

        private Dictionary<string, List<string>> GetParametersCurrentValues(Report Report)
        {
            ReportParameterInfoCollection ReportParameters;
            Dictionary<string, List<string>> CurrentValues = new Dictionary<string, List<string>>();

            ReportParameters = Report.GetParameters();

            foreach (ReportParameterInfo RPI in ReportParameters)
            {
                CurrentValues.Add(RPI.Name.ToLower(), new List<string>(RPI.Values));
            }

            return CurrentValues;
        }

        private Dictionary<string, Dictionary<string, string>> GetParametersValidValues(Report Report)
        {
            ReportParameterInfoCollection ReportParameters;
            Dictionary<string, Dictionary<string, string>> ParamValidValues = new Dictionary<string, Dictionary<string, string>>();

            ReportParameters = Report.GetParameters();

            Dictionary<string, string> ValidValues = new Dictionary<string, string>();
            foreach (ReportParameterInfo RPI in ReportParameters)
            {
                ValidValues.Clear();
                if (RPI.ValidValues != null)
                {
                    foreach (ValidValue V in RPI.ValidValues)
                    {
                        ValidValues.Add(V.Value, V.Label);
                    }
                }
                ParamValidValues.Add(RPI.Name.ToLower(), new Dictionary<string, string>(ValidValues));
            }

            return ParamValidValues;
        }

        private List<ReportParameterInfo> GetDependents(ReportParameterInfo Parent)
        {
            List<ReportParameterInfo> DependentsList = new List<ReportParameterInfo>();

            if (Parent.Dependents.Count > 0)
            {
                foreach (ReportParameterInfo RPI in Parent.Dependents)
                {
                    DependentsList.Add(RPI);
                    DependentsList.AddRange(GetDependents(RPI));
                }
            }

            return DependentsList;
        }
    }
}