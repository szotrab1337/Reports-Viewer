using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Threading.Tasks;
using System.Web;

namespace Reports_Viewer.Models
{
    static public class FileLogger
    {
        static public string LogMessage(string Message, int type = 1)
        {
            string output = "";

            try
            {
                StreamWriter sw = null;

                List<string> msgTypes = new List<string>()
                {
                    "Success", "Info", "Warning", "Error"
                };
                if (type < 0 || type >= msgTypes.Count)
                {
                    type = 1;
                }
            
                string sLogFormat = TextUtilities.GetLogPrefix(type, false);
                string sPathName = HttpRuntime.AppDomainAppPath + @"Logs\";
                string sFilename = "ACaRS_WebInterface_";

                string sYear = DateTime.Now.Year.ToString();
                string sMonth = DateTime.Now.Month.ToString();
                string sDay = DateTime.Now.Day.ToString();
                string sHour = DateTime.Now.Hour.ToString();
                string sMinute = DateTime.Now.Minute.ToString();

                string sErrorDate = DateTime.Now.ToString("yyyy-MM-dd");
                string sErrorTime = DateTime.Now.ToString("HH:mm");
                string sMsgType = "[" + msgTypes.ElementAt(type) + "]";

                string FullPath = sPathName + sFilename + sErrorDate + ".txt";

                if (!Directory.Exists(sPathName))
                    Directory.CreateDirectory(sPathName);

                sw = new StreamWriter(FullPath, true);

                sw.WriteLine(sLogFormat + Message);
                sw.Flush();

                output = sLogFormat + Message;
                Console.WriteLine(output);

                if (sw != null)
                {
                    sw.Dispose();
                    sw.Close();
                }
            }
            catch(Exception ex)
            {

            }

            return output;
        }
    }
}
