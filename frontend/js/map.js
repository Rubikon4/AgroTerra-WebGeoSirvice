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
            const regionData = getRegionKey(feature.properties.shapeName); // key + name (рус)

            const marker = L.marker(center).addTo(map);

            marker.on('click', async () => {
                const weather = await fetchWeatherData(regionData.key);

                if (weather) {
                    const daily = weather.data.daily;
                    const hourly = weather.data.hourly;

                    const temp = daily.temperatureMax[0];
                    const rain = daily.precipitationSum[0];
                    const wind = hourly.windSpeed[0];

                    // Базовый popup с кнопкой
                    const popupContent = `
                        <b>${regionData.name}</b><br>
                        Температура макс: ${temp} °C<br>
                        Осадки: ${rain} мм<br>
                        Ветер: ${wind} км/ч<br>
                        <button class="expand-btn">Подробнее</button>
                    `;

                    marker.bindPopup(popupContent).openPopup();

                    // Обработка кнопки после отрисовки popup
                    marker.on('popupopen', () => {
                        const popupElement = marker.getPopup().getElement();
                        setTimeout(() => {
                            const button = popupElement.querySelector('.expand-btn');
                            if (button) {
                                button.addEventListener('click', () => {
                                    const fullContent = `
                                        <b>${regionData.name}</b><br>
                                        Температура макс: ${temp} °C<br>
                                        Осадки: ${rain} мм<br>
                                        Ветер: ${wind} км/ч<br>
                                        Давление: ${hourly.pressure[0]} гПа<br>
                                        Влажность: ${hourly.humidity[0]} %<br>
                                        Облачность: ${hourly.cloudCover[0]} %<br>
                                        Видимость: ${hourly.visibility[0]} м<br>
                                        Индекс УФ: ${daily.uvIndexMax[0]}
                                    `;
                                    marker.setPopupContent(fullContent);
                                });
                            }
                        }, 50); // небольшая задержка
                    });

                } else {
                    marker.bindPopup(`<b>${regionData.name}</b><br>Данные недоступны`).openPopup();
                }
            });
        });
    });

// Функция расчёта центра области (Polygon + MultiPolygon)
function getRegionCenter(coordinates, type) {
    let latSum = 0, lonSum = 0, count = 0;

    if (type === 'Polygon') {
        const ring = coordinates[0];
        ring.forEach(point => {
            lonSum += point[0];
            latSum += point[1];
            count++;
        });
    } else if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => {
            const ring = polygon[0];
            ring.forEach(point => {
                lonSum += point[0];
                latSum += point[1];
                count++;
            });
        });
    }

    return [latSum / count, lonSum / count];
}

// Преобразование названий областей (key + name)
function getRegionKey(regionName) {
    const mapping = {
        "Ryazan Oblast": { key: "ryazan", name: "Рязанская область" },
        "Tula Oblast": { key: "tula", name: "Тульская область" },
        "Penza Oblast": { key: "penza", name: "Пензенская область" },
        "Oryol Oblast": { key: "orel", name: "Орловская область" },
        "Lipetsk Oblast": { key: "lipetsk", name: "Липецкая область" },
        "Tambov Oblast": { key: "tambov", name: "Тамбовская область" },
        "Kursk Oblast": { key: "kursk", name: "Курская область" }
    };
    return mapping[regionName];
}
