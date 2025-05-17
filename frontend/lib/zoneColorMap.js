// frontend/lib/zoneColorMap.js
const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink', 'teal'];
let colorIndex = 0;
const colorMap = {};

export function getZoneColor(zona_id) {
if (!colorMap[zona_id]) {
    colorMap[zona_id] = colors[colorIndex % colors.length];
    colorIndex++;
}
return colorMap[zona_id];
}