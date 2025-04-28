from flask import Flask, request, jsonify
import requests
from regions import Regions

app = Flask(__name__)

@app.route('/api/weather', methods=['GET'])
def GetWeather():
    regionKey = request.args.get('region')
    if not regionKey or regionKey not in Regions:
        return jsonify({"error": "Регион не найден"}), 404

    coords = Regions[regionKey]
    data = FetchOpenMeteoData(coords['lat'], coords['lon'])
    return jsonify({
        "region": coords['name'],
        "data": data
    })

def FetchOpenMeteoData(Lat, Lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": Lat,
        "longitude": Lon,
        "daily": (
            "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max"
        ),
        "hourly": (
            "temperature_2m,apparent_temperature,relative_humidity_2m,"
            "windspeed_10m,winddirection_10m,pressure_msl,cloudcover,"
            "freezing_level_height,visibility"
        ),
        "timezone": "Europe/Moscow"
    }
    response = requests.get(url, params=params)
    data = response.json()

    combinedData = {
        "daily": {
            "time": data.get("daily", {}).get("time", []),
            "temperatureMax": data.get("daily", {}).get("temperature_2m_max", []),
            "temperatureMin": data.get("daily", {}).get("temperature_2m_min", []),
            "precipitationSum": data.get("daily", {}).get("precipitation_sum", []),
            "uvIndexMax": data.get("daily", {}).get("uv_index_max", [])
        },
        "hourly": {
            "time": data.get("hourly", {}).get("time", []),
            "temperature": data.get("hourly", {}).get("temperature_2m", []),
            "apparentTemperature": data.get("hourly", {}).get("apparent_temperature", []),
            "humidity": data.get("hourly", {}).get("relative_humidity_2m", []),
            "windSpeed": data.get("hourly", {}).get("windspeed_10m", []),
            "windDirection": data.get("hourly", {}).get("winddirection_10m", []),
            "pressure": data.get("hourly", {}).get("pressure_msl", []),
            "cloudCover": data.get("hourly", {}).get("cloudcover", []),
            "freezingLevel": data.get("hourly", {}).get("freezing_level_height", []),
            "visibility": data.get("hourly", {}).get("visibility", [])
        }
    }

    return combinedData

    
if __name__ == '__main__':
    app.run(debug=True)