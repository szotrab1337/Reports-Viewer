/*!  Copyright (c) 2013 Zallist

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/
/*! Project location: https://github.com/Zallist/TimeScheduler */

// Visual Studio references

/// <reference path="jquery-1.9.1.min.js" />
/// <reference path="moment.min.js" />

var TimeScheduler;
var CurrentScheduler;
var ColId = 0;

moment.lang("pl", {
    months: 'Styczeń_Luty_Marzec_Kwiecień_Maj_Czerwiec_Lipiec_Sierpień_Wrzesień_Październik_Listopad_Grudzień'.split('_'),
    monthsShort: 'Sty._Luty_Marz._Kwi._Maj_Czer._Lip._Sier._Wrz._Paź._Lis._Gru.'.split('_'),
    monthsParseExact: true,
    weekdays: 'Niedziela_Poniedziałek_Wtorek_Środa_Czwartek_Piątek_Sobota'.split('_'),
    weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin: 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact: true,
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY HH:mm',
        LLLL: 'dddd D MMMM YYYY HH:mm'
    },
    calendar: {
        sameDay: '[Aujourd’hui à] LT',
        nextDay: '[Demain à] LT',
        nextWeek: 'dddd [à] LT',
        lastDay: '[Hier à] LT',
        lastWeek: 'dddd [dernier à] LT',
        sameElse: 'L'
    },
    relativeTime: {
        future: 'dans %s',
        past: 'il y a %s',
        s: 'quelques secondes',
        m: 'une minute',
        mm: '%d minutes',
        h: 'une heure',
        hh: '%d heures',
        d: 'un jour',
        dd: '%d jours',
        M: 'un mois',
        MM: '%d mois',
        y: 'un an',
        yy: '%d ans'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
    ordinal: function (number) {
        return number + (number === 1 ? 'er' : 'e');
    },
    meridiemParse: /rano|po poł./,
    isPM: function (input) {
        return input.charAt(0) === 'M';
    },
    // In case the meridiem units are not separated around 12, then implement
    // this function (look at locale/id.js for an example).
    // meridiemHour : function (hour, meridiem) {
    //     return /* 0-23 hour, given meridiem token and hour 1-12 */ ;
    // },
    meridiem: function (hours, minutes, isLower) {
        return hours < 12 ? 'rano' : 'po poł.';
    },
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
});

