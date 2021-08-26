using Microsoft.Reporting.WebForms;
using Reports_Viewer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Report_Viewer.Controllers
{
    public class ReportingController : Controller
    {
        public string ReportName;
        public ReportHandler Handler;

        public Dictionary<string, string> ReportTranslator = new Dictionary<string, string>()
        {
            { "rzeczywisty", "Ewidencja pojazdu" },
            { "produkcja-ism-radio", "BarcodeLots" },
        };

        [AllowAnonymous]
        public ActionResult Report(string reportname)
        {
            ViewBag.Message = "";
            ViewBag.IsError = false;
            ViewBag.Horizontal = false;
            ViewBag.ReportError = false;

            if (!ReportTranslator.ContainsKey(reportname))
            {
                ViewBag.IsError = true;
                ViewBag.ErrorMessage = "Raport nie istnieje.";
                return View();
            }

            ReportName = ReportTranslator[reportname];
            Handler = new ReportHandler(ReportName);

            ViewBag.ReportName = ReportName;

            List<ReportParameterInfo> Parameters = null;
            try
            {
                Parameters = new List<ReportParameterInfo>(Handler.GetParameters());
                if (Parameters == null)
                {
                    ViewBag.IsError = true;
                    ViewBag.ErrorMessage = "Raport nie istnieje.";
                    return View();
                }
            }
            catch (Exception ex)
            {
                FileLogger.LogMessage("Report: " + ex.ToString());
                ViewBag.IsError = true;
                ViewBag.ErrorMessage = "Błąd podczas wczytywania raportu.";
                ViewBag.Message = ex.ToString();
                return View();
            }

            ViewBag.Parameters = Parameters.FindAll(o => o.Visible && o.PromptUser);
            ViewBag.Horizontal = Handler.ReportViewer.ServerReport.GetDefaultPageSettings().IsLandscape;
            if (ViewBag.Horizontal == null)
                ViewBag.Horizontal = false;
            ViewBag.Report = Handler.ReportViewer.ServerReport;
            ViewBag.ReportViewer = Handler.ReportViewer;

            return View();
        }
    }
}