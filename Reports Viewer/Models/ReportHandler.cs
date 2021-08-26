using Microsoft.Reporting.WebForms;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Reports_Viewer.Models
{
    public class ReportHandler
    {
        public ReportViewer ReportViewer;
        ServerReport Report;
        string ReportName;

        public ReportHandler(string ReportName)
        {
            this.ReportName = ReportName;
            ReportViewer = new ReportViewer();
            Report = ReportViewer.ServerReport;
            ReportViewer.ProcessingMode = ProcessingMode.Remote;
            //ReportViewer.ServerReport.ReportServerCredentials = new ReportServerCredentials("ACaRS_Reports", "Raporty", "");
            Report.ReportServerUrl = new Uri("http://192.168.50.65/ReportServer");
            Report.ReportPath = @"/default/Main/Czas pracy/" + this.ReportName;
        }

        public List<ReportParameterInfo> GetParameters()
        {
            List<ReportParameterInfo> Parameters;
            Parameters = new List<ReportParameterInfo>(ReportViewer.ServerReport.GetParameters());
            return Parameters;
        }
    }
}