jQuery(function ($) {
    TimeScheduler = function TimeScheduler() {
        this.Options = {
            /* The function to call to fill up Sections.
               Sections are cached. To clear cache, use TimelineScheduler.FillSections(true);
               Callback accepts an array of sections in the format {
                id: num,
                name: string
               }
            */
            GetSections: function (callback) { },

            /* The function to call to fill up Items.
               Callback accepts an array of items in the format 
               {
                    id: num,
                    name: string,
                    sectionID: ID of Section,
                    start: Moment of the start,
                    end: Moment of the end,
                    classes: string of classes to add,
                    events: [
                        {
                            label: string to show in tooltip,
                            at: Moment of event,
                            classes: string of classes to add
                        }
                    ]
                }
            */
            GetSchedule: function (callback, start, end) { },

            /* The Moment to start the calendar at. RECOMMENDED: .startOf('day') */
            Start: moment(),

            /* The Moment format to use when displaying Header information */
            HeaderFormat: 'Do MMM YYYY',

            /* The Moment format to use when displaying Tooltip information */
            LowerFormat: 'DD-MMM-YYYY HH:mm',

            /* An array of Periods to be selectable by the user in the form of {
	            Name: unique string name to be used when selecting,
                Label: string to display on the Period Button,
                TimeframePeriod: number of minutes between intervals on the scheduler,
                TimeframeOverall: number of minutes between the Start of the period and the End of the period,
                TimeframeHeaderFormats: Array of formats to use for headers.
            }
            */
            Periods: [
                {
                    Name: '2 days',
                    Label: '2 days',
                    TimeframePeriod: 120,
                    TimeframeOverall: 2880,
                    TimeframeHeaders: [
                        'Do MMM',
                        'HH'
                    ],
                    Classes: 'time-sch-period-2day'
                },
                {
                    Name: '2 weeks',
                    Label: '2 weeks',
                    TimeframePeriod: 1440,
                    TimeframeOverall: 20160,
                    TimeframeHeaders: [
                        'MMM',
                        'Do'
                    ],
                    Classes: 'time-sch-period-2week'
                }
            ],

            HighlightInverse: false,

            /* The Name of the period to select */
            SelectedPeriod: '2 weeks',

            /* The Element to put the scheduler on */
            Element: $('<div></div>'),

            /* The minimum height of each section */
            MinRowHeight: 25,

            /* Whether to show the Current Time or not */
            ShowCurrentTime: true,

            /* Whether to show the Goto button */
            ShowGoto: true,

            /* Whether to show the Today button */
            ShowToday: true,

            /* Whether to show the navigation buttons */
            ShowNavigation: true,

            /* Whether to show the period switches */
            ShowPeriods: true,

            /* Whether to show the title */
            ShowTitle: true,

            /* Whether to show the table headers */
            ShowTableHeader: true,

            /* Text to use when creating the scheduler */
            Text: {
                NextButton: 'Next',
                NextButtonTitle: 'Next period',
                PrevButton: 'Prev',
                PrevButtonTitle: 'Previous period',
                TodayButton: 'Today',
                TodayButtonTitle: 'Go to today',
                GotoButton: 'Go to',
                GotoButtonTitle: 'Go to specific date'
            },

            Events: {
                // function (item) { }
                ItemMouseEnter: null,

                // function (item) { }
                ItemMouseLeave: null,

                // function (item) { }
                ItemClicked: null,

                // function (item, sectionID, start, end) { }
                ItemDropped: null,

                // function (item, start, end) { }
                ItemResized: null,

                // function (item, start, end) { }
                // Called when any item move event is triggered (draggable.drag, resizable.resize)
                ItemMovement: null,
                // Called when any item move event starts (draggable.start, resizable.start)
                ItemMovementStart: null,
                // Called when any item move event ends (draggable.end, resizable.end)
                ItemMovementEnd: null,

                // function (eventData, itemData)
                ItemEventClick: null,

                // function (eventData, itemData)
                ItemEventMouseEnter: null,

                // function (eventData, itemData)
                ItemEventMouseLeave: null
            },

            // Should dragging be enabled?
            AllowDragging: false,

            // Should resizing be enabled?
            AllowResizing: false,

            // Disable items on moving?
            DisableOnMove: true,

            // A given max height for the calendar, if unspecified, will expand forever
            MaxHeight: null
        },

        this.Wrapper = null,

        this.HeaderWrap = null,
        this.TableWrap = null,

        this.ContentHeaderWrap = null,
        this.ContentWrap = null,

        this.TableHeader = null,
        this.TableContent = null,
        this.SectionWrap = null,

        this.Table = null,
        this.Sections = {},

        this.CachedSectionResult = null,
        this.CachedScheduleResult = null,

        this.Calendar = null,

        this.SetupPrototypes = function () {
            moment.fn.tsAdd = function (input, val) {
                var dur;
                // switch args to support add('s', 1) and add(1, 's')
                if (typeof input === 'string') {
                    dur = moment.duration(+val, input);
                } else {
                    dur = moment.duration(input, val);
                }
                this.tsAddOrSubtractDurationFromMoment(this, dur, 1);
                return this;
            }

            moment.fn.tsSubtract = function (input, val) {
                var dur;
                // switch args to support subtract('s', 1) and subtract(1, 's')
                if (typeof input === 'string') {
                    dur = moment.duration(+val, input);
                } else {
                    dur = moment.duration(input, val);
                }
                this.tsAddOrSubtractDurationFromMoment(this, dur, -1);
                return this;
            }

            // Replace the AddOrSubtract function so that zoning is not taken into account at all
            moment.fn.tsAddOrSubtractDurationFromMoment = function (mom, duration, isAdding) {
                var ms = duration._milliseconds,
                    d = duration._days,
                    M = duration._months,
                    currentDate;

                if (ms) {
                    mom.milliseconds(mom.milliseconds() + ms * isAdding);
                    //mom._d.setTime(+mom + ms * isAdding);
                }
                if (d) {
                    mom.date(mom.date() + d * isAdding);
                }
                if (M) {
                    currentDate = mom.date();
                    mom.date(1)
                        .month(mom.month() + M * isAdding)
                        .date(Math.min(currentDate, mom.daysInMonth()));
                }
            }
        },

        /* Initializes the Timeline Scheduler with the given opts. If omitted, defaults are used. */
        /* This should be used to recreate the scheduler with new defaults or refill items */
            this.Init = function (overrideCache) {
            CurrentScheduler = this;

            //console.log("---------- INIT ----------");
            this.SetupPrototypes();

            this.Options.Start = moment(this.Options.Start);

            this.Options.Element.find('.ui-draggable').draggable('destroy');
            this.Options.Element.empty();

            this.Wrapper = $(document.createElement('div'))
                .addClass('time-sch-wrapper')
                .appendTo(this.Options.Element);

            this.HeaderWrap = $(document.createElement('div'))
                .addClass('time-sch-header-wrapper time-sch-clearfix')
                .appendTo(this.Wrapper);

            this.TableWrap = $(document.createElement('div'))
                .addClass('time-sch-table-wrapper')
                .appendTo(this.Wrapper);

            this.CreateCalendar();
            this.FillSections(overrideCache);
        },

        this.GetSelectedPeriod = function () {
            var period;

            for (var i = 0; i < this.Options.Periods.length; i++) {
                if (this.Options.Periods[i].Name === this.Options.SelectedPeriod) {
                    period = this.Options.Periods[i];
                    break;
                }
            }

            if (!period) {
                period = this.Options.Periods[0];
                this.SelectPeriod(period.Name);
            }

            return period;
        },

        this.GetEndOfPeriod = function (start, period) {
            return moment(start).tsAdd('minutes', period.TimeframeOverall);
        },

        this.AddHeaderClasses = function (td, columnCount, specificHeader, thisTime) {
            var trs, trArray, tr;
            var tdArray, foundTD;
            var prevIndex, nextIndex, colspan;
            var complete, isEven;

            trs = this.TableHeader.find('tr');

            if (specificHeader !== undefined) {
                trs = $(trs.get(specificHeader));
            }

            if (trs.length && trs.length > 0) {
                trArray = $.makeArray(trs);

                //console.log("for trCount.");
                for (var trCount = 0; trCount < trArray.length; trCount++) {
                    complete = false;
                    nextIndex = 0;
                    tr = $(trArray[trCount]);
                    tdArray = $.makeArray(tr.find('.time-sch-date-header'));
                    
                    for (var tdCount = 0; tdCount < tdArray.length && !complete; tdCount++) {
                        foundTD = $(tdArray[tdCount]);

                        colspan = Number(foundTD.attr('colspan'));
                        if (colspan && !isNaN(colspan) && colspan > 0) {
                            prevIndex = (nextIndex ? nextIndex : 0);
                            nextIndex = prevIndex + colspan;
                        }
                        else {
                            prevIndex = (nextIndex ? nextIndex : 0);
                            nextIndex = prevIndex + 1;
                        }

                        if (prevIndex === columnCount) {
                            td.addClass('time-sch-header-' + trCount + '-date-start');
                        }
                        if (nextIndex - 1 === columnCount) {
                            td.addClass('time-sch-header-' + trCount + '-date-end');
                        }

                        if (prevIndex <= columnCount && columnCount < nextIndex) {
                            complete = true;
                            isEven = tdCount % 2 === 0;
                            
                            //console.log("ID = " + ColId + ", " + (isEven ? 'even' : 'odd') + ", rtCount = " + trCount + ", tdCount = " + tdCount + ", isEven = " + isEven + ", tdArray.length = " + tdArray.length + ", prevIndex = " + prevIndex + ", nextIndex = " + nextIndex + ", columnCount = " + columnCount + ".");
                            //console.log(tdArray);
                            if (thisTime === undefined)
                            {
                                //console.log("Time it's undefined.");
                                td.addClass('time-sch-header-' + trCount + '-date-column-' + tdCount)
                                    .addClass('time-sch-header-' + trCount + '-date-' + (foundTD.hasClass("time-sch-header-0-date-even") ? 'even' : 'odd'));
                            }
                            else
                            {
                                //console.log("Time it's defined.");
                                td.addClass('time-sch-header-' + trCount + '-date-column-' + tdCount)
                                    .addClass('time-sch-header-' + trCount + '-date-' + (((thisTime.month() + (this.HighlightInverse ? 1 : 0)) % 2 === 0) ? 'even' : 'odd'));
                            }

                            if (foundTD.hasClass('time-sch-header-' + trCount + '-current-time')) {
                                td.addClass('time-sch-header-' + trCount + '-current-time');
                            }
                        }
                    }
                }
            }
        },

        this.CreateCalendar = function () {
            var tr, td, header;
            var minuteDiff, splits, period, end;
            var thisTime, prevDate, fThisTime, fPrevDate, colspan;
            var currentTimeIndex;

            colspan = 0;

            period = this.GetSelectedPeriod();
            end = this.GetEndOfPeriod(this.Options.Start, period);

            minuteDiff = Math.abs(this.Options.Start.diff(end, 'minutes'));
            splits = (minuteDiff / period.TimeframePeriod);

            this.ContentHeaderWrap = $(document.createElement('div'))
                .addClass('time-sch-content-header-wrap')
                .appendTo(this.TableWrap);

            this.ContentWrap = $(document.createElement('div'))
                .addClass('time-sch-content-wrap')
                .appendTo(this.TableWrap);

            this.TableHeader = $(document.createElement('table'))
                .addClass('time-sch-table time-sch-table-header')
                .appendTo(this.ContentHeaderWrap);

            this.TableContent = $(document.createElement('table'))
                .addClass('time-sch-table time-sch-table-content')
                .appendTo(this.ContentWrap);

            this.SectionWrap = $(document.createElement('div'))
                .addClass('time-sch-section-wrapper')
                .appendTo(this.ContentWrap);

            if (period.Classes) {
                this.TableWrap.toggleClass(period.Classes, true);
            }

            for (var headerCount = 0; headerCount < period.TimeframeHeaders.length; headerCount++) {
                prevDate = null;
                fPrevDate = null;

                isEven = true;
                colspan = 0;
                currentTimeIndex = 0;

                header = period.TimeframeHeaders[headerCount];

                tr = $(document.createElement('tr'))
                    .addClass('time-sch-times time-sch-times-header-' + headerCount)
                    .appendTo(this.TableHeader);

                td = $(document.createElement('td'))
                    .addClass('time-sch-section time-sch-section-header')
                    .appendTo(tr);

                for (var i = 0; i < splits; i++) {
                    thisTime = moment(this.Options.Start)
                        .tsAdd('minutes', (i * period.TimeframePeriod));
                    
                    fThisTime = thisTime.format(header);
                
                    if (fPrevDate !== fThisTime) {
                        // If there is no prevDate, it's the Section Header
                        if (prevDate) {
                            td.attr('colspan', colspan);
                            colspan = 0;

                            if (moment() >= prevDate && moment() < thisTime) {
                                td.addClass('time-sch-header-' + headerCount + '-current-time');
                            }
                        }

                        prevDate = thisTime;
                        fPrevDate = fThisTime;
                        
                        td = $(document.createElement('td'))
                            .data('header-row', headerCount)
                            .data('column-count', i)
                            .data('column-is-even', isEven)
                            .addClass('time-sch-date time-sch-date-header')
                            .append(fThisTime)
                            .appendTo(tr);


                        td.addClass('time-sch-header-' + headerCount + '-date-start')
                            .addClass('time-sch-header-' + headerCount + '-date-end')
                            .addClass('time-sch-header-' + headerCount + '-date-column-' + currentTimeIndex)
                            .addClass('time-sch-header-' + headerCount + '-date-' + (((thisTime.month() + (this.HighlightInverse ? 1 : 0)) % 2 === 0) ? 'even' : 'odd'));

                        for (var prevHeader = 0; prevHeader < headerCount; prevHeader++) {
                            this.AddHeaderClasses(td, i, prevHeader, thisTime);
                        }

                        currentTimeIndex += 1;
                    }

                    colspan += 1;
                }

                td.attr('colspan', colspan);
            }

            this.FillHeader();
        },

        this.CreateSections = function (sections) {
            var timeCount, tr, td, sectionContainer, headers, i;

            timeCount = 1;
            headers = $.makeArray(this.TableHeader.find('tr'));

            for (i = 0; i < headers.length; i++) {
                if (timeCount < $(headers[i]).find('.time-sch-date-header').length) {
                    timeCount = $(headers[i]).find('.time-sch-date-header').length;
                }
            }

            //console.log("Sections.length = " + sections.length + ".");
            for (i = 0; i < sections.length; i++) {
                tr = $(document.createElement('tr'))
                    .addClass('time-sch-section-row')
                    .addClass(i % 2 === 0 ? 'time-sch-section-even' : 'time-sch-section-odd')
                    .css('height', this.Options.MinRowHeight)
                    .appendTo(this.TableContent);

                sectionContainer = $(document.createElement('div'))
                    .addClass('time-sch-section-container')
                    .css('height', this.Options.MinRowHeight)
                    .data('section', sections[i])
                    .appendTo(this.SectionWrap);

                td = $(document.createElement('td'))
                    .addClass('time-sch-section time-sch-section-content')
                    .data('section', sections[i])
                    .append(sections[i].name)
                    .appendTo(tr);

                for (time = 0; time < timeCount; time++) {
                    td = $(document.createElement('td'))
                        .addClass('time-sch-date time-sch-date-content')
                        .appendTo(tr);

                    this.AddHeaderClasses(td, time);
                }

                this.Sections[sections[i].id] = {
                    row: tr,
                    container: sectionContainer
                };
            }

            this.SectionWrap.css({
                left: this.Options.Element.find('.time-sch-section').outerWidth()
            });

            if (this.Options.ShowCurrentTime) {
                this.ShowCurrentTime();
            }
        },

        this.ShowCurrentTimeHandle = null,
        this.ShowCurrentTime = function () {
            var currentTime, currentTimeElem, minuteDiff, currentDiff, end;

            // Stop any other timeouts happening
            if (this.ShowCurrentTimeHandle) {
                clearTimeout(this.ShowCurrentTimeHandle);
            }

            currentTime = moment();
            end = this.GetEndOfPeriod(this.Options.Start, this.GetSelectedPeriod());
            minuteDiff = Math.abs(this.Options.Start.diff(end, 'minutes'));
            currentDiff = Math.abs(this.Options.Start.diff(currentTime, 'minutes'));

            currentTimeElem = this.Options.Element.find('.time-sch-current-time');
            currentTimeElem.remove();

            if (currentTime >= this.Options.Start && currentTime <= end) {
                currentTimeElem = $(document.createElement('div'))
                    .addClass('time-sch-current-time')
                    .css('left', ((currentDiff / minuteDiff) * 100) + '%')
                    .attr('title', currentTime.format(this.Options.LowerFormat))
                    .appendTo(this.SectionWrap);
            }

            // Since we're only comparing minutes, we may as well only check once every 30 seconds
            this.ShowCurrentTimeHandle = setTimeout(this.ShowCurrentTime.bind(this), 30000);
        },

        this.CreateItems = function (items) {
            var item, event, section, itemElem, eventElem, itemContent, itemName, itemIcon;
            var minuteDiff, splits, itemDiff, itemSelfDiff, eventDiff, calcTop, calcLeft, calcWidth, foundStart, foundEnd;
            var inSection = {}, foundPos, elem, prevElem, needsNewRow;
            var period, end, i;

            period = this.GetSelectedPeriod();
            end = this.GetEndOfPeriod(this.Options.Start, period);

            minuteDiff = Math.abs(this.Options.Start.diff(end, 'minutes'));

            for (i = 0; i < items.length; i++) {
                item = items[i];
                section = this.Sections[item.sectionID];

                if (section) {
                    if (!inSection[item.sectionID]) {
                        inSection[item.sectionID] = [];
                    }

                    if (item.start <= end && item.end >= this.Options.Start) {
                        foundPos = null;

                        foundStart = moment(Math.max(item.start, this.Options.Start));
                        foundEnd = moment(Math.min(item.end, end));

                        itemDiff = foundStart.diff(this.Options.Start, 'minutes');
                        itemSelfDiff = Math.abs(foundStart.diff(foundEnd, 'minutes'));

                        calcTop = 0;
                        calcLeft = (itemDiff / minuteDiff) * 100;
                        calcWidth = (itemSelfDiff / minuteDiff) * 100;

                        itemElem = $(document.createElement('div'))
                            .addClass('time-sch-item ' + (item.classes ? item.classes : ''))
                            .attr('data-event-id', item.id)
                            .css({
                                top: calcTop,
                                left: calcLeft + '%',
                                width: calcWidth + '%'
                            })
                            .appendTo(section.container);

                        itemContent = $(document.createElement('div'))
                            .addClass('time-sch-item-content')
                            .appendTo(itemElem);

                        if (item.name) {
                            $(document.createElement('div'))
                                .append(item.name)
                                .appendTo(itemContent);
                        }

                        if (item.events) {
                            for (var ev = 0; ev < item.events.length; ev++) {
                                event = item.events[ev];

                                eventDiff = (event.at.diff(foundStart, 'minutes') / itemSelfDiff) * 100;

                                $(document.createElement('div'))
                                    .addClass('time-sch-item-event ' + (event.classes ? event.classes : ''))
                                    .css('left', eventDiff + '%')
                                    .attr('title', event.at.format(this.Options.LowerFormat) + ' - ' + event.label)
                                    .data('event', event)
                                    .appendTo(itemElem);
                            }
                        }

                        if (item.start >= this.Options.Start) {
                            $(document.createElement('div'))
                                .addClass('time-sch-item-start')
                                .appendTo(itemElem);
                        }
                        if (item.end <= end) {
                            $(document.createElement('div'))
                                .addClass('time-sch-item-end')
                                .appendTo(itemElem);
                        }

                        item.Element = itemElem;

                        // Place this in the current section array in its sorted position
                        for (var pos = 0; pos < inSection[item.sectionID].length; pos++) {
                            if (inSection[item.sectionID][pos].start > item.start) {
                                foundPos = pos;
                                break;
                            }
                        }

                        if (foundPos === null) {
                            foundPos = inSection[item.sectionID].length;
                        }

                        inSection[item.sectionID].splice(foundPos, 0, item);

                        itemElem.data('item', item);

                        this.SetupItemEvents(itemElem);
                    }
                }
            }

            // Sort out layout issues so no elements overlap
            for (var prop in inSection) {
                section = this.Sections[prop];

                for (i = 0; i < inSection[prop].length; i++) {
                    var elemTop, elemBottom;
                    elem = inSection[prop][i];

                    // If we're passed the first item in the row
                    for (var prev = 0; prev < i; prev++) {
                        var prevElemTop, prevElemBottom;
                        prevElem = inSection[prop][prev];

                        prevElemTop = prevElem.Element.position().top;
                        prevElemBottom = prevElemTop + prevElem.Element.outerHeight();

                        elemTop = elem.Element.position().top;
                        elemBottom = elemTop + elem.Element.outerHeight();

                        // (elem.start must be between prevElem.start and prevElem.end OR
                        //  elem.end must be between prevElem.start and prevElem.end) AND
                        // (elem.top must be between prevElem.top and prevElem.bottom OR
                        //  elem.bottom must be between prevElem.top and prevElem.bottom)
                        needsNewRow =
                            (
                                (prevElem.start <= elem.start && elem.start <= prevElem.end) ||
                                (prevElem.start <= elem.end && elem.end <= prevElem.end)
                            ) && (
                                (prevElemTop <= elemTop && elemTop <= prevElemBottom) ||
                                (prevElemTop <= elemBottom && elemBottom <= prevElemBottom)
                            );

                        if (needsNewRow) {
                            elem.Element.css('top', prevElemBottom + 1);
                        }
                    }

                    elemBottom = elem.Element.position().top + elem.Element.outerHeight() + 1;

                    if (elemBottom > section.container.height()) {
                        section.container.css('height', elemBottom);
                        section.row.css('height', elemBottom);
                    }
                }
            }
        },

        this.SetupItemEvents = function (itemElem) {
            if (this.Options.Events.ItemClicked) {
                itemElem.click(function (event) {
                    event.preventDefault();
                    CurrentScheduler.Options.Events.ItemClicked.call(CurrentScheduler, $(this).data('item'));
                });
            }

            if (this.Options.Events.ItemMouseEnter) {
                itemElem.mouseenter(function (event) {
                    CurrentScheduler.Options.Events.ItemMouseEnter.call(CurrentScheduler, $(this).data('item'));
                });
            }

            if (this.Options.Events.ItemMouseLeave) {
                itemElem.mouseleave(function (event) {
                    CurrentScheduler.Options.Events.ItemMouseLeave.call(CurrentScheduler, $(this).data('item'));
                });
            }

            if (this.Options.AllowDragging) {
                itemElem.draggable({
                    helper: 'clone',
                    zIndex: 1,
                    appendTo: this.SectionWrap,
                    distance: 5,
                    snap: '.time-sch-section-container',
                    snapMode: 'inner',
                    snapTolerance: 10,
                    drag: function (event, ui) {
                        var item, start, end;
                        var period, periodEnd, minuteDiff;

                        if (this.Options.Events.ItemMovement) {
                            period = this.GetSelectedPeriod();
                            periodEnd = this.GetEndOfPeriod(this.Options.Start, period);
                            minuteDiff = Math.abs(this.Options.Start.diff(periodEnd, 'minutes'));

                            item = $(event.target).data('item');

                            start = moment(this.Options.Start).tsAdd('minutes', minuteDiff * (ui.helper.position().left / this.SectionWrap.width()));
                            end = moment(start).tsAdd('minutes', Math.abs(item.start.diff(item.end, 'minutes')));

                            // If the start is before the start of our calendar, add the offset
                            if (item.start < this.Options.Start) {
                                start.tsAdd('minutes', item.start.diff(this.Options.Start, 'minutes'));
                                end.tsAdd('minutes', item.start.diff(this.Options.Start, 'minutes'));
                            }

                            this.Options.Events.ItemMovement.call(this, item, start, end);
                        }
                    },
                    start: function (event, ui) {
                        $(this).hide();

                        // We only want content to show, not events or resizers
                        ui.helper.children().not('.time-sch-item-content').remove();

                        if (this.Options.Events.ItemMovementStart) {
                            this.Options.Events.ItemMovementStart.call(this);
                        }
                    },
                    stop: function (event, ui) {
                        if ($(this).length) {
                            $(this).show();
                        }

                        if (this.Options.Events.ItemMovementEnd) {
                            this.Options.Events.ItemMovementEnd.call(this);
                        }
                    },
                    cancel: '.time-sch-item-end, .time-sch-item-start, .time-sch-item-event'
                });

                $('.time-sch-section-container').droppable({
                    greedy: true,
                    hoverClass: 'time-sch-droppable-hover',
                    tolerance: 'pointer',
                    drop: function (event, ui) {
                        var item, sectionID, start, end;
                        var period, periodEnd, minuteDiff;

                        period = this.GetSelectedPeriod();
                        periodEnd = this.GetEndOfPeriod(this.Options.Start, period);
                        minuteDiff = Math.abs(this.Options.Start.diff(periodEnd, 'minutes'));

                        item = ui.draggable.data('item');
                        sectionID = $(this).data('section').id;

                        start = moment(this.Options.Start).tsAdd('minutes', minuteDiff * (ui.helper.position().left / $(this).width()));
                        end = moment(start).tsAdd('minutes', Math.abs(item.start.diff(item.end, 'minutes')));

                        // If the start is before the start of our calendar, add the offset
                        if (item.start < this.Options.Start) {
                            start.tsAdd('minutes', item.start.diff(this.Options.Start, 'minutes'));
                            end.tsAdd('minutes', item.start.diff(this.Options.Start, 'minutes'));
                        }

                        // Append original to this section and reposition it while we wait
                        ui.draggable.appendTo($(this));
                        ui.draggable.css({
                            left: ui.helper.position().left - $(this).position().left,
                            top: ui.helper.position().top - $(this).position().top
                        });

                        if (this.Options.DisableOnMove) {
                            if (ui.draggable.data('uiDraggable')) {
                                ui.draggable.draggable('disable');
                            }
                            if (ui.draggable.data('uiResizable')) {
                                ui.draggable.resizable('disable');
                            }
                        }
                        ui.draggable.show();

                        if (this.Options.Events.ItemDropped) {
                            // Time for a hack, JQueryUI throws an error if the draggable is removed in a drop
                            setTimeout(function () {
                                this.Options.Events.ItemDropped.call(this, item, sectionID, start, end);
                            }, 0);
                        }
                    }
                });
            }

            if (this.Options.AllowResizing) {
                var foundHandles = null;

                if (itemElem.find('.time-sch-item-start').length && itemElem.find('.time-sch-item-end').length) {
                    foundHandles = 'e, w';
                }
                else if (itemElem.find('.time-sch-item-start').length) {
                    foundHandles = 'w';
                }
                else if (itemElem.find('.time-sch-item-end').length) {
                    foundHandles = 'e';
                }

                if (foundHandles) {
                    itemElem.resizable({
                        handles: foundHandles,
                        resize: function (event, ui) {
                            var item, start, end;
                            var period, periodEnd, minuteDiff;

                            if (this.Options.Events.ItemMovement) {
                                period = this.GetSelectedPeriod();
                                periodEnd = this.GetEndOfPeriod(this.Options.Start, period);
                                minuteDiff = Math.abs(this.Options.Start.diff(periodEnd, 'minutes'));

                                item = $(this).data('item');

                                if (ui.position.left !== ui.originalPosition.left) {
                                    // Left handle moved

                                    start = moment(this.Options.Start).tsAdd('minutes', minuteDiff * ($(this).position().left / this.SectionWrap.width()));
                                    end = item.end;
                                }
                                else {
                                    // Right handle moved

                                    start = item.start;
                                    end = moment(this.Options.Start).tsAdd('minutes', minuteDiff * (($(this).position().left + $(this).width()) / this.SectionWrap.width()));
                                }

                                this.Options.Events.ItemMovement.call(this, item, start, end);
                            }
                        },
                        start: function (event, ui) {
                            // We don't want any events to show
                            $(this).find('.time-sch-item-event').hide();

                            if (this.Options.Events.ItemMovementStart) {
                                this.Options.Events.ItemMovementStart.call(this);
                            }
                        },
                        stop: function (event, ui) {
                            var item, start, end;
                            var period, periodEnd, minuteDiff, section;
                            var $this;

                            $this = $(this);

                            period = this.GetSelectedPeriod();
                            periodEnd = this.GetEndOfPeriod(this.Options.Start, period);
                            minuteDiff = Math.abs(this.Options.Start.diff(periodEnd, 'minutes'));

                            item = $this.data('item');

                            if (ui.position.left !== ui.originalPosition.left) {
                                // Left handle moved

                                start = moment(this.Options.Start).tsAdd('minutes', minuteDiff * ($this.position().left / this.SectionWrap.width()));
                                end = item.end;
                            }
                            else {
                                // Right handle moved

                                start = item.start;
                                end = moment(this.Options.Start).tsAdd('minutes', minuteDiff * (($this.position().left + $this.width()) / this.SectionWrap.width()));
                            }

                            if (this.Options.DisableOnMove) {
                                if ($this.data('uiDraggable')) {
                                    $this.draggable('disable');
                                }
                                if ($this.data('uiResizable')) {
                                    $this.resizable('disable');
                                }

                                $this.find('.time-sch-item-event').show();
                            }

                            if (this.Options.Events.ItemMovementEnd) {
                                this.Options.Events.ItemMovementEnd.call(this);
                            }

                            if (this.Options.Events.ItemResized) {
                                this.Options.Events.ItemResized.call(this, item, start, end);
                            }
                        }
                    });
                }
            }

            if (this.Options.Events.ItemEventClicked) {
                itemElem.find('.time-sch-item-event').click(function (event) {
                    var itemElem = $(this).closest('.time-sch-item');

                    event.preventDefault();
                    this.Options.Events.ItemEventClicked.call(this, $(this).data('event'), itemElem.data('item'));
                });
            }
            if (this.Options.Events.ItemEventMouseEnter) {
                itemElem.find('.time-sch-item-event').mouseenter(function (event) {
                    var itemElem = $(this).closest('.time-sch-item');

                    event.preventDefault();
                    this.Options.Events.ItemEventClicked.call(this, $(this).data('event'), itemElem.data('item'));
                });
            }
            if (this.Options.Events.ItemEventMouseLeave) {
                itemElem.find('.time-sch-item-event').mouseleave(function (event) {
                    var itemElem = $(this).closest('.time-sch-item');

                    event.preventDefault();
                    this.Options.Events.ItemEventClicked.call(this, $(this).data('event'), itemElem.data('item'));
                });
            }
        },

        /* Call this with "true" as override, and sections will be reloaded. Otherwise, cached sections will be used */
        this.FillSections = function (override) {
            if (!this.CachedSectionResult || override) {
                this.Options.GetSections.call(this, this.FillSections_Callback.bind(this));
            }
            else {
                this.FillSections_Callback(this.CachedSectionResult);
            }
        },

        this.FillSections_Callback = function (obj) {
            this.CachedSectionResult = obj;

            this.CreateSections(obj);
            this.FillSchedule();
        },

        this.FillSchedule = function () {
            var period, end;

            period = this.GetSelectedPeriod();
            end = this.GetEndOfPeriod(this.Options.Start, period);

            this.Options.GetSchedule.call(this, this.FillSchedule_Callback.bind(this), this.Options.Start, end);
        },

        this.FillSchedule_Callback = function (obj) {
            this.CachedScheduleResult = obj;
            this.CreateItems(obj);
        },

        this.FillHeader = function () {
            var durationString, title, periodContainer, timeContainer, periodButton, timeButton;
            var selectedPeriod, end, period;

            periodContainer = $(document.createElement('div'))
                .addClass('time-sch-period-container');

            timeContainer = $(document.createElement('div'))
                .addClass('time-sch-time-container');

            title = $(document.createElement('div'))
                .addClass('time-sch-title');

            this.HeaderWrap
                .empty()
                .append(periodContainer, timeContainer, title);

            selectedPeriod = this.GetSelectedPeriod();
            end = this.GetEndOfPeriod(this.Options.Start, selectedPeriod);

            // Header needs a title
            // We take away 1 minute 
            if (this.Options.ShowTitle)
                title.text(this.Options.Start.format(this.Options.HeaderFormat) + ' - ' + end.tsAdd('minutes', -1).format(this.Options.HeaderFormat));

            if (this.Options.ShowPeriods)
            {
                for (var i = 0; i < this.Options.Periods.length; i++) {
                    period = this.Options.Periods[i];

                    $(document.createElement('a'))
                        .addClass('time-sch-period-button time-sch-button')
                        .addClass(period.Name === selectedPeriod.Name ? 'time-sch-selected-button' : '')
                        .attr('href', '#')
                        .append(period.Label)
                        .data('period', period)
                        .click(this.Period_Clicked)
                        .appendTo(periodContainer);
                }
            }

            if (this.Options.ShowGoto) {
                $(document.createElement('a'))
                    .addClass('time-sch-time-button time-sch-time-button-goto time-sch-button')
                    .attr({
                        href: '#',
                        title: this.Options.Text.GotoButtonTitle
                    })
                    .append(this.Options.Text.GotoButton)
                    .click(this.GotoTimeShift_Clicked)
                    .appendTo(timeContainer);
            }

            if (this.Options.ShowToday) {
                $(document.createElement('a'))
                    .addClass('time-sch-time-button time-sch-time-button-today time-sch-button')
                    .attr({
                        href: '#',
                        title: this.Options.Text.TodayButtonTitle
                    })
                    .append(this.Options.Text.TodayButton)
                    .click(this.TimeShift_Clicked)
                    .appendTo(timeContainer);
            }

            if (this.Options.ShowNavigations)
            {
                $(document.createElement('a'))
                    .addClass('time-sch-time-button time-sch-time-button-prev time-sch-button')
                    .attr({
                        href: '#',
                        title: this.Options.Text.PrevButtonTitle
                    })
                    .append(this.Options.Text.PrevButton)
                    .click(this.TimeShift_Clicked)
                    .appendTo(timeContainer);

                $(document.createElement('a'))
                    .addClass('time-sch-time-button time-sch-time-button-next time-sch-button')
                    .attr({
                        href: '#',
                        title: this.Options.Text.NextButtonTitle
                    })
                    .append(this.Options.Text.NextButton)
                    .click(this.TimeShift_Clicked)
                    .appendTo(timeContainer);
            }
        },

        this.GotoTimeShift_Clicked = function (event) {
            event.preventDefault();

            $(document.createElement('input'))
                .attr('type', 'text')
                .css({
                    position: 'absolute',
                    left: 0,
                    bottom: 0
                })
                .appendTo($(this))
                .datepicker({
                    onClose: function () {
                        $(this).remove();
                    },
                    onSelect: function (date) {
                        this.Options.Start = moment(date);
                        this.Init();
                    },
                    defaultDate: this.Options.Start.toDate()
                })
                .datepicker('show')
                .hide();
        },
        this.TimeShift_Clicked = function (event) {
            var period;

            event.preventDefault();
            period = this.GetSelectedPeriod();

            if ($(this).is('.time-sch-time-button-today')) {
                this.Options.Start = moment().startOf('day');
            }
            else if ($(this).is('.time-sch-time-button-prev')) {
                this.Options.Start.tsAdd('minutes', period.TimeframeOverall * -1);
            }
            else if ($(this).is('.time-sch-time-button-next')) {
                this.Options.Start.tsAdd('minutes', period.TimeframeOverall);
            }

            this.Init();
        },

        /* Selects the period with the given name */
        this.SelectPeriod = function (name) {
            this.Options.SelectedPeriod = name;
            this.Init();
        },

        this.Period_Clicked = function (event) {
            event.preventDefault();
            this.SelectPeriod($(this).data('period').Name);
        }
    };
});