<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ReportViewerAsync.aspx.cs" Inherits="PWT_MES_Interface.ReportViewerAsync" %>
<%@ Register Assembly="Microsoft.ReportViewer.WebForms, Version=11.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91" Namespace="Microsoft.Reporting.WebForms" TagPrefix="rsweb" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title></title>
</head>
<body style="margin: 0;">
    <form runat="server">
        <asp:ScriptManager ID="ScriptManagerControl" runat="server">
            <Scripts>
            </Scripts>
        </asp:ScriptManager>
        <% if (ConnectionError)
            { %>
        <div>
            <span>Wystąpił problem z połączeniem do serwera raportów. Proszę sprawdzić czy jest on włączony i jest podłączony do sieci.</span>
            <%--<span><% Response.Write(Message); %></span>--%>
        </div>
        <% } else if(ParametersError)
            {
        %>
            <span>Wystąpił problem z parametryzacją raportu. Proszę sprawdzić czy wszystkie parametry mają poprawne wartości.</span>
            <%--<span><% Response.Write(Message); %></span>--%>
        <%
            }
            else
            {
                CurrentPage = ReportViewer.CurrentPage;
                PageCount = ReportViewer.ServerReport.GetTotalPages();
        %>
        <div style="display:none;" id="ReportInfo" data-pagecount="<% Response.Write(PageCount); %>" data-currentpage="<% Response.Write(CurrentPage); %>"></div>
        <rsweb:ReportViewer ID="ReportViewerControl" runat="server"></rsweb:ReportViewer>
        <% } %>
    </form>
</body>
</html>
