// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// Global variables
let restaurantsData = [];

// DOM Elements
const restaurantGrid = document.getElementById("restaurantGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const sortBy = document.getElementById("sortBy");
const restaurantCount = document.getElementById("restaurantCount");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

// Filter elements
const searchInput = document.getElementById("searchInput");
const cuisineFilter = document.getElementById("cuisineFilter");
const priceFilter = document.getElementById("priceFilter");
const ratingFilter = document.getElementById("ratingFilter");
const statusFilter = document.getElementById("statusFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const parkingFilter = document.getElementById("parkingFilter");

// API Functions
async function fetchRestaurants() {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch restaurants`);
        }
        const data = await response.json();
        return data.restaurants;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch stats`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    loadDataFromAPI();
    setupEventListeners();
});

function setupEventListeners() {
    if (sortBy) sortBy.addEventListener("change", applyFiltersAndSort);
    if (navToggle) navToggle.addEventListener("click", toggleMobileNav);

    // Filter event listeners
    if (searchInput) searchInput.addEventListener("input", applyFiltersAndSort);
    if (cuisineFilter) cuisineFilter.addEventListener("change", applyFiltersAndSort);
    if (priceFilter) priceFilter.addEventListener("change", applyFiltersAndSort);
    if (ratingFilter) ratingFilter.addEventListener("change", applyFiltersAndSort);
    if (statusFilter) statusFilter.addEventListener("change", applyFiltersAndSort);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearAllFilters);
    if (parkingFilter) parkingFilter.addEventListener("change", applyFiltersAndSort);

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = this.getAttribute("href");
        });
    });

    window.addEventListener("scroll", handleScroll);
}

async function loadDataFromAPI() {
    try {
        showLoading();

        // Load restaurants and stats in parallel
        const [restaurants, stats] = await Promise.all([fetchRestaurants(), fetchStats()]);

        restaurantsData = restaurants;

        displayRestaurants(restaurantsData);
        populateFilters(stats);
        hideLoading();
    } catch (error) {
        console.error("Error loading data:", error);
        showError("Không thể tải dữ liệu nhà hàng. Vui lòng kiểm tra kết nối server.");
        hideLoading();
    }
}

function populateFilters(stats) {
    // Populate cuisine filter
    if (cuisineFilter && stats.restaurant_cuisines) {
        const cuisines = Object.keys(stats.restaurant_cuisines).sort();
        cuisineFilter.innerHTML = '<option value="">Tất cả ẩm thực</option>';
        cuisines.forEach((cuisine) => {
            const option = document.createElement("option");
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        });
    }

    // Populate parking filter from restaurant data
    if (parkingFilter && restaurantsData.length > 0) {
        const parkingOptions = new Set();
        restaurantsData.forEach((restaurant) => {
            if (restaurant.parking) {
                restaurant.parking.forEach((p) => parkingOptions.add(p));
            }
        });

        parkingFilter.innerHTML = '<option value="">Tất cả bãi đỗ xe</option>';
        Array.from(parkingOptions)
            .sort()
            .forEach((parking) => {
                const option = document.createElement("option");
                option.value = parking;
                option.textContent = getParkingDisplay(parking);
                parkingFilter.appendChild(option);
            });
    }
}

