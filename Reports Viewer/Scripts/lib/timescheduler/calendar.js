var Calendar;

jQuery(function ($) {
    // Visual Studio references

    /// <reference path="jquery-1.9.1.min.js" />
    /// <reference path="jquery-ui-1.10.2.min.js" />
    /// <reference path="moment.min.js" />
    /// <reference path="timelineScheduler.js" />

    var today = moment().startOf('day');

    Calendar = function() {
        this.Periods = [
            {
                Name: '1 week',
                Label: '1 tydzień',
                TimeframePeriod: (60 * 24),
                TimeframeOverall: (60 * 24 * 7),
                TimeframeHeaders: [
                    'MMMM',
                    'dddd, D.MM'
                ],
                Classes: 'period-1week'
            }
        ],

        this.Items = [],

        this.Sections = [],

        this.TimeScheduler = null,

        this.Element = null,

        this.Id = null,

        this.StartDate = null,

        this.HighlightInverse = false,

        this.Init = function () {
            this.TimeScheduler = new TimeScheduler();
            this.TimeScheduler.Options.GetSections = this.GetSections;
            this.TimeScheduler.Options.GetSchedule = this.GetSchedule;

            this.TimeScheduler.Calendar = this;
            this.TimeScheduler.Options.Start = this.StartDate;
            this.TimeScheduler.Options.Periods = this.Periods;
            this.TimeScheduler.Options.SelectedPeriod = '1 week';
            this.TimeScheduler.Options.Element = $(".calendar[data-id=" + this.Id + "]");
            this.TimeScheduler.HighlightInverse = this.HighlightInverse

            this.TimeScheduler.Options.AllowDragging = false;
            this.TimeScheduler.Options.AllowResizing = false;

            this.TimeScheduler.Options.Events.ItemClicked = this.Item_Clicked;
            this.TimeScheduler.Options.Events.ItemDropped = this.Item_Dragged;
            this.TimeScheduler.Options.Events.ItemResized = this.Item_Resized;
            this.TimeScheduler.Options.Events.ItemMouseEnter = this.Item_MouseEnter;
            this.TimeScheduler.Options.Events.ItemMouseLeave = this.Item_MouseLeave;

            this.TimeScheduler.Options.Events.ItemMovement = this.Item_Movement;
            this.TimeScheduler.Options.Events.ItemMovementStart = this.Item_MovementStart;
            this.TimeScheduler.Options.Events.ItemMovementEnd = this.Item_MovementEnd;

            this.TimeScheduler.Options.Text.NextButton = '&nbsp;';
            this.TimeScheduler.Options.Text.PrevButton = '&nbsp;';

            this.TimeScheduler.Options.ShowGoto = false;
            this.TimeScheduler.Options.ShowToday = false;
            this.TimeScheduler.Options.ShowPeriods = false;
            this.TimeScheduler.Options.ShowTitle = false;
            this.TimeScheduler.Options.ShowTableHeader = false;

            this.TimeScheduler.Options.MaxHeight = 100;

            this.TimeScheduler.Init();
        },

        this.GetSections = function (callback) {
            callback(this.Calendar.Sections);
        },

        this.GetSchedule = function (callback, start, end) {
            callback(this.Calendar.Items);
        },

        this.Item_Clicked = function (item) {
            //console.log(item);
        },

        this.Item_Dragged = function (item, sectionID, start, end) {
            var foundItem;

            console.log(item);
            console.log(sectionID);
            console.log(start);
            console.log(end);

            for (var i = 0; i < this.Items.length; i++) {
                foundItem = this.Items[i];

                if (foundItem.id === item.id) {
                    foundItem.sectionID = sectionID;
                    foundItem.start = start;
                    foundItem.end = end;

                    this.Items[i] = foundItem;
                }
            }

            this.TimeScheduler.Init();
        },

        this.Item_Resized = function (item, start, end) {
            var foundItem;

            console.log(item);
            console.log(start);
            console.log(end);

            for (var i = 0; i < this.Items.length; i++) {
                foundItem = this.Items[i];

                if (foundItem.id === item.id) {
                    foundItem.start = start;
                    foundItem.end = end;

                    this.Items[i] = foundItem;
                }
            }

            this.TimeScheduler.Init();
            },


        this.Item_Movement = function (item, start, end) {
            $('.realtime-info').empty().append(html);
            },

        this.Item_MouseEnter = function (item) {
            var $Event = $('[data-event-id=' + item.id + ']');
            var Text = 'Od ' + item.start.format('HH:mm') + ' do ' + item.end.format('HH:mm') + '.';
            $Event.css('background-color', '#4af');
            var $Div = $Event.find('div.item-description');
            var CurrentText;
            if ($Div.length > 0)
            {
                $FirstDiv = $Event.first('div.item-description');
                CurrentText = $FirstDiv.text();
            }
            else
            {
                CurrentText = $Div.text();
            }
            if ($Event.width() > 110)
            {
                if ($Event.width() >= 200)
                {
                    Text = 'Od ' + item.start.format('DD.MM o HH:mm') + ' do ' + item.end.format('DD.MM o HH:mm') + '.';
                }
                $Div.attr('data-text', CurrentText);
                $Div.text(Text);
            }
            else
            {
                var $Parent = $Event.parents('.calendar');
                var $Tooltip = $Parent.find('.scheduler-tooltip');
                
                var $EventTooltip = $Tooltip.clone().appendTo($Event)
                    .removeClass("scheduler-tooltip")
                    .addClass("event-tooltip")
                    .css("left", (($Event.css("left")) / ($Event.parent().width() * 100)) + "%")
                    .attr("data-item-id", item.id)
                    .text(CurrentText + " " + Text.toLowerCase());
                $EventTooltip.fadeIn(200);
            }
        },

        this.Item_MouseLeave = function (item) {
            var $Event = $('[data-event-id=' + item.id + ']');
            var $Parent = $Event.parents('.calendar');
            var $Tooltip = $Parent.find('.scheduler-tooltip');
            var $Div = $Event.find('div.item-description');
            var TextAttribute = $Div.attr('data-text');
            var $EventTooltip = $Event.find('.event-tooltip');
            if ($EventTooltip.length == 0)
            {
                var $Div = $Event.find('div.item-description');
                $Div.text($Div.attr('data-text'));
            }
            else
            {
                var $EventTooltip = $Event.find('.event-tooltip');
                $EventTooltip.fadeOut(200);
                $EventTooltip.remove();
            }
            $Event.css('background-color', '');
        },

        this.Item_MovementStart = function () {
            $('.realtime-info').show();
        },

        this.Item_MovementEnd = function () {
            $('.realtime-info').hide();
        }
    };
});