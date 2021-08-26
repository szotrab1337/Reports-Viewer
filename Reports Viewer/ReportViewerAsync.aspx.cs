using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Microsoft.Reporting;
using Microsoft.Reporting.WebForms;
using Microsoft.ReportingServices;
using Reports_Viewer.Models;
using System.IO;

namespace PWT_MES_Interface
{
    public partial class ReportViewerAsync : System.Web.UI.Page
    {
        public bool ConnectionError = false, ParametersError = false;
        public string Message = "";
        public ReportViewer ReportViewer;
        public int CurrentPage;
        public int PageCount;

        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                // Debug actions

                foreach (string Key in Request.QueryString.AllKeys)
                {
                    Message += Key + ": '" + Request.QueryString[Key] + "'<br />\r\n";
                }

                // Report processing
                ReportViewer = ReportViewerControl;
                ServerReport Report = ReportViewer.ServerReport;

                if (Request.QueryString["reportname"] == null)
                    return;

                string ReportName = Request.QueryString["reportname"];

                // Namespace diagnostics
                try
                {
                    ReportViewer.ServerReport.ReportServerUrl = new Uri("http://192.168.50.65/ReportServer");
                }
                catch (Exception ex)
                {
                    ConnectionError = true;
                    return;
                }

                ReportViewer.ProcessingMode = ProcessingMode.Remote;
                ReportViewer.PageCountMode = PageCountMode.Actual;
                //Report.ReportServerCredentials = new ReportServerCredentials("ACaRS_Reports", "Raporty", "");
                Report.ReportPath = @"/default/Main/Czas Pracy/" + ReportName;

                // Connection diagnostics
                try
                {
                    Report.GetServerVersion();
                }
                catch (Exception ex)
                {
                    ConnectionError = true;
                    return;
                }

                // Parameters to set
                List<ReportParameter> ReportParameters = new List<ReportParameter>();
                string Value;
                string[] Values;
                string Messages = "";
                foreach (string Key in Request.QueryString.AllKeys)
                {
                    Messages += Key + ": " + Request.QueryString[Key] + "<br />";
                }
                foreach (ReportParameterInfo P in Report.GetParameters())
                {
                    Messages += P.Name.ToLower();
                    if (Request.QueryString[P.Name.ToLower()] != null)
                    {
                        Messages += ": " + Request.QueryString[P.Name.ToLower()] + "<br />";
                        if (P.MultiValue)
                        {
                            Values = Request.QueryString[P.Name.ToLower()].Split(',');
                            ReportParameters.Add(new ReportParameter(P.Name, Values));
                        }
                        else
                        {
                            Value = Request.QueryString[P.Name.ToLower()];
                            ReportParameters.Add(new ReportParameter(P.Name, Value));
                        }
                    }
                }
                //Response.Write(Messages);
                try
                {
                    Report.SetParameters(ReportParameters);
                }
                catch (Exception ex)
                {
                    ParametersError = true;
                    Message = ex.ToString();
                    return;
                }

                if (Request.QueryString["page"] != null)
                {
                    int RequestedPage;
                    if (int.TryParse(Request.QueryString["page"], out RequestedPage))
                    {
                        ReportViewer.CurrentPage = RequestedPage;
                    }
                }

                try
                {
                    if (Request.QueryString["export"] != null && Request.QueryString["export"] == "1")
                        ReportExport(Report, Request.QueryString["format"], ReportName);
                }
                catch (Exception ex)
                {
                    ConnectionError = true;
                    return;
                }

                //Report.Render("HTML 4.0", null);

                CurrentPage = ReportViewer.CurrentPage;
                PageCount = Report.GetTotalPages();

                ReportViewer.AsyncRendering = false;
                ReportViewer.SizeToReportContent = true;
                ReportViewer.Width = Unit.Percentage(100);
                ReportViewer.Height = Unit.Percentage(100);
                ReportViewer.ShowToolBar = false;
                ReportViewer.ShowParameterPrompts = false;

            }
            catch(Exception ex)
            {
                ConnectionError = true;
            }

        }

        void ReportExport(ServerReport Report, string Format, string ReportName)
        {
            List<string> AvailableFormats = new List<string>()
            {
                "XML", "CSV", "IMAGE", "PDF", "EXCEL", "WORD", "HTML 4.0", "MHTML", "NULL"
            };

            Format = Format.ToUpper();

            if (!AvailableFormats.Contains(Format))
                return;

            Dictionary<string, string> Extensions = new Dictionary<string, string>()
            {
                { "XML", "xml" }, { "CSV", "csv" }, { "IMAGE", "tiff" },
                { "PDF", "pdf" }, { "EXCEL", "xls" }, { "WORD", "doc" },
                { "HTML 4.0", "html" }, { "MHTML", "html" }, { "NULL", "txt" }
            };

            Stream Output;
            Int16 bufferSize = 1024;
            byte[] buffer = new byte[bufferSize + 1];
            string MimeType, Encoding;

            Output = Report.Render(Format, null, null, out MimeType, out Encoding);

            Response.ContentType = MimeType;
            Response.AddHeader("Content-Disposition",
                string.Format("attachment; filename=\"Raport_{0}.{1}\";", ReportName, Extensions[Format]));
            Response.BufferOutput = false;

            int count = Output.Read(buffer, 0, bufferSize);

            while (count > 0)
            {
                Response.OutputStream.Write(buffer, 0, count);
                count = Output.Read(buffer, 0, bufferSize);
            }
        }
    }
}