function displayRestaurants(restaurants) {
    if (!restaurantGrid) return;

    restaurantGrid.innerHTML = "";

    if (restaurants.length === 0) {
        restaurantGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy nhà hàng nào</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
        `;
        return;
    }

    restaurants.forEach((restaurant) => {
        const restaurantCard = createRestaurantCard(restaurant);
        restaurantGrid.appendChild(restaurantCard);
    });

    updateRestaurantCount(restaurants.length);
}

function createRestaurantCard(restaurant) {
    const card = document.createElement("a");
    card.className = "restaurant-card";
    card.href = `restaurant-detail.html?placeID=${restaurant.placeID}`;

    const cuisines = restaurant.cuisines || [];
    const avgRating = restaurant.average_rating || 0;
    const ratingCount = restaurant.rating_count || 0;
    const parking = restaurant.parking && restaurant.parking.length > 0 ? restaurant.parking[0] : "N/A";

    // Check if restaurant is open (simplified logic)
    const isOpen = checkIfOpen(restaurant.hours);

    card.innerHTML = `
        <div class="restaurant-header">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="restaurant-address">
                <i class="fas fa-map-marker-alt"></i>
                ${restaurant.address || "Địa chỉ không có sẵn"}, ${restaurant.city || ""}
            </div>
        </div>
        <div class="restaurant-info">
            <div class="restaurant-details">
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span>${getPriceDisplay(restaurant.price)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-wine-glass"></i>
                    <span>${getAlcoholDisplay(restaurant.alcohol)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-smoking"></i>
                    <span>${getSmokingDisplay(restaurant.smoking_area)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-parking"></i>
                    <span>${getParkingDisplay(parking)}</span>
                </div>
            </div>
            <div class="cuisine-tags">
                ${cuisines
                    .slice(0, 3)
                    .map((cuisine) => `<span class="cuisine-tag">${cuisine}</span>`)
                    .join("")}
            </div>
            <div class="restaurant-rating">
                <div class="rating-stars">
                    ${generateStars(avgRating)}
                </div>
                <span class="rating-number">${avgRating.toFixed(1)}</span>
                <span class="rating-count">(${ratingCount})</span>
                <span class="status ${isOpen ? "open" : "closed"}">
                    ${isOpen ? "Đang mở" : "Đóng cửa"}
                </span>
            </div>
        </div>
    `;

    return card;
}

function checkIfOpen(hours) {
    if (!hours || hours.length === 0) return false;

    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "short" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Find today's hours
    const todayHours = hours.find((h) => {
        if (!h.days) return false;
        const days = h.days.toLowerCase();
        const currentDayLower = currentDay.toLowerCase();

        // Simple check for day ranges like "mon-sun" or specific days
        return days.includes(currentDayLower.substring(0, 3)) || days.includes("mon-sun") || days.includes("daily");
    });

    if (!todayHours || !todayHours.hours) return false;

    try {
        const timeRange = todayHours.hours;
        if (timeRange.includes("-")) {
            const [openTime, closeTime] = timeRange.split("-").map((time) => {
                const [hours, minutes] = time.split(":").map(Number);
                return hours * 60 + (minutes || 0);
            });
            return currentTime >= openTime && currentTime <= closeTime;
        }
    } catch (error) {
        console.log("Error parsing hours:", error);
    }

    return false;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = "";
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function getPriceDisplay(price) {
    const priceMap = {
        low: "Rẻ ($)",
        medium: "Trung bình ($$)",
        high: "Cao ($$$)",
    };
    return priceMap[price] || "N/A";
}

function getAlcoholDisplay(alcohol) {
    const alcoholMap = {
        No_Alcohol_Served: "Không có rượu",
        "Wine-Beer": "Rượu vang/Bia",
        Full_Bar: "Đầy đủ",
    };
    return alcoholMap[alcohol] || "N/A";
}

function getSmokingDisplay(smoking) {
    const smokingMap = {
        none: "Không hút thuốc",
        section: "Khu vực riêng",
        permitted: "Được phép",
        "only at bar": "Chỉ tại quầy bar",
        "not permitted": "Không được phép",
    };
    return smokingMap[smoking] || "N/A";
}

function getParkingDisplay(parking) {
    const parkingMap = {
        yes: "Có",
        none: "Không",
        public: "Công cộng",
        "valet parking": "Valet",
    };
    return parkingMap[parking] || "N/A";
}

function applyFiltersAndSort() {
    let filteredRestaurants = [...restaurantsData];

    // Apply search filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (searchTerm) {
        filteredRestaurants = filteredRestaurants.filter(
            (restaurant) =>
                restaurant.name.toLowerCase().includes(searchTerm) ||
                (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm)) ||
                (restaurant.city && restaurant.city.toLowerCase().includes(searchTerm)) ||
                (restaurant.cuisines && restaurant.cuisines.some((cuisine) => cuisine.toLowerCase().includes(searchTerm)))
        );
    }

    // Apply cuisine filter
    const cuisineValue = cuisineFilter ? cuisineFilter.value : "";
    if (cuisineValue) {
        filteredRestaurants = filteredRestaurants.filter((restaurant) => {
            return restaurant.cuisines && restaurant.cuisines.includes(cuisineValue);
        });
    }

    // Apply price filter
    const priceValue = priceFilter ? priceFilter.value : "";
    if (priceValue) {
        filteredRestaurants = filteredRestaurants.filter((restaurant) => restaurant.price === priceValue);
    }

    // Apply rating filter
    const ratingValue = ratingFilter ? ratingFilter.value : "";
    if (ratingValue) {
        const minRating = parseFloat(ratingValue);
        filteredRestaurants = filteredRestaurants.filter((restaurant) => {
            const avgRating = restaurant.average_rating || 0;
            return avgRating >= minRating;
        });
    }

    // Apply parking filter
    const parkingValue = parkingFilter ? parkingFilter.value : "";
    if (parkingValue) {
        filteredRestaurants = filteredRestaurants.filter((restaurant) => {
            return restaurant.parking && restaurant.parking.includes(parkingValue);
        });
    }

    // Apply sorting
    const sortValue = sortBy ? sortBy.value : "name";
    filteredRestaurants.sort((a, b) => {
        switch (sortValue) {
            case "name":
                return a.name.localeCompare(b.name);
            case "rating":
                return (b.average_rating || 0) - (a.average_rating || 0);
            case "price":
                const priceOrder = { low: 1, medium: 2, high: 3 };
                return (priceOrder[a.price] || 0) - (priceOrder[b.price] || 0);
            default:
                return 0;
        }
    });

    displayRestaurants(filteredRestaurants);
}

function clearAllFilters() {
    if (searchInput) searchInput.value = "";
    if (cuisineFilter) cuisineFilter.value = "";
    if (priceFilter) priceFilter.value = "";
    if (ratingFilter) ratingFilter.value = "";
    if (statusFilter) statusFilter.value = "";
    if (parkingFilter) parkingFilter.value = "";
    if (sortBy) sortBy.value = "name";

    displayRestaurants(restaurantsData);
}

function updateRestaurantCount(count) {
    if (restaurantCount) {
        restaurantCount.textContent = `${count} nhà hàng`;
    }
}

function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "block";
    }
    if (restaurantGrid) {
        restaurantGrid.style.display = "none";
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }
    if (restaurantGrid) {
        restaurantGrid.style.display = "grid";
    }
}

function showError(message) {
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById("restaurants-error-message");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "restaurants-error-message";
        errorDiv.className = "error-message";
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        // Insert before restaurant grid
        if (restaurantGrid && restaurantGrid.parentNode) {
            restaurantGrid.parentNode.insertBefore(errorDiv, restaurantGrid);
        }
    }

    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    errorDiv.style.display = "flex";

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = "none";
        }
    }, 5000);
}

function toggleMobileNav() {
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
}

function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        console.log("Reached bottom, could load more restaurants...");
    }
}
