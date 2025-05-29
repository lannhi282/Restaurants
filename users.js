// API Base URL
const API_BASE_URL = "http://localhost:5000/api";

// Global variables
let usersData = [];
let statsData = {};
let cuisineChartInstance = null;
let paymentChartInstance = null;
let ageChartInstance = null;
let personalityChartInstance = null;

// DOM Elements
const loadingSpinner = document.getElementById("loadingSpinner");
const usersGrid = document.getElementById("usersGrid");

// API Functions
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/all`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch users`);
        }
        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error("Error fetching users:", error);
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

async function loadDataFromAPI() {
    try {
        showLoading();

        // Load users and stats in parallel
        const [users, stats] = await Promise.all([fetchUsers(), fetchStats()]);

        usersData = users;
        statsData = stats;

        hideLoading();
        displayUsers();
        generateCharts();
    } catch (error) {
        console.error("Error loading data:", error);
        showError("Không thể tải dữ liệu người dùng. Vui lòng kiểm tra kết nối server.");
        hideLoading();
    }
}

function setupEventListeners() {
    window.addEventListener("resize", generateCharts);

    const navToggle = document.querySelector(".nav-toggle");
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

function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "flex";
    }
    if (usersGrid) {
        usersGrid.style.display = "none";
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = "none";
    }
    if (usersGrid) {
        usersGrid.style.display = "grid";
    }
}

function showError(message) {
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById("users-error-message");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "users-error-message";
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

        // Insert before users grid
        if (usersGrid && usersGrid.parentNode) {
            usersGrid.parentNode.insertBefore(errorDiv, usersGrid);
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

function displayUsers() {
    if (!usersGrid) return;

    usersGrid.innerHTML = "";

    if (usersData.length === 0) {
        usersGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-user"></i>
                <h3>Không tìm thấy người dùng nào</h3>
                <p>Thử tải lại trang hoặc kiểm tra dữ liệu</p>
            </div>
        `;
        return;
    }

    usersData.forEach((user) => {
        const userCard = document.createElement("a");
        userCard.className = "user-card compact";
        userCard.href = `user-detail.html?userID=${user.userID}`;

        const cuisines = user.cuisine_preferences || [];
        const age = user.birth_year ? new Date().getFullYear() - user.birth_year : null;

        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div>
                    <div class="user-name">Người dùng ${user.userID}</div>
                </div>
            </div>
            <div class="user-info">
                <div class="user-details">
                    <div class="user-detail-item">
                        <i class="fas fa-utensils"></i>
                        <span>Ẩm thực: ${cuisines.slice(0, 2).join(", ") || "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Ngân sách: ${getBudgetDisplay(user.budget)}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span>Tuổi: ${age || "N/A"}</span>
                    </div>
                    <div class="user-detail-item">
                        <i class="fas fa-star"></i>
                        <span>Đánh giá: ${user.total_ratings} (TB: ${user.average_rating})</span>
                    </div>
                </div>
            </div>
        `;

        usersGrid.appendChild(userCard);
    });
}

function generateCharts() {
    // Destroy existing charts
    if (cuisineChartInstance) cuisineChartInstance.destroy();
    if (paymentChartInstance) paymentChartInstance.destroy();
    if (ageChartInstance) ageChartInstance.destroy();
    if (personalityChartInstance) personalityChartInstance.destroy();

    // Generate cuisine chart from stats data
    const cuisineCtx = document.getElementById("cuisineChart");
    if (cuisineCtx && statsData.user_cuisine_preferences) {
        const cuisineCounts = statsData.user_cuisine_preferences;

        cuisineChartInstance = new Chart(cuisineCtx.getContext("2d"), {
            type: "pie",
            data: {
                labels: Object.keys(cuisineCounts),
                datasets: [
                    {
                        data: Object.values(cuisineCounts),
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"],
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: "Loại Ẩm Thực Phổ Biến" },
                },
            },
        });
    }

    // Generate payment chart from stats data
    const paymentCtx = document.getElementById("paymentChart");
    if (paymentCtx && statsData.user_payment_preferences) {
        const paymentCounts = statsData.user_payment_preferences;

        paymentChartInstance = new Chart(paymentCtx.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: Object.keys(paymentCounts),
                datasets: [
                    {
                        data: Object.values(paymentCounts),
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: "Phương Thức Thanh Toán" },
                },
            },
        });
    }

    // Generate age distribution chart
    const ageCtx = document.getElementById("ageChart");
    if (ageCtx && usersData.length > 0) {
        const ageGroups = {
            "Dưới 20": 0,
            "20-30": 0,
            "31-40": 0,
            "41-50": 0,
            "Trên 50": 0,
        };

        usersData.forEach((user) => {
            if (user.birth_year) {
                const age = new Date().getFullYear() - user.birth_year;
                if (age < 20) ageGroups["Dưới 20"]++;
                else if (age <= 30) ageGroups["20-30"]++;
                else if (age <= 40) ageGroups["31-40"]++;
                else if (age <= 50) ageGroups["41-50"]++;
                else ageGroups["Trên 50"]++;
            }
        });

        ageChartInstance = new Chart(ageCtx.getContext("2d"), {
            type: "bar",
            data: {
                labels: Object.keys(ageGroups),
                datasets: [
                    {
                        label: "Số lượng người dùng",
                        data: Object.values(ageGroups),
                        backgroundColor: "#36A2EB",
                        borderColor: "#333",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Số lượng người dùng" },
                    },
                    x: {
                        title: { display: true, text: "Nhóm tuổi" },
                    },
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Phân bố độ tuổi người dùng" },
                },
            },
        });
    }
}

// Utility functions for display mapping
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

function toggleMobileNav() {
    const navMenu = document.querySelector(".nav-menu");
    if (navMenu) {
        navMenu.classList.toggle("active");
    }
}
