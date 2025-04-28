// Получение данных с backend
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
