// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const restaurantGrid = document.getElementById("restaurantGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const cuisineFilter = document.getElementById("cuisineFilter");
const priceFilter = document.getElementById("priceFilter");
const alcoholFilter = document.getElementById("alcoholFilter");
const smokingFilter = document.getElementById("smokingFilter");
const parkingFilter = document.getElementById("parkingFilter");
const clearFilters = document.getElementById("clearFilters");
const sortBy = document.getElementById("sortBy");
const restaurantCount = document.getElementById("restaurantCount");
const totalUsers = document.getElementById("totalUsers");
const totalReviews = document.getElementById("totalReviews");
const totalRestaurants = document.getElementById("totalRestaurants");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

// Data storage
let restaurantsData = [];
let statsData = {};

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

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
    initializeApp();
    setupEventListeners();
    loadDataFromAPI();
});

function initializeApp() {
    hideLoading();
    setupSmoothScrolling();
}

function setupEventListeners() {
    if (searchBtn) searchBtn.addEventListener("click", performSearch);
    if (searchInput) {
        searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                performSearch();
            }
        });
    }

    if (cuisineFilter) cuisineFilter.addEventListener("change", applyFilters);
    if (priceFilter) priceFilter.addEventListener("change", applyFilters);
    if (alcoholFilter) alcoholFilter.addEventListener("change", applyFilters);
    if (smokingFilter) smokingFilter.addEventListener("change", applyFilters);
    if (parkingFilter) parkingFilter.addEventListener("change", applyFilters);
    if (sortBy) sortBy.addEventListener("change", applyFilters);
    if (clearFilters) clearFilters.addEventListener("click", clearAllFilters);
    if (navToggle) navToggle.addEventListener("click", toggleMobileNav);

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = this.getAttribute("href");
        });
    });
}

async function loadDataFromAPI() {
    try {
        showLoading();

        // Load restaurants and stats in parallel
        const [restaurants, stats] = await Promise.all([fetchRestaurants(), fetchStats()]);

        restaurantsData = restaurants;
        statsData = stats;

        displayRestaurants(restaurantsData);
        updateStats();
        populateFilters();
        generateActivityChart();

        hideLoading();
    } catch (error) {
        console.error("Error loading data:", error);
        showError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối server.");
        hideLoading();
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
    const isOpen = true; // We'll implement this later with hours data

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

function performSearch() {
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        applyFilters();
        return;
    }

    const filteredRestaurants = restaurantsData.filter((restaurant) => {
        const nameMatch = restaurant.name.toLowerCase().includes(searchTerm);
        const addressMatch = restaurant.address && restaurant.address.toLowerCase().includes(searchTerm);
        const cityMatch = restaurant.city && restaurant.city.toLowerCase().includes(searchTerm);
        const cuisineMatch = restaurant.cuisines && restaurant.cuisines.some((cuisine) => cuisine.toLowerCase().includes(searchTerm));

        return nameMatch || addressMatch || cityMatch || cuisineMatch;
    });

    applyFilters(filteredRestaurants);
}

function applyFilters(baseRestaurants = restaurantsData) {
    let filteredRestaurants = [...baseRestaurants];

    // Apply cuisine filter
    const selectedCuisine = cuisineFilter ? cuisineFilter.value : "";
    if (selectedCuisine) {
        filteredRestaurants = filteredRestaurants.filter((r) => r.cuisines && r.cuisines.includes(selectedCuisine));
    }

    // Apply price filter
    const selectedPrice = priceFilter ? priceFilter.value : "";
    if (selectedPrice) {
        filteredRestaurants = filteredRestaurants.filter((r) => r.price === selectedPrice);
    }

    // Apply alcohol filter
    const selectedAlcohol = alcoholFilter ? alcoholFilter.value : "";
    if (selectedAlcohol) {
        filteredRestaurants = filteredRestaurants.filter((r) => r.alcohol === selectedAlcohol);
    }

    // Apply smoking filter
    const selectedSmoking = smokingFilter ? smokingFilter.value : "";
    if (selectedSmoking) {
        filteredRestaurants = filteredRestaurants.filter((r) => r.smoking_area === selectedSmoking);
    }

    // Apply parking filter
    const selectedParking = parkingFilter ? parkingFilter.value : "";
    if (selectedParking) {
        filteredRestaurants = filteredRestaurants.filter((r) => r.parking && r.parking.includes(selectedParking));
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
    if (cuisineFilter) cuisineFilter.value = "";
    if (priceFilter) priceFilter.value = "";
    if (alcoholFilter) alcoholFilter.value = "";
    if (smokingFilter) smokingFilter.value = "";
    if (parkingFilter) parkingFilter.value = "";
    if (sortBy) sortBy.value = "name";
    if (searchInput) searchInput.value = "";

    displayRestaurants(restaurantsData);
}

function populateFilters() {
    // Populate cuisine filter
    if (cuisineFilter && statsData.restaurant_cuisines) {
        const cuisines = Object.keys(statsData.restaurant_cuisines).sort();
        cuisineFilter.innerHTML = '<option value="">Tất cả</option>';
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

        parkingFilter.innerHTML = '<option value="">Tất cả</option>';
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

function updateStats() {
    if (totalUsers && statsData.total_users) {
        totalUsers.textContent = statsData.total_users.toLocaleString();
    }
    if (totalRestaurants && statsData.total_restaurants) {
        totalRestaurants.textContent = statsData.total_restaurants.toLocaleString();
    }
    if (totalReviews && statsData.total_reviews) {
        totalReviews.textContent = statsData.total_reviews.toLocaleString();
    }
}

function updateRestaurantCount(count) {
    if (restaurantCount) {
        restaurantCount.textContent = count.toLocaleString();
    }
}

function generateActivityChart() {
    // This function would generate charts based on real data
    // For now, we'll just log that it would be implemented
    console.log("Activity chart would be generated with real data");
}

function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "block";
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }
}

function showError(message) {
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById("error-message");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "error-message";
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

        // Insert after hero section or at the beginning of main content
        const heroSection = document.querySelector(".hero");
        if (heroSection && heroSection.nextSibling) {
            heroSection.parentNode.insertBefore(errorDiv, heroSection.nextSibling);
        } else {
            document.body.insertBefore(errorDiv, document.body.firstChild);
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

function setupSmoothScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                });
            }
        });
    });
}

function toggleMobileNav() {
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
}
