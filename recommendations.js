// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// DOM Elements
const userSelect = document.getElementById("userSelect");
const getRecommendationsBtn = document.getElementById("getRecommendationsBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const userProfile = document.getElementById("userProfile");
const recommendationsResults = document.getElementById("recommendationsResults");
const recommendationsList = document.getElementById("recommendationsList");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    userSelect.addEventListener("change", function () {
        const selectedUser = this.value;
        getRecommendationsBtn.disabled = !selectedUser;

        if (selectedUser) {
            loadUserProfile(selectedUser);
        } else {
            hideUserProfile();
            hideRecommendations();
        }
    });

    getRecommendationsBtn.addEventListener("click", function () {
        const selectedUser = userSelect.value;
        if (selectedUser) {
            getRecommendations(selectedUser);
        }
    });
}

async function loadUsers() {
    try {
        showLoading();
        console.log("Fetching users from:", `${API_BASE_URL}/users`);

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load users`);
        }

        const data = await response.json();
        console.log("Users data:", data);
        populateUserDropdown(data.users);
        hideLoading();
    } catch (error) {
        console.error("Error loading users:", error);
        showError(`Không thể tải danh sách người dùng: ${error.message}. Vui lòng kiểm tra kết nối server.`);
        hideLoading();
    }
}

function populateUserDropdown(users) {
    userSelect.innerHTML = '<option value="">-- Chọn người dùng --</option>';

    users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });
}

async function loadUserProfile(userId) {
    try {
        console.log("Fetching user profile for:", userId);

        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("User profile response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load user profile`);
        }

        const data = await response.json();
        console.log("User profile data:", data);
        displayUserProfile(data);
    } catch (error) {
        console.error("Error loading user profile:", error);
        showError(`Không thể tải thông tin người dùng: ${error.message}`);
    }
}

function displayUserProfile(userData) {
    document.getElementById("profileUserId").textContent = userData.userID;
    document.getElementById("profileBudget").textContent = userData.profile.budget || "N/A";
    document.getElementById("profileDrinkLevel").textContent = userData.profile.drink_level || "N/A";
    document.getElementById("profileTotalRatings").textContent = userData.total_ratings;
    document.getElementById("profileAvgRating").textContent = userData.average_rating;

    userProfile.style.display = "block";
}

async function getRecommendations(userId) {
    try {
        showLoading();
        hideError();
        hideRecommendations();

        const response = await fetch(`${API_BASE_URL}/recommendations/${userId}?top_n=10`);

        if (!response.ok) {
            throw new Error("Failed to get recommendations");
        }

        const data = await response.json();
        displayRecommendations(data);
        hideLoading();
    } catch (error) {
        console.error("Error getting recommendations:", error);
        showError("Không thể tạo gợi ý nhà hàng. Vui lòng thử lại.");
        hideLoading();
    }
}

function displayRecommendations(data) {
    if (!data.recommendations || data.recommendations.length === 0) {
        showError("Không tìm thấy gợi ý phù hợp cho người dùng này.");
        return;
    }

    recommendationsList.innerHTML = "";

    data.recommendations.forEach((restaurant, index) => {
        const restaurantCard = createRestaurantCard(restaurant, index + 1);
        recommendationsList.appendChild(restaurantCard);
    });

    recommendationsResults.style.display = "block";
}

function createRestaurantCard(restaurant, rank) {
    const card = document.createElement("div");
    card.className = "recommendation-card";

    const cuisineText = restaurant.cuisines && restaurant.cuisines.length > 0 ? restaurant.cuisines.join(", ") : "Không xác định";

    const alcoholText = getAlcoholText(restaurant.alcohol);
    const smokingText = getSmokingText(restaurant.smoking_area);
    const priceText = getPriceText(restaurant.price);

    card.innerHTML = `
        <div class="recommendation-rank">#${rank}</div>
        <div class="recommendation-content">
            <div class="restaurant-header">
                <h4 class="restaurant-name">${restaurant.name}</h4>
                <div class="predicted-rating">
                    <i class="fas fa-star"></i>
                    <span>Dự đoán: ${restaurant.predicted_rating}/2</span>
                </div>
            </div>
            <div class="restaurant-details">
                <div class="detail-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${restaurant.address}, ${restaurant.city}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-utensils"></i>
                    <span>Ẩm thực: ${cuisineText}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-dollar-sign"></i>
                    <span>Giá: ${priceText}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-wine-glass"></i>
                    <span>Rượu: ${alcoholText}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-smoking"></i>
                    <span>Hút thuốc: ${smokingText}</span>
                </div>
            </div>
            <div class="restaurant-actions">
                <a href="restaurant-detail.html?placeID=${restaurant.placeID}" class="btn-view-details">
                    <i class="fas fa-eye"></i> Xem Chi Tiết
                </a>
            </div>
        </div>
    `;

    return card;
}

function getAlcoholText(alcohol) {
    const alcoholMap = {
        No_Alcohol_Served: "Không có rượu",
        "Wine-Beer": "Rượu vang/Bia",
        Full_Bar: "Đầy đủ",
    };
    return alcoholMap[alcohol] || alcohol || "N/A";
}

function getSmokingText(smoking) {
    const smokingMap = {
        none: "Không hút thuốc",
        "only at bar": "Chỉ tại quầy bar",
        section: "Khu vực riêng",
        permitted: "Được phép",
        "not permitted": "Không được phép",
    };
    return smokingMap[smoking] || smoking || "N/A";
}

function getPriceText(price) {
    const priceMap = {
        low: "Thấp ($)",
        medium: "Trung bình ($$)",
        high: "Cao ($$$)",
    };
    return priceMap[price] || price || "N/A";
}

function showLoading() {
    loadingSpinner.style.display = "block";
}

function hideLoading() {
    loadingSpinner.style.display = "none";
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = "block";
}

function hideError() {
    errorMessage.style.display = "none";
}

function hideUserProfile() {
    userProfile.style.display = "none";
}

function hideRecommendations() {
    recommendationsResults.style.display = "none";
}
