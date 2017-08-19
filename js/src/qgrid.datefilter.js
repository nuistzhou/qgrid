define([
    'jquery',
    'handlebars',
    './qgrid.filterbase.js',
    'jquery-ui'
], function ($, handlebars, filter_base) {
  "use strict";

  var DateFilter = function(field, column_type, widget_model){
    this.base = filter_base.FilterBase;
    this.base(field, column_type, widget_model);
  }
  DateFilter.prototype = new filter_base.FilterBase;

  DateFilter.prototype.get_filter_template = function(){
    return handlebars.compile(
      "<div class='date-range-filter grid-filter dropdown-menu {{type}}-filter'>" +
        "<h3 class='popover-title'>" +
          "<div class='dropdown-title'>Filter by {{name}}</div>" +
          "<i class='fa fa-times icon-remove close-button'/>" +
        "</h3>" +
        "<div class='dropdown-body'>" +
          "<input class='datepicker ignore start-date'/>" +
          "<span class='to'>to</span>" +
          "<input class='datepicker ignore end-date'/>" +
        "</div>" +
        "<div class='dropdown-footer'>" +
          "<a class='reset-link' href='#'>Reset</a>"+
        "</div>" +
      "</div>"
    );
  }

  DateFilter.prototype.update_min_max = function(col_info){
    this.min_value = col_info['filter_min'];
    this.max_value = col_info['filter_max'];

    var filter_info = col_info['filter_info'];
    if (filter_info){
      this.filter_start_date = filter_info['min'] || this.min_value;
      this.filter_end_date = filter_info['max'] || this.max_value;
    } else {
      this.filter_start_date = this.min_value;
      this.filter_end_date = this.max_value;
    }

    this.has_multiple_values = this.min_value != this.max_value;
    $.proxy(this.base.prototype.show_filter.call(this), this);
  };

  DateFilter.prototype.reset_filter = function(){
    this.start_date_control.datepicker("setDate", this.min_date);
    this.end_date_control.datepicker("setDate", this.max_date);

    this.start_date_control.datepicker("option", "maxDate", this.max_date);
    this.end_date_control.datepicker("option", "minDate", this.min_date);

    this.filter_start_date = null;
    this.filter_end_date = null;
  };

  DateFilter.prototype.initialize_controls = function(){
    $.proxy(this.base.prototype.initialize_controls.call(this), this);
    this.min_date = new Date(this.min_value);
    this.max_date = new Date(this.max_value);

    this.start_date_control = this.filter_elem.find(".start-date");
    this.end_date_control = this.filter_elem.find(".end-date");
    
    var date_options = {
      "dayNamesMin": ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      "prevText": "",
      "nextText": "",
      minDate: this.min_date,
      maxDate: this.max_date,
      beforeShow: (input, inst) => {
        // align the datepicker with the right edge of the input it drops down from
        var clicked_elem = $(inst);
        clicked_elem.closest(".dropdown-menu").addClass("calendar-open");

        var widget = clicked_elem.datepicker('widget');
        widget.css('margin-left', $(input).outerWidth() - widget.outerWidth());
        widget.addClass("stay-open-on-click filter-child-elem");
      },
      onSelect: (dateText, instance) => {
        // pull the values from the datepickers
        var start_date_string = this.start_date_control.val();
        var end_date_string = this.end_date_control.val();

        var start_date = new Date(start_date_string);

        // use the last millisecond of the end_date (1000ms * 60s * 60m * 24h)
        var end_date = new Date(
            (new Date(end_date_string).getTime()) + (1000 * 60 * 60 * 24) - 1
        );

        this.filter_start_date = start_date.getTime();
        this.filter_end_date = end_date.getTime();

        $(this).trigger("filter_changed", this.get_filter_info());

        var datepicker = $(instance.input);
        setTimeout((function(){datepicker.blur();}), 100);

        if (datepicker.hasClass("start-date")){
          // update the end date's min
          this.end_date_control.datepicker("option", "minDate", start_date);
        }
        if (datepicker.hasClass("end-date")){
          // update the start date's max
          this.start_date_control.datepicker("option", "maxDate", new Date(end_date_string));
        }
      }
    };

    this.filter_elem.find(".datepicker").datepicker(date_options);

    this.start_date_control.datepicker("setDate", this.min_date);
    this.end_date_control.datepicker("setDate", this.max_date);
  };

  DateFilter.prototype.get_filter_info = function(){
      return {
        "field": this.field,
        "type": "date",
        "min": this.filter_start_date,
        "max": this.filter_end_date
      }
  };

  DateFilter.prototype.is_active = function(){
    return this.filter_start_date || this.filter_end_date;
  };

  DateFilter.prototype.include_item = function(item){
    var cur_row_date = new Date(item[this.field]);
    if (this.filter_start_date){
      if (cur_row_date < new Date(this.filter_start_date)){
        return false;
      }
    }

    if (this.filter_end_date){
      if (cur_row_date > new Date(this.filter_end_date)){
        return false;
      }
    }

    return true;
  };

  return {'DateFilter': DateFilter}
});
