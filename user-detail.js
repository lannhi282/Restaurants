// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// Global variables
let userData = null;

// DOM Elements
const userInfo = document.getElementById("userInfo");
const ratingsGrid = document.getElementById("ratingsGrid");
const recommendationsGrid = document.getElementById("recommendationsGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

// API Functions
async function fetchUserDetail(userID) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userID}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch user detail`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching user detail:", error);
        throw error;
    }
}

async function fetchUserRecommendations(userID) {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations/${userID}?top_n=5`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch recommendations`);
        }
        const data = await response.json();
        return data.recommendations;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        throw error;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    loadUserDetail();
});

function setupEventListeners() {
    if (navToggle) {
        navToggle.addEventListener("click", toggleMobileNav);
    }

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = this.getAttribute("href");
        });
    });
}

async function loadUserDetail() {
    try {
        showLoading();

        const urlParams = new URLSearchParams(window.location.search);
        const userID = urlParams.get("userID");

        if (!userID) {
            showError("Không tìm thấy ID người dùng trong URL");
            return;
        }

        userData = await fetchUserDetail(userID);
        displayUserDetail();

        // Load recommendations in parallel
        try {
            const recommendations = await fetchUserRecommendations(userID);
            displayRecommendations(recommendations);
        } catch (error) {
            console.log("Could not load recommendations:", error);
            displayRecommendations([]);
        }

        hideLoading();
    } catch (error) {
        console.error("Error loading user detail:", error);
        showError("Không thể tải thông tin người dùng. Vui lòng kiểm tra kết nối server.");
        hideLoading();
    }
}

function displayUserDetail() {
    if (!userData) {
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-user"></i>
                    <h3>Không tìm thấy người dùng</h3>
                    <p>Kiểm tra ID người dùng hoặc thử lại</p>
                </div>
            `;
        }
        return;
    }

    const profile = userData.profile;
    const cuisines = userData.cuisine_preferences || [];
    const payments = userData.payment_preferences || [];
    const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null;

    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div>
                    <div class="user-name">Người dùng ${userData.userID}</div>
                    <div class="user-email">N/A</div>
                </div>
            </div>
            <div class="user-info">
                <div class="user-details">
                    <div class="user-detail-item">
                        <i class="fas fa-utensils"></i>
                        <span>Loại Ẩm Thực: ${cuisines.join(", ") || "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-credit-card"></i>
                        <span>Phương thức thanh toán: ${payments.join(", ") || "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-smoking"></i>
                        <span>Hút thuốc: ${getSmokerDisplay(profile.smoker)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-wine-glass"></i>
                        <span>Mức độ uống: ${getDrinkLevelDisplay(profile.drink_level)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-tshirt"></i>
                        <span>Trang phục: ${getDressPreferenceDisplay(profile.dress_preference)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Ngân sách: ${getBudgetDisplay(profile.budget)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-map-pin"></i>
                        <span>Tọa độ: (${profile.latitude || "N/A"}, ${profile.longitude || "N/A"})</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-home"></i>
                        <span>Không gian: ${getAmbienceDisplay(profile.ambience)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-car"></i>
                        <span>Phương tiện: ${getTransportDisplay(profile.transport)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-ring"></i>
                        <span>Tình trạng hôn nhân: ${getMaritalStatusDisplay(profile.marital_status)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-child"></i>
                        <span>Con cái: ${getChildrenDisplay(profile.hijos)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span>Năm sinh: ${profile.birth_year || "N/A"} (Tuổi: ${age || "N/A"})</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-heart"></i>
                        <span>Sở thích: ${getInterestDisplay(profile.interest)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-user-tie"></i>
                        <span>Tính cách: ${getPersonalityDisplay(profile.personality)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-pray"></i>
                        <span>Tôn giáo: ${getReligionDisplay(profile.religion)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-briefcase"></i>
                        <span>Hoạt động: ${getActivityDisplay(profile.activity)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-palette"></i>
                        <span>Màu sắc yêu thích: ${profile.color || "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-weight"></i>
                        <span>Cân nặng: ${profile.weight ? profile.weight + " kg" : "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-ruler-vertical"></i>
                        <span>Chiều cao: ${profile.height ? profile.height + " m" : "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-star"></i>
                        <span>Tổng đánh giá: ${userData.total_ratings}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-star-half-alt"></i>
                        <span>Đánh giá trung bình: ${userData.average_rating}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Display user ratings if available
    if (userData.ratings && userData.ratings.length > 0) {
        displayUserRatings(userData.ratings);
    } else {
        displayUserRatings([]);
    }
}

function displayUserRatings(ratings) {
    if (!ratingsGrid) return;

    ratingsGrid.innerHTML = "";

    if (ratings.length === 0) {
        ratingsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-star"></i>
                <h3>Chưa có đánh giá</h3>
                <p>Người dùng này chưa đánh giá nhà hàng nào.</p>
            </div>
        `;
        return;
    }

    ratings.forEach((rating) => {
        const ratingCard = document.createElement("div");
        ratingCard.className = "rating-card";
        ratingCard.innerHTML = `
            <div class="rating-header">
                <a href="restaurant-detail.html?placeID=${rating.placeID}" class="restaurant-name">
                    ${rating.restaurant_name || `Nhà hàng ${rating.placeID}`}
                </a>
                <div class="rating-stars">${generateStars(rating.rating)}</div>
            </div>
            <div class="rating-details">
                <p><strong>Đánh giá tổng: </strong>${rating.rating}/2</p>
                ${rating.food_rating ? `<p><strong>Đồ ăn: </strong>${rating.food_rating}/2</p>` : ""}
                ${rating.service_rating ? `<p><strong>Dịch vụ: </strong>${rating.service_rating}/2</p>` : ""}
            </div>
        `;
        ratingsGrid.appendChild(ratingCard);
    });
}

function displayRecommendations(recommendations) {
    if (!recommendationsGrid) return;

    recommendationsGrid.innerHTML = "";

    if (recommendations.length === 0) {
        recommendationsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-utensils"></i>
                <h3>Chưa có gợi ý</h3>
                <p>Không tìm thấy nhà hàng phù hợp với sở thích của người dùng.</p>
            </div>
        `;
        return;
    }

    recommendations.slice(0, 5).forEach((restaurant) => {
        const restaurantCard = createRestaurantCard(restaurant);
        recommendationsGrid.appendChild(restaurantCard);
    });
}

function createRestaurantCard(restaurant) {
    const card = document.createElement("a");
    card.className = "restaurant-card";
    card.href = `restaurant-detail.html?placeID=${restaurant.placeID}`;

    const cuisines = restaurant.cuisines || [];
    const avgRating = restaurant.average_rating || 0;
    const ratingCount = restaurant.rating_count || 0;

    card.innerHTML = `
        <div class="restaurant-header">
            <div class="restaurant-name">${restaurant.name}</div>
            <div class="restaurant-address">
                <i class="fas fa-map-marker-alt"></i>
                ${restaurant.address || "Địa chỉ không có sẵn"}, ${restaurant.city || ""}
            </div>
        </div>
        <div class="restaurant-info">
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
                ${restaurant.predicted_rating ? `<span class="predicted-rating">Dự đoán: ${restaurant.predicted_rating.toFixed(1)}</span>` : ""}
            </div>
        </div>
    `;

    return card;
}

function generateStars(rating) {
    // Convert rating from 0-2 scale to 0-5 scale for display
    const scaledRating = (rating / 2) * 5;
    const fullStars = Math.floor(scaledRating);
    const hasHalfStar = scaledRating % 1 >= 0.5;
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

// Utility functions for display mapping
function getSmokerDisplay(smoker) {
    const smokerMap = {
        true: "Có",
        false: "Không",
        "?": "Không xác định",
    };
    return smokerMap[smoker] || "N/A";
}

function getDrinkLevelDisplay(drinkLevel) {
    const drinkLevelMap = {
        "casual drinker": "Bình thường",
        "social drinker": "Xã giao",
        abstemious: "Kiêng rượu",
        "?": "Không xác định",
    };
    return drinkLevelMap[drinkLevel] || "N/A";
}

function getDressPreferenceDisplay(dressPreference) {
    const displayMap = {
        informal: "Bình thường",
        casual: "Thoải mái",
        formal: "Trang trọng",
        "no preference": "Không có sở thích",
        "?": "Không xác định",
    };
    return displayMap[dressPreference] || "N/A";
}

function getBudgetDisplay(budget) {
    const budgetMap = {
        low: "Rẻ ($)",
        medium: "Trung bình ($$)",
        high: "Cao ($$$)",
        "?": "Không xác định",
    };
    return budgetMap[budget] || "N/A";
}

function getAmbienceDisplay(ambience) {
    const displayMap = {
        family: "Gia đình",
        friends: "Bạn bè",
        solitary: "Một mình",
        "?": "Không xác định",
    };
    return displayMap[ambience] || "N/A";
}

function getTransportDisplay(transport) {
    const displayMap = {
        "on foot": "Đi bộ",
        public: "Phương tiện công cộng",
        "car owner": "Có xe hơi",
        "?": "Không xác định",
    };
    return displayMap[transport] || "N/A";
}

function getMaritalStatusDisplay(status) {
    const displayMap = {
        single: "Độc thân",
        married: "Đã kết hôn",
        widow: "Góa",
        "?": "Không xác định",
    };
    return displayMap[status] || "N/A";
}

function getChildrenDisplay(hijos) {
    const displayMap = {
        independent: "Độc lập",
        kids: "Có con",
        dependent: "Phụ thuộc",
        "?": "Không xác định",
    };
    return displayMap[hijos] || "N/A";
}

function getInterestDisplay(interest) {
    const displayMap = {
        none: "Không có",
        technology: "Công nghệ",
        "eco-friendly": "Thân thiện môi trường",
        retro: "Cổ điển",
        variety: "Đa dạng",
        "?": "Không xác định",
    };
    return displayMap[interest] || "N/A";
}

function getPersonalityDisplay(personality) {
    const displayMap = {
        "thrifty-protector": "Tiết kiệm",
        "hunter-ostentatious": "Phô trương",
        "hard-worker": "Chăm chỉ",
        conformist: "Truyền thống",
        "?": "Không xác định",
    };
    return displayMap[personality] || "N/A";
}

function getReligionDisplay(religion) {
    const displayMap = {
        none: "Không có",
        Catholic: "Công giáo",
        Christian: "Cơ đốc",
        Jewish: "Do Thái",
        "?": "Không xác định",
    };
    return displayMap[religion] || "N/A";
}

function getActivityDisplay(activity) {
    const displayMap = {
        student: "Sinh viên",
        professional: "Chuyên gia",
        unemployed: "Thất nghiệp",
        "working-class": "Lao động",
        "?": "Không xác định",
    };
    return displayMap[activity] || "N/A";
}

function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "flex";
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }
}

function showError(message) {
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById("user-detail-error");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "user-detail-error";
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

        // Insert at the beginning of the page
        document.body.insertBefore(errorDiv, document.body.firstChild);
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
