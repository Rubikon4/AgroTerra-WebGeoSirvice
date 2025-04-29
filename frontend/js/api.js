// Получает данные по одному региону
async function fetchWeatherData(regionKey) {
    try {
        const response = await fetch(`/api/weather?region=${regionKey}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return null;
    }
}

// Получает данные по всем регионам
async function fetchAllWeatherData() {
    try {
        const response = await fetch('/api/weather/all');
        if (!response.ok) {
            throw new Error('Ошибка при загрузке метеоданных');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка запроса:', error);
        return null;
    }
}