using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Reports_Viewer.Models
{
    public static class TextUtilities
    {
        static List<string> msgTypes = new List<string>()
        {
            "Success", "Info", "Warning", "Error"
        };

        public static string WhitespaceToAsciiName(string Text)
        {
            if (Text == null)
                return Text;

            Dictionary<string, string> CharacterMap = new Dictionary<string, string>()
            {
                { "\r", "#CR" },
                { "\n", "#LF" },
                { "\t", "#TAB" },
                { "\0", "#NUL" },
            };
            foreach(KeyValuePair<string, string> P in CharacterMap)
            {
                Text = Text.Replace(P.Key, P.Value);
            }
            return Text;
        }

        public static string GetLogPrefix(int Code, bool ShortDateTime)
        {
            string Prefix = string.Empty;

            Prefix = DateTime.Now.ToString((!ShortDateTime ? "yyyy-MM-dd " : "") + "HH:mm" + (!ShortDateTime ? ":ss.fff" : ""))
                    + " [" + msgTypes.ElementAt(Code) + "] ";

            return Prefix;
        }
    }
}
