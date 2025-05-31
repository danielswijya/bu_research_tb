import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapLegend() {
const map = useMap();

useEffect(() => {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <h4 style="margin:0 0 6px;">Legend</h4>
        <div><i style="background: blue; width: 12px; height: 12px; display: inline-block; margin-right: 6px; border-radius: 2px;"></i> Large Market</div>
        <div><i style="background: green; width: 12px; height: 12px; display: inline-block; margin-right: 6px; border-radius: 2px;"></i> Health Facility</div>
        <div><i style="background: red; width: 12px; height: 12px; display: inline-block; margin-right: 6px; border-radius: 2px;"></i> Community (General)</div>
        <div><i style="background: yellow; width: 12px; height: 12px; display: inline-block; margin-right: 6px; border-radius: 2px;"></i> Selected</div>
    `;

    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '6px';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    div.style.fontSize = '13px';

    return div;
    };

    legend.addTo(map);
    return () => legend.remove(); // cleanup on unmount
}, [map]);

return null;
}
