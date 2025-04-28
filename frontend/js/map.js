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
            const center = getRegionCenter(feature.geometry.coordinates);
            const regionName = feature.properties.shapeName;
            console.log(regionName, center) // DELETE AFTER BUG-DETECT
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
/* function getRegionCenter(coordinates) {  // Нерабочий вариант вычисления центра
    const polygon = coordinates[0][0];
    let latSum = 0, lonSum = 0;
    polygon.forEach(point => {
        lonSum += point[0];
        latSum += point[1];
    });
    const lat = latSum / polygon.length;
    const lon = lonSum / polygon.length;
    return [lat, lon];
} */ 
/*function getRegionCenter(coordinates) {   // Рабочая только на Тулу
    const polygon = coordinates[0]; // первое кольцо
    let latSum = 0, lonSum = 0, count = 0;

    polygon.forEach(ring => { // точки кольца
        lonSum += ring[0];
        latSum += ring[1];
        count++;
    });

    const lat = latSum / count;
    const lon = lonSum / count;
    return [lat, lon];
}*/ 
function getRegionCenter(coordinates) {
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