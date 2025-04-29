// Инициализация карты
const map = L.map('map').setView([53.5, 39.5], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Кэш для метеоданных
const weatherCache = {};

// Создает глобальный popup как отдельный DOM блок
const globalPopup = document.getElementById('weather-popup'); 


// Загрузка границ и погоды
Promise.all([
    fetch('russianGeo.geojson').then(res => res.json()),
    fetchAllWeatherData()
]).then(([geoData, weatherData]) => {
    if (!weatherData) {
        alert('Не удалось загрузить метеоданные');
        return;
    }

    Object.assign(weatherCache, weatherData);
    console.log('Погода загружена и закеширована:', weatherCache);    // проверка в логах

    // Отображает границы
    L.geoJSON(geoData, {
        style: {
            color: '#3388ff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.1
        }
    }).addTo(map);

    // Добавляем маркеры
    geoData.features.forEach(feature => {
        const center = getRegionCenter(feature.geometry.coordinates, feature.geometry.type);
        const regionData = getRegionKey(feature.properties.shapeName);
        const marker = L.marker(center).addTo(map);

        marker.on('click', () => {
            console.log(`Клик по маркеру: ${regionData.name}`);    // проверка в логах
            const weather = weatherCache[regionData.key];

            if (!weather) {
                showGlobalPopup(`<b>${regionData.name}</b><br>Данные недоступны`);
                return;
            }

            const daily = weather.data.daily;
            const hourly = weather.data.hourly;

            const temp = daily.temperatureMax[0];
            const rain = daily.precipitationSum[0];
            const wind = hourly.windSpeed[0];

            // Отображаем базовую информацию и кнопку
            const popupContent = `
                <b>${regionData.name}</b><br>
                Температура макс: ${temp} °C<br>
                Осадки: ${rain} мм<br>
                Ветер: ${wind} км/ч<br>
                <button id="expand-btn">Подробнее</button>
            `;

            showGlobalPopup(popupContent);
            setupExpandHandler(regionData, temp, rain, wind, hourly, daily, popupContent);

            // Таймаут нужен, чтобы DOM успел вставить кнопку
            setTimeout(() => {
                const btn = document.getElementById('expand-btn');
                console.log('Ищу кнопку "Подробнее":', btn);    // проверка в логах

                if (btn) {
                    btn.addEventListener('click', () => {
                        console.log('Нажали на кнопку "Подробнее"');    // проверка в логах

                        const fullContent = `
                            <b>${regionData.name}</b><br>
                            Температура макс: ${temp} °C<br>
                            Осадки: ${rain} мм<br>
                            Ветер: ${wind} км/ч<br>
                            Давление: ${hourly.pressure[0]} гПа<br>
                            Влажность: ${hourly.humidity[0]} %<br>
                            Облачность: ${hourly.cloudCover[0]} %<br>
                            Видимость: ${hourly.visibility[0]} м<br>
                            Индекс УФ: ${daily.uvIndexMax[0]}<br>
                            <button id="collapse-btn">Скрыть</button>
                        `;
                        showGlobalPopup(fullContent);

                        // Повторная навешка для кнопки "Скрыть"
                        setTimeout(() => {
                            const closeBtn = document.getElementById('collapse-btn');
                            if (closeBtn) {
                                closeBtn.addEventListener('click', () => {
                                    console.log('Скрыли расширенную информацию');    // проверка в логах
                                    showGlobalPopup(popupContent);    // вернуть базовый вид
                                });
                            }
                        }, 50);
                    });
                }
            }, 50);
        });
    });
});

// Показать popup с HTML-контентом в логах
function showGlobalPopup(html) {
    globalPopup.innerHTML = html;
    globalPopup.style.display = 'block';
    console.log('Отображаем popup с содержимым:', html);
}

// Центр региона
function getRegionCenter(coordinates, type) {
    let latSum = 0, lonSum = 0, count = 0;

    if (type === 'Polygon') {
        coordinates[0].forEach(point => {
            lonSum += point[0];
            latSum += point[1];
            count++;
        });
    } else if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => {
            polygon[0].forEach(point => {
                lonSum += point[0];
                latSum += point[1];
                count++;
            });
        });
    }

    return [latSum / count, lonSum / count];
}

// Преобразование названий регионов
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

function setupExpandHandler(regionData, temp, rain, wind, hourly, daily, popupContent) {
    setTimeout(() => {
        const btn = document.getElementById('expand-btn');
        console.log('setupExpandHandler → Кнопка "Подробнее":', btn);

        if (btn) {
            btn.addEventListener('click', () => {
                console.log('setupExpandHandler → Нажали на кнопку "Подробнее"');

                const fullContent = `
                    <b>${regionData.name}</b><br>
                    Температура макс: ${temp} °C<br>
                    Осадки: ${rain} мм<br>
                    Ветер: ${wind} км/ч<br>
                    Давление: ${hourly.pressure[0]} гПа<br>
                    Влажность: ${hourly.humidity[0]} %<br>
                    Облачность: ${hourly.cloudCover[0]} %<br>
                    Видимость: ${hourly.visibility[0]} м<br>
                    Индекс УФ: ${daily.uvIndexMax[0]}<br>
                    <button id="collapse-btn">Скрыть</button>
                `;
                showGlobalPopup(fullContent);

                setTimeout(() => {
                    const closeBtn = document.getElementById('collapse-btn');
                    console.log('setupExpandHandler → Кнопка "Скрыть":', closeBtn);

                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            console.log('setupExpandHandler → Скрыли расширенную информацию');
                            showGlobalPopup(popupContent);
                            setupExpandHandler(regionData, temp, rain, wind, hourly, daily, popupContent);
                        });
                    }
                }, 50);
            });
        }
    }, 50);
}
