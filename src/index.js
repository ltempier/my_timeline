"use strict";

class MyTimeline {

    constructor(selector) {
        this._oldSliderValue = null;
        this.$container = null;
        this.$slider = null;
        this.$dots = null;
        this.slider = {};

        if (selector && $(selector).length) {
            this._init(selector)
        } else
            throw new Error('timeline selector doesn\'t exist')
    }

    _init(selector) {
        this.$container = $(selector);
        this.$container.addClass('my-timeline-container');
        this.$container.empty();

        this.$slider = $('<input type="range" class="slider">');

        var timeout, self = this;
        this.$slider.on('input', function () {
            var sliderValue = this.valueAsNumber || parseInt(this.value);
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(self._onSliderChange(sliderValue), 2)
        });

        this.$dots = $('<table class="dots-table"></table>');
        var $dotsContainer = $('<div class="dots-table-container"></div>');
        $dotsContainer.append(this.$dots);
        this.$container.append($dotsContainer);
        this.$container.append(this.$slider);

        $(window).resize(this._refreshDots.bind(this));
    }

    _refreshDots(force) {

        var sliderWidth = this.$slider.width();
        if (!force && sliderWidth === this.slider.width)
            return;
        this.slider.width = sliderWidth;

        const minWidth = 80;
        const maxDotCount = Math.ceil(sliderWidth / minWidth);
        const deltaSliderTimestamp = (this.slider.max - this.slider.min);
        const units = [
            {
                name: 'years',
                step: 31536000000,
                format: 'YYYY'
            },
            {
                name: 'months',
                step: 2592000000,
                format: deltaSliderTimestamp > 31536000000 ? 'MMM YY' : 'MMM'
            },
            {
                name: 'days',
                step: 86400000,
                format: 'YYYY-MM-DD'
            },
            {
                name: 'hours',
                step: 3600000,
                format: 'HH:mm'
            },
            {
                name: 'minutes',
                step: 60000,
                format: 'HH:mm'
            }
        ];

        var dotUnit = units[0];
        units.some(function (unit) {
            if (deltaSliderTimestamp >= (unit.step * maxDotCount)) {
                return true
            }
            dotUnit = unit;
            return false
        });

        var current = moment(this.slider.min);
        var dots = [];

        while (current.valueOf() <= this.slider.max) {

            let next = moment(current).startOf(dotUnit.name).add(1, dotUnit.name);
            let width100 = (next.diff(current) / deltaSliderTimestamp) * 100;
            dots.push({
                text: current.format(dotUnit.format),
                width: width100 + "%"
            });
            current = next
        }

        this.$dots.empty();
        dots.forEach((dot) => {
            var $td = $('<td></td>');
            $td.html(dot.text);
            $td.width(dot.width);
            this.$dots.append($td)
        });
    }

    _refreshSlider() {
        this.$slider.attr('min', this.slider.min);
        this.$slider.attr('max', this.slider.max);
        this.$slider.attr('value', this.slider.value);
        this.$slider.attr('step', this.slider.step);
    }

    _onSliderChange(sliderValue) {
        var minDelta, buffer;
        this.slider.values.some(function (value) {
            var delta = Math.abs(value.timestamp - sliderValue);
            if (minDelta == null || delta < minDelta) {
                minDelta = delta;
                buffer = value
            }
            else if (delta > minDelta)
                return true;
            return false;
        });

        if (this._oldSliderValue && this._oldSliderValue == buffer)
            return;
        this._oldSliderValue = buffer;

        this.onSliderChange(buffer)
    }

    setValues(values) {
        var buffer = [];
        values.forEach((value) => {
            value.timestamp = value.timestamp || value.time || value.date;
            try {
                value.timestamp = new Date(value.timestamp).getTime();
                buffer.push(value)
            } catch (e) {
                console.error(e)
            }
        });

        if (buffer.length == 0)
            return;

        this.slider = {
            values: buffer.sort(function (value, old) {
                return value.timestamp - old.timestamp
            }),
            min: 0,
            max: 0,
            step: 0,
            value: 0,
            width: this.$slider.width()
        };

        this.slider.min = this.slider.values[0].timestamp;
        this.slider.max = this.slider.values[this.slider.values.length - 1].timestamp;
        this.slider.step = (this.slider.max - this.slider.min) / 1000;
        this.slider.value = this.slider.max;

        this._refreshSlider();
        this._refreshDots(true);
    }

    onSliderChange(value) {
        console.log('TODO surcharge fn')
    }
}

