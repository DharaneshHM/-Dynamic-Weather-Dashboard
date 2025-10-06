document.addEventListener('DOMContentLoaded', () => {
    const apiKey = "f6c2a2f8ab5d7c2777cd767bd3a0122e";

    // --- STATE VARIABLES ---
    let currentWeatherData = {};
    let hourlyForecastData = [];
    let isCelsius = true;

    // --- DOM ELEMENT SELECTORS ---
    const locationNameEl = document.querySelector('.location-name');
    const currentDateEl = document.querySelector('.current-date-display');
    const currentTimeEl = document.querySelector('.current-time-display');
    const sunriseSunsetEl = document.querySelector('.sunrise-sunset');
    const tempEl = document.querySelector('.current-temp h1');
    const conditionEl = document.querySelector('.current-temp .weather-condition');
    const humidityValEl = document.querySelector('.humidity-card .value');
    const humidityLevels = document.querySelectorAll('.humidity-scale .level');
    const windSpeedEl = document.querySelector('.wind-card .wind-speed');
    const precipitationValEl = document.querySelector('.precipitation-card .value');
    const feelsLikeValEl = document.querySelector('.feels-like-card .value');
    const feelsLikeBar = document.querySelector('.feels-like-card .current-point');
    const chanceRainValEl = document.querySelector('.chance-rain-card .value');
    const citySearchInput = document.getElementById('city-search-input');
    const citySearchBtn = document.getElementById('city-search-btn');
    const tempToggleSwitch = document.querySelector('.switch input');
    const hourlyDetailsContainer = document.querySelector('.hourly-details');

    // --- TEMPERATURE CONVERSION ---
    const celsiusToFahrenheit = (celsius) => (celsius * 9 / 5) + 32;

    const updateTemperatures = () => {
        if (!currentWeatherData.main) return;
        const tempC = currentWeatherData.main.temp;
        const feelsLikeC = currentWeatherData.main.feels_like;
        if (isCelsius) {
            tempEl.textContent = `${Math.round(tempC)}°`;
            feelsLikeValEl.textContent = `${Math.round(feelsLikeC)}°`;
        } else {
            tempEl.textContent = `${Math.round(celsiusToFahrenheit(tempC))}°`;
            feelsLikeValEl.textContent = `${Math.round(celsiusToFahrenheit(feelsLikeC))}°`;
        }
        updateFeelsLikeBar(feelsLikeC, 0, 50);
        updateHourlyForecastUI();
    };

    // --- API FETCHING ---
    const fetchWeatherAndForecast = async (lat, lon, cityName = null) => {
        try {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) throw new Error(cityName ? `Could not find weather for "${cityName}".` : 'Weather data not found.');
            currentWeatherData = await weatherResponse.json();

            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) throw new Error('Could not fetch hourly forecast data.');
            const forecastData = await forecastResponse.json();
            hourlyForecastData = forecastData.list.slice(0, 8);

            updateUI(currentWeatherData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert(error.message);
        }
    };

    const fetchByCoords = async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherAndForecast(latitude, longitude);
    };

    const fetchByCity = async (city) => {
        const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
        try {
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            if (data.length === 0) throw new Error(`Could not find coordinates for "${city}".`);
            const { lat, lon } = data[0];
            await fetchWeatherAndForecast(lat, lon, city);
        } catch (error) {
            console.error('Error fetching city coordinates:', error);
            alert(error.message);
        }
    };

    // --- UI UPDATE ---
    const updateUI = (data) => {
        locationNameEl.innerHTML = `<i class="fas fa-location-dot"></i> ${data.name}, ${data.sys.country}`;
        const sunsetTime = formatTime(data.sys.sunset);
        sunriseSunsetEl.innerHTML = `<i class="fas fa-sun"></i> ${sunsetTime}`;

        const weatherIcon = getWeatherIcon(data.weather[0].main);
        conditionEl.innerHTML = `<i class="fas ${weatherIcon.icon}" style="color: ${weatherIcon.color};"></i> ${data.weather[0].main}`;

        humidityValEl.textContent = `${data.main.humidity}%`;
        updateHumidityStatus(data.main.humidity);
        windSpeedEl.innerHTML = `${data.wind.speed.toFixed(1)} <small>KM/H</small>`;
        const rainVolume = data.rain ? data.rain['1h'] : 0;
        precipitationValEl.innerHTML = `${rainVolume.toFixed(1)} <small>MM</small>`;

        const maxPop = hourlyForecastData.reduce((max, hour) => Math.max(max, hour.pop), 0);
        chanceRainValEl.textContent = `${Math.round(maxPop * 100)}%`;

        updateTemperatures();
    };

    const updateHourlyForecastUI = () => {
        if (hourlyForecastData.length === 0) return;
        hourlyDetailsContainer.innerHTML = '';
        const now = { dt_txt: 'Now', main: { temp: currentWeatherData.main.temp }, weather: [currentWeatherData.weather[0]], pop: hourlyForecastData.length > 0 ? hourlyForecastData[0].pop : 0 };
        const allHours = [now, ...hourlyForecastData.slice(0, 7)];

        allHours.forEach(item => {
            const hour = item.dt_txt === 'Now' ? 'Now' : new Date(item.dt_txt).getHours() + ':00';
            const temp = isCelsius ? Math.round(item.main.temp) : Math.round(celsiusToFahrenheit(item.main.temp));
            const icon = getWeatherIcon(item.weather[0].main);
            const precipValue = Math.round(item.pop * 100);

            const hourEl = document.createElement('div');
            hourEl.className = 'hour-item';
            hourEl.innerHTML = `<p>${hour}</p><i class="fas ${icon.icon}" style="color: ${icon.color};"></i><p>${temp}°</p><span>${precipValue}%</span>`;
            hourlyDetailsContainer.appendChild(hourEl);
        });
    };

    // --- HELPER FUNCTIONS ---
    const updateHumidityStatus = (humidity) => {
        humidityLevels.forEach(level => level.classList.remove('active'));
        if (humidity < 40) {
            document.querySelector('.humidity-scale .good').classList.add('active');
        } else if (humidity <= 70) {
            document.querySelector('.humidity-scale .normal').classList.add('active');
        } else {
            document.querySelector('.humidity-scale .bad').classList.add('active');
        }
    };

    const updateFeelsLikeBar = (temp, min, max) => {
        const percentage = Math.max(0, Math.min(100, ((temp - min) / (max - min)) * 100));
        feelsLikeBar.style.left = `${percentage}%`;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const updateDateTime = () => {
        const now = new Date();
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'short' };
        currentDateEl.textContent = `Today ${now.toLocaleString('en-US', optionsDate)}`;
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
        currentTimeEl.innerHTML = `<i class="fas fa-clock"></i> ${now.toLocaleTimeString('en-US', optionsTime)}`;
    };

    const getWeatherIcon = (condition) => {
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('clear')) return { icon: 'fa-sun', color: '#f39c12' };
        if (conditionLower.includes('clouds')) return { icon: 'fa-cloud', color: '#7f8c8d' };
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return { icon: 'fa-cloud-showers-heavy', color: '#3498db' };
        if (conditionLower.includes('thunderstorm')) return { icon: 'fa-bolt', color: '#9b59b6' };
        if (conditionLower.includes('snow')) return { icon: 'fa-snowflake', color: '#ecf0f1' };
        if (conditionLower.includes('mist') || conditionLower.includes('fog')) return { icon: 'fa-smog', color: '#bdc3c7' };
        return { icon: 'fa-question-circle', color: '#7f8c8d' };
    };

    const handleSearch = () => {
        const city = citySearchInput.value.trim();
        if (city) fetchByCity(city);
        citySearchInput.value = "";
    };

    // --- EVENT LISTENERS ---
    citySearchBtn.addEventListener('click', handleSearch);
    citySearchInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') handleSearch(); });
    tempToggleSwitch.addEventListener('change', () => { isCelsius = !tempToggleSwitch.checked; updateTemperatures(); });

    // --- INITIALIZATION ---
    const getLocationAndWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(fetchByCoords, () => fetchByCity('London'));
        } else {
            fetchByCity('London');
        }
    };

    updateDateTime();
    setInterval(updateDateTime, 60000);
    getLocationAndWeather();
});