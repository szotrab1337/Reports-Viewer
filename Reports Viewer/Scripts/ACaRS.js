var ACaRS = {};
var Log = function () { };
var GetTimeString = function () { };

jQuery(function ($) {
    var lastHeight = 0, curHeight = 0, $frame = $('iframe#Report');
    setInterval(function () {
        curHeight = $frame.contents().find('html').outerHeight();
        if (curHeight != lastHeight && curHeight > 20) {
            $frame.animate({ 'height': (lastHeight = curHeight + 50) + 'px' }, 600);
        }
    }, 1000);

    /* DateTime Picker Auto Hide Workaround */
    // Tempus Dominus date picker load remove class
    $('*[data-toggle="datetimepicker"]').removeClass('datetimepicker-input');

    $(".datetimepicker").datetimepicker({ locale: 'pl' });

    /*
    $(".datetimepicker").datetimepicker({
        i18n: {
            pl: {
                months: [
                    'Styczeń', 'Luty', 'Marzec', 'Kwiecień',
                    'Maj', 'Czerwiec', 'Lipiec', 'Sierpień',
                    'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
                ],
                dayOfWeek: [
                    "Nd", "Pn", "Wt", "Śr",
                    "Czw", "Pt", "Sob",
                ]
            }
        },
        value: new Date($(this).attr("value")),
        timepicker: true,
        format: 'Y-m-d H:i:00'
    });
    */
    /*
    $(".timepicker input").datetimepicker({
        onGenerate: function (ct) {
            ACaRS.Log("This is: " + $(this).prop("tagName") + ", class: " + $(this).attr("class") + ", id: " + $(this).attr("id") + ".");
            ACaRS.Log("Date value: " + $(this).attr("value"));
            ACaRS.Log("ct: " + JSON.stringify(ct));
        },
        value: new Date('2000-01-01 ' + $(this).parent().attr("value")),
        datepicker: false,
        timepicker: true,
        minTime: '00:00',
        maxTime: '08:00',
        step: 5,
        format: 'H:i'
    });
    $(".timepicker .input-group-addon").click(function () {
        $(this).parent().find("input").datetimepicker('toggle');
    });
    */
    
    var ReportUrl = "/ReportViewerAsync.aspx";
    var $Report = $("#Report");

    SetExportLinks();

    $("#ReportForm input, #ReportForm select, #ReportForm textarea").change(function () {
        //alert("Report Form changed on " + $(this).attr("name") + " with ID: " + this.id + " and value: " + $(this).val() + ".");
        $(this).off("change");
        SetExportLinks();
        ReattachChangeEvent($(this));
    });

    function ReattachChangeEvent($Node) {
        setTimeout(function () {
            $Node.change(function () {
                //alert("Report Form changed on " + $(this).attr("name") + " with ID: " + this.id + " and value: " + $(this).val() + ".");
                $(this).off("change");
                SetExportLinks();
                ReattachChangeEvent($(this));
            });
        }, 200);
    }

    $("#ReportReload").click(function () {

    });

    var $Iframe = $("#Report");
    $Iframe.onbeforeunload = function () {
        $("#ReportLoader").fadeIn(200);
    };

    $("#Report").load(function () {
        $("#ReportLoader").fadeOut(500);
        $Info = $("#Report").contents().find("#ReportInfo");
        var CurrentPage = $Info.data("currentpage");
        var PageCount = $Info.data("pagecount");
        //alert("Current: " + CurrentPage + ", Total: " + PageCount + ".");
        $("#PageCount").text(PageCount);
        $("#CurrentPage").val(CurrentPage);
        $ReportPageFirst = $("#ReportPageFirst");
        $ReportPagePrevious = $("#ReportPagePrevious");
        $ReportPageNext = $("#ReportPageNext");
        $ReportPageLast = $("#ReportPageLast");
        if (CurrentPage == 1) {
            if (!$ReportPageFirst.hasClass("disabled"))
                $ReportPageFirst.addClass("disabled");
            if (!$ReportPagePrevious.hasClass("disabled"))
                $ReportPagePrevious.addClass("disabled");
            $ReportPageFirst.attr("href", "");
        }
        else {
            if ($ReportPageFirst.hasClass("disabled"))
                $ReportPageFirst.removeClass("disabled");
            if ($ReportPagePrevious.hasClass("disabled"))
                $ReportPagePrevious.removeClass("disabled");
        }
        if (CurrentPage == PageCount) {
            if (!$ReportPageNext.hasClass("disabled"))
                $ReportPageNext.addClass("disabled");
            if (!$ReportPageLast.hasClass("disabled"))
                $ReportPageLast.addClass("disabled");
        }
        else {
            if ($ReportPageNext.hasClass("disabled"))
                $ReportPageNext.removeClass("disabled");
            if ($ReportPageLast.hasClass("disabled"))
                $ReportPageLast.removeClass("disabled");
        }
    });

    function FieldOnChange($Field) {
        if ($Field.attr("data-changed") == "1" || $Field.attr("data-prevvalue") == $Field.val()) {
        }
        else {
            $Field.attr("data-changed", "1");
            //$(".col-lg-9 .card-body").prepend("<div><strong>Change</strong> of the \"" + $Field.attr("name") + "\" element.</div>");
            $("#ReportParameters").attr("data-last-change", $Field.attr("name"));
        }
        $Field.attr("data-prevvalue", $Field.val());
        setTimeout(function () {
            $Field.change(function () {
                FieldOnChange($Field);
            });
        }, 200);
    }

    $(".report-parameter[data-dependencies!='']").each(function () {
        var $Field = $(this);
        var $Focused;
        if ($Field.prop("tagName") == "SELECT") {
            $Field.on("chosen:showing_dropdown", function () {
                DependentFieldEnter($Field);
            });
        }
        else {
            $Field.focusin(function () {
                DependentFieldEnter($Field);
            });
        }
    });

    $("#ReportReload, #ReportExport").click(function (event) {
        Log("Click happened on " + $(this).attr("id") + ".");
        if ($(".report-parameter[data-dependents=1][data-changed=1]").length > 0) {
            Log("Data changed in " + $(this).attr("id") + " with " + $(this).attr("data-dependants") + " dependants.");
            event.preventDefault();
            RefreshParameters($(this));
            return;
        }
        if ($(this).attr("id") == "ReportReload") {
            var Data = GetFormParameters();
            var EncodedUri = ReportUrl + "?" + $.param(Data, true);
            //alert(EncodedUri);
            $Report.attr("src", EncodedUri);
            $("#ReportLoader").fadeIn(200);
        }
    });

    function DependentFieldEnter($Field) {
        var Dependencies = {};
        Dependencies = $Field.attr("data-dependencies").split(",");
        if (Dependencies.length == 0)
            return;

        var AnyDependencyChanged = false;
        $.each(Dependencies, function () {
            $Dependency = $("[name='" + this + "']");
            if ($Dependency.attr("data-changed") == "1") {
                AnyDependencyChanged = true;
            }
        });

        if (AnyDependencyChanged) {
            //$("#Report").parent().prepend("<div><strong>Refresh parameters </strong> of the \"" + $Field.attr("name") + "\" field.</div>");
            RefreshParameters($Field);
        }
    }
    
    function RefreshParameters($CurrentField) {
        if ($CurrentField.prop("tagName") == "SELECT") {
            //Log("Close chosen.");
            $CurrentField.trigger("chosen:close");
        }
        else if ($CurrentField.hasClass("datetimepicker")) {
            /*
            setTimeout(function () {
                Log("Hide datetimepicker.");
                $CurrentField.datetimepicker("hide");

            }, 100);
            */
        }

        $("#ParametersLoader").fadeIn(200);
        $(".report-parameter").each(function () {
            $(this).attr("data-changed", "0");
        });

        var Parameters = GetFormParameters();
        Parameters["parametername"] = $("#ReportParameters").attr("data-last-change");
        //$("#Report").parent().prepend("<span>" + JSON.stringify(Parameters) + "</span>");
        $.post(ParametersUrl, Parameters, function (data) {
            UpdateReportParameters(data, $CurrentField.attr("id"));
            setTimeout(function () {
                $("#ParametersLoader").fadeOut(500);
            }, 200);
        });
    }

    function UpdateReportParameters(data, CurrentFieldId) {
        var ParametersData;

        try {
            ParametersData = JSON.parse(data);
        }
        catch (e) {
            DisplayMessage($("#ReportParameters"), "Nie udało się zaktualizować parametrów. Raport może nie działać poprawnie.", "danger");
            return;
        }

        if (ParametersData.length < 2) {
            DisplayMessage($("#ReportParameters"), "Błąd otrzymywania parametrów! Raport może nie działać poprawnie.", "danger");
            return;
        }

        $.each(ParametersData[1], function (key, value) {
            Log("Processing " + key + "...");
            $Field = $("#" + key);

            Log("Processing " + key + "...");
            Log("Dla pola '" + key + "': " + JSON.stringify(value));
            Log("Value.length = " + Object.keys(value).length + ".");

            // Convert not select into select to give user some options to choose! Hard work is done here...
            if ($Field.prop("tagName") != "SELECT" && Object.keys(value).length > 0) {
                Log("Adding new element for " + key + "...");
                var NewId = "tempId";
                $NewField = $Field.after("<select id=\"" + NewId + "\"></select>");
                $NewField = $("#" + NewId);
                var attributes = $Field.prop("attributes");
                // loop through old attributes and apply them on new element
                $.each(attributes, function () {
                    $NewField.attr(this.name, this.value);
                    Log("Adding new element attribute " + this.name + " for " + key + "...");
                });
                var Prompt = $NewField.parent().parent().find(".form-control-label").text();
                $NewField.attr("data-placeholder", "Wybierz " + Prompt + "...");
                $NewField.addClass("standardSelect");
                $NewField.chosen({
                    disable_search_threshold: 10,
                    no_results_text: "Nic nie znaleziono!",
                    width: "100%",
                });
                $NewField.parent().find(".input-group-addon").remove();
                $Field.remove();
                $NewField.attr("id", $Field.attr("id"));
                $Field = $NewField;
            }

            if ($Field.prop("tagName") == "SELECT") {
                var CurrentOptions = [];
                $Field.find("option").each(function () {
                    CurrentOptions.push($(this).attr("value"));
                });

                //$Field.empty();
                var Processed = [];

                $.each(value, function (key, value) {
                    //Log("Option " + key + " is " + ((key in CurrentOptions) ? "not " : "") + "in the array.");
                    if (CurrentOptions.indexOf(key) == -1) {
                        //Log("Adding option " + key + ": " + value + " to the field.");
                        $Field.append(
                            $("<option></option>").attr("value", key).text(value)
                        );
                    }
                    Log("Option inside: " + key + " with value: " + value + ".");
                    Processed.push(key);
                });

                //Log("Processed: " + JSON.stringify(Processed) + "\r\nOptions: " + JSON.stringify(CurrentOptions));
                $Field.find("option").each(function () {
                    if (Processed.indexOf($(this).attr("value")) == -1) {
                        //Log("Removing option " + $(this).attr("value") + ": " + $(this).text() + " from the field.");
                        $(this).remove();
                    }
                });
                Log("Update chosen.");
                $Field.trigger("chosen:updated");
            }
            else if (value != null) {
                $.each(value, function (key, value) {
                    Log("Option outside element: " + key + " with value: " + value + ".");
                });
            }

            if ($Field.attr("id") == CurrentFieldId) {
                if ($Field.prop("tagName") == "SELECT") {
                    setTimeout(function () {
                        //Log("Pre-close chosen.");
                        $Field.trigger("chosen:close");
                        setTimeout(function () {
                            //Log("Open chosen.");
                            $Field.trigger("chosen:open");
                        }, 0);
                    }, 0);
                }
                else if ($Field.hasClass("datetimepicker")) {
                    /*
                    Log("Datetimepicker pre-click.");
                    $Field.parent().click();
                    setTimeout(function () {
                        Log("Datetimepicker click.");
                        $Field.click();
                    }, 1000);
                    */
                }
            }
        });
    }

    function DisplayMessage($Element, Message, Type = null) {
        var AvailableTypes = ["danger", "info", "success"];
        var DefaultTitles = {
            "info": "Informacja",
            "danger": "Błąd",
            "success": "Powodzenie"
        };
        if (Type == null || !(Type in AvailableTypes))
            Type = "info";

        var MessageHtml = '<div class="alert alert-' + Type + ' alert-dismissible fade show" role="alert"><span class="badge badge-pill badge-' + Type + '">' + DefaultTitles[Type] + '</span>' + Message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        $Element.prepend(MessageHtml);
    }

    $(".report-parameter").change(function () {
        var $Field = $(this);
        var $Focused;

        FieldOnChange($Field);
    });

    ACaRS.GetTimeString = function () {
        var currentdate = new Date();
        return currentdate.getMinutes() + ":"
            + currentdate.getSeconds() + "."
            + currentdate.getMilliseconds();
    };

    GetTimeString = function () {
        return ACaRS.GetTimeString();
    }

    ACaRS.Log = function (Message) {
        console.log(GetTimeString() + ": " + Message);
    };

    Log = function (Message) {
        return ACaRS.Log(Message);
    }

    $("#ReportPageControls div.btn").click(function () {
        if ($(this).hasClass("disabled")) {
            //Log("Disabled click.");
            return;
        }
        var RequestedPageNumber = 0;
        $Info = $("#Report").contents().find("#ReportInfo");
        var CurrentPage = $Info.data("currentpage");
        var PageCount = $Info.data("pagecount");

        if (this.id == "ReportPageFirst")
            RequestedPageNumber = 1;
        else if (this.id == "ReportPagePrevious")
            RequestedPageNumber = CurrentPage - 1;
        else if (this.id == "ReportPageNext")
            RequestedPageNumber = CurrentPage + 1;
        else if (this.id == "ReportPageLast")
            RequestedPageNumber = PageCount;

        NavigateToPage(RequestedPageNumber);
    });

    $(document).on("change", "#CurrentPage", function () {
        NavigateToPage($(this).val());
    });

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function NavigateToPage(RequestedPageNumber) {
        if (RequestedPageNumber == null || !isNumeric(RequestedPageNumber)) {
            Log("Requested page number is null or not a number: " + RequestedPageNumber);
            return;
        }

        if (RequestedPageNumber == 0) {
            Log("Requested page number is 0.");
            return;
        }

        $Info = $("#Report").contents().find("#ReportInfo");
        var CurrentPage = $Info.data("currentpage");
        var PageCount = $Info.data("pagecount");

        if (RequestedPageNumber > PageCount) {
            Log("Trying to navigate to not existing page number.");
            return;
        }

        //Log("Żądany numer strony to " + RequestedPageNumber + ".");
        var Data = GetFormParameters();
        var EncodedUri;
        Data["page"] = RequestedPageNumber;
        EncodedUri = ReportUrl + "?" + $.param(Data, true);
        $Report.attr("src", EncodedUri);
        $("#ReportLoader").fadeIn(200);
    }

    function GetFormParameters() {
        var Data = {
            reportname: $("#ReportName").data("name")
        };

        $(".report-parameter").each(function () {
            if ($(this).attr("type") == "checkbox") {
                if ($(this).prop("checked"))
                    Data[this.name] = "True";
                else
                    Data[this.name] = "False";
            }
            else {
                Data[this.name] = $(this).val();
            }
        });

        return Data;
    }

    function SetExportLinks() {
        var Data = GetFormParameters();
        var EncodedUri;
        Data["export"] = "1";
        $(".ReportExport").each(function () {
            Data["format"] = $(this).data("format");
            EncodedUri = ReportUrl + "?" + $.param(Data, true);
            $(this).attr("href", EncodedUri);
        });
    }

    function isEmpty(obj) {

        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0) return false;
        if (obj.length === 0) return true;

        // If it isn't an object at this point
        // it is empty, but it can't be anything *but* empty
        // Is it empty?  Depends on your application.
        if (typeof obj !== "object") return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and valueOf enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }

        return true;
    }

    $(document).ready(function () {
        $Fields = jQuery(".standardSelect");
        $Fields.chosen({
            disable_search_threshold: 10,
            no_results_text: "Nic nie znaleziono!",
            width: "100%",
        });
        $Fields.on("chosen:showing_dropdown", function () {
            //Log("Showing dropdown.");
        });
        $Fields.on("chosen:hiding_dropdown", function () {
            //Log("Hiding dropdown.");
        });

        $('*[data-toggle="datetimepicker"]').addClass('datetimepicker-input');

        /*
        $(".datetimepicker").each(function (index) {
            $(this).datetimepicker({ value: new Date($(this).attr("value")) });
            Log("Datetimepicker with val: " + $(this).attr("value") + ".");
        });
        */
    });
});