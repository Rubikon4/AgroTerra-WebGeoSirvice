// Инициализация карты
const map = L.map('map').setView([53.5, 39.5], 6);

// Добавление фона карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Глобальный popup
const globalPopup = document.getElementById('weather-popup');

// Кэш данных погоды
const weatherCache = {};

// Загрузка и обработка данных
async function fetchData() {
    try {
        // Сначала загружаем GeoJSON данные и метеоданные
        const geoData = await fetchGeoData();
        const weatherData = await fetchWeatherData();

        if (!weatherData) {
            alert('Не удалось загрузить метеоданные');
            return;
        }

        // Кэшируем полученные данные
        Object.assign(weatherCache, weatherData);
        console.log('Погода загружена и закеширована:', weatherCache);

        // После этого добавляем контуры и маркеры на карту
        initializeMap(geoData);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Загрузка данных GeoJSON (границы)
async function fetchGeoData() {
    const response = await fetch('russianGeo.geojson');
    return response.json();
}

// Загрузка метеоданных
async function fetchWeatherData() {
    return fetchAllWeatherData();
}

// Инициализация карты и маркеров
function initializeMap(geoData) {
    // Добавление GeoJSON данных на карту (контуры)
    L.geoJSON(geoData, {
        style: {
            color: '#3388ff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.1
        },
        onEachFeature: function (feature, layer) {
            console.log('Добавляем регион:', feature.properties.name);  // Проверка, добавляются ли регионы
        }
    }).addTo(map);

    // Добавление маркеров
    geoData.features.forEach(feature => {
        const center = getRegionCenter(feature.geometry.coordinates, feature.geometry.type);
        const regionData = getRegionKey(feature.properties.shapeName);
        const marker = L.marker(center).addTo(map);

        // Навешиваем обработчик на клик
        marker.on('click', () => handleMarkerClick(regionData));
    });
}

// Обработка клика на маркер
async function handleMarkerClick(regionData) {
    const weather = weatherCache[regionData.key];  // Загружаем данные о погоде из кэша
    const popupContent = await getPopupContent(regionData, weather);

    showGlobalPopup(popupContent);
    setupExpandHandler(regionData, weather, popupContent);  // Передаем regionData и weather
}


// Получение контента для popup
async function getPopupContent(regionData, weather) {
    if (!weather) {
        return `<b>${regionData.name}</b><br>Данные недоступны`;
    }

    const daily = weather.data.daily;
    const hourly = weather.data.hourly;

    const temp = daily.temperatureMax[0];
    const rain = daily.precipitationSum[0];
    const wind = hourly.windSpeed[0];

    return `
        <b>${regionData.name}</b><br>
        Температура макс: ${temp} °C<br>
        Осадки: ${rain} мм<br>
        Ветер: ${wind} км/ч<br>
        <button id="expand-btn">Подробнее</button>
    `;
}

// Показать popup с содержимым
function showGlobalPopup(html) {
    globalPopup.innerHTML = html;
    globalPopup.style.display = 'block';
    console.log('Отображаем popup с содержимым:', html);
}

// Разделение функционала кнопки "Подробнее"
function setupExpandHandler(regionData, weather, popupContent) {
    setTimeout(() => {
        const btn = document.getElementById('expand-btn');
        console.log('Ищу кнопку "Подробнее":', btn);

        if (btn) {
            btn.addEventListener('click', () => {
                console.log('Нажали на кнопку "Подробнее"');

                const fullContent = generateFullContent(regionData, weather);
                showGlobalPopup(fullContent);

                setupCollapseHandler(popupContent, regionData, weather);  // Передаем regionData и weather
            });
        }
    }, 50);
}


// Генерация расширенного контента
function generateFullContent(regionData, weather) {
    const daily = weather.data.daily;
    const hourly = weather.data.hourly;

    return `
        <b>${regionData.name}</b><br>
        Температура макс: ${daily.temperatureMax[0]} °C<br>
        Осадки: ${daily.precipitationSum[0]} мм<br>
        Ветер: ${hourly.windSpeed[0]} км/ч<br>
        Давление: ${hourly.pressure[0]} гПа<br>
        Влажность: ${hourly.humidity[0]} %<br>
        Облачность: ${hourly.cloudCover[0]} %<br>
        Видимость: ${hourly.visibility[0]} м<br>
        Индекс УФ: ${daily.uvIndexMax[0]}<br>
        <button id="collapse-btn">Скрыть</button>
    `;
}

// Разделение функционала кнопки "Скрыть"
function setupCollapseHandler(popupContent, regionData, weather) {
    setTimeout(() => {
        const closeBtn = document.getElementById('collapse-btn');
        console.log('Ищу кнопку "Скрыть":', closeBtn);

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Скрыли расширенную информацию');
                showGlobalPopup(popupContent);
                setupExpandHandler(regionData, weather, popupContent);  // Передаем regionData и weather
            });
        }
    }, 50);
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

// Запуск загрузки данных
fetchData();