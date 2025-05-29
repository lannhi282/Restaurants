// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// Global variables
let restaurantData = null;

// DOM Elements
const restaurantName = document.getElementById("restaurantName");
const restaurantAddress = document.getElementById("restaurantAddress");
const basicInfo = document.getElementById("basicInfo");
const cuisineTags = document.getElementById("cuisineTags");
const paymentTags = document.getElementById("paymentTags");
const hoursInfo = document.getElementById("hoursInfo");
const ratingStars = document.getElementById("ratingStars");
const ratingNumber = document.getElementById("ratingNumber");
const ratingCount = document.getElementById("ratingCount");
const recentReviews = document.getElementById("recentReviews");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

// API Functions
async function fetchRestaurantDetail(placeID) {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurant/${placeID}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch restaurant detail`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching restaurant detail:", error);
        throw error;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    loadRestaurantDetail();
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

async function loadRestaurantDetail() {
    try {
        showLoading();

        const urlParams = new URLSearchParams(window.location.search);
        const placeID = urlParams.get("placeID");

        if (!placeID) {
            showError("Không tìm thấy ID nhà hàng trong URL");
            return;
        }

        restaurantData = await fetchRestaurantDetail(placeID);
        displayRestaurantDetail();
        hideLoading();
    } catch (error) {
        console.error("Error loading restaurant detail:", error);
        showError("Không thể tải thông tin nhà hàng. Vui lòng kiểm tra kết nối server.");
        hideLoading();
    }
}

function displayRestaurantDetail() {
    if (!restaurantData) {
        document.getElementById("restaurantDetail").innerHTML = `
            <div class="no-results">
                <h3>Không tìm thấy nhà hàng</h3>
            </div>
        `;
        return;
    }

    // Display restaurant name and address
    if (restaurantName) {
        restaurantName.textContent = restaurantData.name;
    }
    if (restaurantAddress) {
        restaurantAddress.textContent = `${restaurantData.address || "N/A"}, ${restaurantData.city || "N/A"}`;
    }

    // Display basic info
    if (basicInfo) {
        basicInfo.innerHTML = `
            <div class="detail-row">
                <strong>Mức giá:</strong> ${getPriceDisplay(restaurantData.price)}
            </div>
            <div class="detail-row">
                <strong>Rượu/Bia:</strong> ${getAlcoholDisplay(restaurantData.alcohol)}
            </div>
            <div class="detail-row">
                <strong>Khu vực hút thuốc:</strong> ${getSmokingDisplay(restaurantData.smoking_area)}
            </div>
            <div class="detail-row">
                <strong>Tiếp cận:</strong> ${getAccessibilityDisplay(restaurantData.accessibility)}
            </div>
            <div class="detail-row">
                <strong>Dress code:</strong> ${getDressCodeDisplay(restaurantData.dress_code)}
            </div>
            <div class="detail-row">
                <strong>Dịch vụ khác:</strong> ${restaurantData.other_services || "Không có"}
            </div>
            <div class="detail-row">
                <strong>Đỗ xe:</strong> ${getParkingDisplay(restaurantData.parking)}
            </div>
            <div class="detail-row">
                <strong>Quốc gia:</strong> ${restaurantData.country || "N/A"}
            </div>
            <div class="detail-row">
                <strong>Bang/Tỉnh:</strong> ${restaurantData.state || "N/A"}
            </div>
        `;
    }

    // Display cuisines
    if (cuisineTags) {
        const cuisines = restaurantData.cuisines || [];
        cuisineTags.innerHTML = cuisines.length > 0 ? cuisines.map((cuisine) => `<span class="cuisine-tag">${cuisine}</span>`).join("") : "<span>Không có thông tin</span>";
    }

    // Display payment methods
    if (paymentTags) {
        const payments = restaurantData.payments || [];
        paymentTags.innerHTML = payments.length > 0 ? payments.map((payment) => `<span class="payment-tag">${payment}</span>`).join("") : "<span>Không có thông tin</span>";
    }

    // Display hours
    if (hoursInfo) {
        const hours = restaurantData.hours || [];
        hoursInfo.innerHTML =
            hours.length > 0
                ? hours
                      .map((h) => {
                          const isOpen = checkIfOpen(h.hours, h.days);
                          return `
                    <div class="detail-row">
                        <strong>${h.days}:</strong> ${h.hours}
                        <span class="status ${isOpen ? "open" : "closed"}">
                            (${isOpen ? "Đang mở" : "Đóng cửa"})
                        </span>
                    </div>
                `;
                      })
                      .join("")
                : "<span>Không có thông tin</span>";
    }

    // Display ratings
    const avgRating = restaurantData.average_rating || 0;
    const ratingCountValue = restaurantData.rating_count || 0;

    if (ratingStars) {
        ratingStars.innerHTML = generateStars(avgRating);
    }
    if (ratingNumber) {
        ratingNumber.textContent = avgRating.toFixed(1) + "/2"; // Rating scale is 0-2
    }
    if (ratingCount) {
        ratingCount.textContent = `(${ratingCountValue} đánh giá)`;
    }
    if (recentReviews) {
        recentReviews.innerHTML = generateRecentReviews(restaurantData.reviews || []);
    }
}

function checkIfOpen(hours, days) {
    if (!hours || !days) return false;

    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "short" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Simple check for day ranges like "mon-sun" or specific days
    const daysLower = days.toLowerCase();
    const currentDayLower = currentDay.toLowerCase();

    const dayMatch = daysLower.includes(currentDayLower.substring(0, 3)) || daysLower.includes("mon-sun") || daysLower.includes("daily");

    if (!dayMatch) return false;

    try {
        if (hours.includes("-")) {
            const [openTime, closeTime] = hours.split("-").map((time) => {
                const [h, m] = time.split(":").map(Number);
                return h * 60 + (m || 0);
            });
            return currentTime >= openTime && currentTime <= closeTime;
        }
    } catch (error) {
        console.log("Error parsing hours:", error);
    }

    return false;
}

function calculateAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
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

function generateRecentReviews(reviews) {
    if (reviews.length === 0) {
        return "<p>Chưa có đánh giá nào.</p>";
    }

    return reviews
        .slice(0, 5) // Show top 5 reviews
        .map(
            (review) => `
            <div class="review-item">
                <div class="reviewer">Người dùng ${review.userID}</div>
                <div class="review-ratings">
                    <span>Tổng thể: ${generateStars(review.rating)}</span>
                    ${review.food_rating ? `<span>Đồ ăn: ${generateStars(review.food_rating)}</span>` : ""}
                    ${review.service_rating ? `<span>Dịch vụ: ${generateStars(review.service_rating)}</span>` : ""}
                </div>
            </div>
        `
        )
        .join("");
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

function getAccessibilityDisplay(accessibility) {
    const accessMap = {
        no_accessibility: "Không",
        completely: "Hoàn toàn",
        partially: "Một phần",
    };
    return accessMap[accessibility] || "N/A";
}

function getDressCodeDisplay(dressCode) {
    const dressCodeMap = {
        informal: "Bình thường",
        casual: "Thoải mái",
        formal: "Trang trọng",
    };
    return dressCodeMap[dressCode] || "N/A";
}

function getParkingDisplay(parking) {
    if (!parking || parking.length === 0) return "N/A";

    const parkingMap = {
        yes: "Có",
        none: "Không",
        public: "Công cộng",
        "valet parking": "Valet",
    };

    // If parking is an array, show the first option
    const parkingOption = Array.isArray(parking) ? parking[0] : parking;
    return parkingMap[parkingOption] || parkingOption || "N/A";
}

function showLoading() {
    // Create loading spinner if it doesn't exist
    let loadingDiv = document.getElementById("restaurant-detail-loading");
    if (!loadingDiv) {
        loadingDiv = document.createElement("div");
        loadingDiv.id = "restaurant-detail-loading";
        loadingDiv.className = "loading-spinner";
        loadingDiv.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 3rem;
            font-size: 1.2rem;
            color: #6c757d;
        `;
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
            Đang tải thông tin nhà hàng...
        `;

        const detailContainer = document.getElementById("restaurantDetail");
        if (detailContainer) {
            detailContainer.appendChild(loadingDiv);
        }
    }
    loadingDiv.style.display = "flex";
}

function hideLoading() {
    const loadingDiv = document.getElementById("restaurant-detail-loading");
    if (loadingDiv) {
        loadingDiv.style.display = "none";
    }
}

function showError(message) {
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById("restaurant-detail-error");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "restaurant-detail-error";
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

        const detailContainer = document.getElementById("restaurantDetail");
        if (detailContainer) {
            detailContainer.appendChild(errorDiv);
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
