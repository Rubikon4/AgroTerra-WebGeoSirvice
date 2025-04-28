weather-monitoring/
│
├── backend/
│   ├── app.py               # Основной Flask-сервер
│   ├── requirements.txt     # Зависимости Python (Flask, requests)
│   └── regions.py           # Список координат регионов (например, AgroTerra)
│
├── frontend/
│   ├── index.html           # Основная HTML-страница
│   ├── css/
│   │   └── styles.css       # Стили для карты, графиков и интерфейса
│   └── js/
│       ├── map.js           # Код карты (Leaflet.js)
│       ├── charts.js        # Код для графиков (Chart.js)
│       └── api.js           # Запросы к backend (fetch / axios)
│
└── README.md                # Краткое описание проекта (опционально)