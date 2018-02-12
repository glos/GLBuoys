// utility functions

function unitConversion(value, unit) {
    var newValue;
    var newUnit;
    if (unit === 'celsius') {
        newValue = value * (9 / 5) + 32;
        newUnit = 'fahrenheit';
    } else if (unit === 'm') {
        newValue = value * 3.28084;
        newUnit = 'ft';
    } else if (unit === 'm_s-1') {
        newValue = value * 1.94384;
        newUnit = 'kts';
    } else {
        newValue = value;
        newUnit = unit;
    }
    return [newValue, newUnit];
}
