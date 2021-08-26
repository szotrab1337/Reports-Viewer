using System.Web;
using System.Web.Optimization;

namespace Report_Viewer
{
    public class BundleConfig
    {
        // Aby uzyskać więcej informacji o grupowaniu, odwiedź stronę https://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            //bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
            //            "~/Scripts/jquery-{version}.js"));

            //bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
            //            "~/Scripts/jquery.validate*"));

            //// Użyj wersji deweloperskiej biblioteki Modernizr do nauki i opracowywania rozwiązań. Następnie, kiedy wszystko będzie
            //// gotowe do produkcji, użyj narzędzia do kompilowania ze strony https://modernizr.com, aby wybrać wyłącznie potrzebne testy.
            //bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
            //            "~/Scripts/modernizr-*"));

            //bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
            //          "~/Scripts/bootstrap.js"));

            //bundles.Add(new StyleBundle("~/Content/css").Include(
            //          "~/Content/bootstrap.css",
            //          "~/Content/site.css"));

            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/vendor/jquery-2.1.4.min.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            // Użyj wersji deweloperskiej biblioteki Modernizr do nauki i opracowywania rozwiązań. Następnie, kiedy wszystko będzie
            // ready for production, use the build tool at https://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap.min.js",
                "~/Scripts/respond.js"));

            //bundles.Add(new ScriptBundle("~/bundles/acars").Include(
            //    "~/Scripts/ACaRS.js"));

            bundles.Add(new ScriptBundle("~/bundles/sufee").Include(
                "~/Scripts/plugins.js",
                "~/Scripts/main.js",
                "~/Scripts/lib/chosen/chosen.jquery.min.js"
                      ));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/Content/acars.css",
                "~/Content/normalize.css",
                "~/Content/bootstrap.css",
                "~/Content/font-awesome.min.css",
                "~/Content/themify-icons.css",
                "~/Content/flag-icon.min.css",
                "~/Content/cs-skin-elastic.css",
                "~/Content/lib/chosen/chosen.min.css",
                "~/Content/scss/style.css"));
        }
    }
}
