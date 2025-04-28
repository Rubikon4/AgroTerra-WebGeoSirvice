// Инициализация карты
const map = L.map('map').setView([53.5, 39.5], 6);

// Добавление базового слоя карты
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Загрузка GeoJSON с контурами областей
fetch('russianGeo.geojson')
    .then(response => response.json())
    .then(geoData => {
        // Добавляем контуры
        L.geoJSON(geoData, {
            style: {
                color: '#3388ff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.1
            }
        }).addTo(map);

        // Добавляем маркеры в центры областей
        geoData.features.forEach(feature => {
            const center = getRegionCenter(feature.geometry.coordinates, feature.geometry.type);

            const regionName = feature.properties.shapeName;
            const regionKey = getRegionKey(regionName); // Для запроса на backend

            const marker = L.marker(center).addTo(map);

            marker.on('click', async () => {
                const weather = await fetchWeatherData(regionKey);

                if (weather) {
                    const daily = weather.data.daily;
                    const hourly = weather.data.hourly;

                    const temp = daily.temperatureMax[0];
                    const rain = daily.precipitationSum[0];
                    const wind = hourly.windSpeed[0];

                    marker.bindPopup(
                        `<b>${regionName}</b><br>
                        Температура макс: ${temp} °C<br>
                        Осадки: ${rain} мм<br>
                        Ветер: ${wind} км/ч`
                    ).openPopup();
                } else {
                    marker.bindPopup(`<b>${regionName}</b><br>Данные недоступны`).openPopup();
                }
            });
        });
    });

// Функция расчёта центра области (приближённо)
function getRegionCenter(coordinates, type) {   // функция для учета обоих вариантов полигональности
    let latSum = 0, lonSum = 0, count = 0;

    if (type === 'Polygon') {
        const ring = coordinates[0]; // первое кольцо
        ring.forEach(point => {
            lonSum += point[0];
            latSum += point[1];
            count++;
        });
    } else if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => { // каждый многоугольник
            const ring = polygon[0];     // его первое кольцо
            ring.forEach(point => {
                lonSum += point[0];
                latSum += point[1];
                count++;
            });
        });
    }

    const lat = latSum / count;
    const lon = lonSum / count;
    return [lat, lon];
}

/*
function getRegionCenter(coordinates) { // функция для расчета полигонального geojson
    const ring = coordinates[0]; // Берём первое (и единственное) кольцо

    let latSum = 0, lonSum = 0, count = 0;
    ring.forEach(point => {
        lonSum += point[0];
        latSum += point[1];
        count++;
    });

    const lat = latSum / count;
    const lon = lonSum / count;
    return [lat, lon];
}
*/ 
/*
function getRegionCenter(coordinates) { // функция для расчета мультиполигонального geojson
    let latSum = 0, lonSum = 0, count = 0;
    
    coordinates.forEach(polygon => { // перебираем каждый многоугольник
        polygon.forEach(ring => {    // перебираем каждое кольцо
            ring.forEach(point => {  // перебираем каждую точку
                lonSum += point[0];
                latSum += point[1];
                count++;
            });
        });
    });
    
    const lat = latSum / count;
    const lon = lonSum / count;
    return [lat, lon];
}
*/

// Преобразование названий областей для backend
function getRegionKey(regionName) {
    const mapping = {
        "Ryazan Oblast": "ryazan",
        "Tula Oblast": "tula",
        "Penza Oblast": "penza",
        "Oryol Oblast": "orel",
        "Lipetsk Oblast": "lipetsk",
        "Tambov Oblast": "tambov",
        "Kursk Oblast": "kursk"
    };
    return mapping[regionName];
}