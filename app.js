/* ==========================================================================
   ApexPOS - Core Application Logic & State Controller
   ========================================================================== */

// Global Electron IPC Bridge detection (safe top-level declaration)
let isElectron = false;
let ipcRenderer = null;
try {
    if (typeof require !== 'undefined') {
        const electron = require('electron');
        if (electron && electron.ipcRenderer) {
            isElectron = true;
            ipcRenderer = electron.ipcRenderer;
        }
    }
} catch (e) {
    // Non-electron runtime
}

// Custom alert system to override the browser default alert popup
window.alert = function(message, callback) {
    let overlay = document.getElementById("custom-alert-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "custom-alert-overlay";
        overlay.className = "custom-alert-overlay";
        overlay.innerHTML = `
            <div class="custom-alert-card" id="custom-alert-card">
                <div class="custom-alert-header">
                    <div class="custom-alert-icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <div class="custom-alert-title">System Message</div>
                </div>
                <div class="custom-alert-body" id="custom-alert-body-content"></div>
                <div class="custom-alert-footer">
                    <button class="custom-alert-btn" id="custom-alert-confirm-btn">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const bodyContent = document.getElementById("custom-alert-body-content");
    const confirmBtn = document.getElementById("custom-alert-confirm-btn");

    bodyContent.textContent = message;

    // Show the modal
    setTimeout(() => {
        overlay.classList.add("active");
    }, 10);

    const handleConfirm = () => {
        overlay.classList.remove("active");
        confirmBtn.removeEventListener("click", handleConfirm);
        document.removeEventListener("keydown", handleKeyDown);
        if (typeof callback === "function") {
            callback();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
            e.preventDefault();
            handleConfirm();
        }
    };

    confirmBtn.addEventListener("click", handleConfirm);
    document.addEventListener("keydown", handleKeyDown);
};

// 1. Initial Default Product Inventory Database
const DEFAULT_PRODUCTS = [
    { code: "P001", name: "Chicken hot dog", category: "Burgers", price: 250.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Chicken hot dog" },
    { code: "P002", name: "Chicken Burger", category: "Burgers", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Chicken Burger" },
    { code: "P003", name: "Spicy Chicken Burger", category: "Burgers", price: 300.00, cost: 220.00, stock: 50, alertLevel: 10, description: "Spicy Chicken Burger" },
    { code: "P004", name: "Fish Burger", category: "Burgers", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Fish Burger" },
    { code: "P005", name: "Crispy chicken Burger", category: "Burgers", price: 350.00, cost: 280.00, stock: 50, alertLevel: 10, description: "Crispy chicken Burger" },
    { code: "P006", name: "Sausage Burger", category: "Burgers", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Sausage Burger" },
    { code: "P007", name: "Egg Burger", category: "Burgers", price: 230.00, cost: 180.00, stock: 50, alertLevel: 10, description: "Egg Burger" },
    { code: "P008", name: "Vege Burger", category: "Burgers", price: 160.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Vege Burger" },
    { code: "P009", name: "Spicy Chicken mini sub", category: "Subs & Sandwiches", price: 300.00, cost: 220.00, stock: 50, alertLevel: 10, description: "Spicy Chicken mini sub" },
    { code: "P010", name: "Crispy Chicken mini sub", category: "Subs & Sandwiches", price: 350.00, cost: 280.00, stock: 50, alertLevel: 10, description: "Crispy Chicken mini sub" },
    { code: "P011", name: "Egg N mayo Mini sub", category: "Subs & Sandwiches", price: 230.00, cost: 180.00, stock: 50, alertLevel: 10, description: "Egg N mayo Mini sub" },
    { code: "P012", name: "Vege Sub", category: "Subs & Sandwiches", price: 160.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Vege Sub" },
    { code: "P013", name: "Drumstick Sub Chicken", category: "Subs & Sandwiches", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Drumstick Sub Chicken" },
    { code: "P014", name: "Fish Sub", category: "Subs & Sandwiches", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Fish Sub" },
    { code: "P015", name: "Egg N Mayo Sandwich", category: "Subs & Sandwiches", price: 200.00, cost: 140.00, stock: 50, alertLevel: 10, description: "Egg N Mayo Sandwich" },
    { code: "P016", name: "Vege Sandwich", category: "Subs & Sandwiches", price: 160.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Vege Sandwich" },
    { code: "P017", name: "Chicken Sandwich", category: "Subs & Sandwiches", price: 230.00, cost: 180.00, stock: 50, alertLevel: 10, description: "Chicken Sandwich" },
    { code: "P018", name: "Fish roll", category: "Short Eats", price: 120.00, cost: 80.00, stock: 50, alertLevel: 10, description: "Fish roll" },
    { code: "P019", name: "Chicken roll", category: "Short Eats", price: 120.00, cost: 80.00, stock: 50, alertLevel: 10, description: "Chicken roll" },
    { code: "P020", name: "Chicken patty", category: "Short Eats", price: 130.00, cost: 80.00, stock: 50, alertLevel: 10, description: "Chicken patty" },
    { code: "P021", name: "Chicken samosa", category: "Short Eats", price: 120.00, cost: 80.00, stock: 50, alertLevel: 10, description: "Chicken samosa" },
    { code: "P022", name: "Vege rolls", category: "Short Eats", price: 100.00, cost: 60.00, stock: 50, alertLevel: 10, description: "Vege rolls" },
    { code: "P023", name: "Egg Rolls", category: "Short Eats", price: 150.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Egg Rolls" },
    { code: "P024", name: "Fish Pastry", category: "Short Eats", price: 150.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Fish Pastry" },
    { code: "P025", name: "Egg Pastry", category: "Short Eats", price: 150.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Egg Pastry" },
    { code: "P026", name: "Sausage Pastry", category: "Short Eats", price: 150.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Sausage Pastry" },
    { code: "P027", name: "Chicken Pastry", category: "Short Eats", price: 150.00, cost: 120.00, stock: 50, alertLevel: 10, description: "Chicken Pastry" },
    { code: "P028", name: "Rice N Curry chicken", category: "Rice & Noodles", price: 550.00, cost: 430.00, stock: 50, alertLevel: 10, description: "Rice N Curry chicken" },
    { code: "P029", name: "Rice N Curry Fish", category: "Rice & Noodles", price: 550.00, cost: 430.00, stock: 50, alertLevel: 10, description: "Rice N Curry Fish" },
    { code: "P030", name: "Fried Rice Chicken", category: "Rice & Noodles", price: 600.00, cost: 450.00, stock: 50, alertLevel: 10, description: "Fried Rice Chicken" },
    { code: "P031", name: "Chicken Biriyani", category: "Rice & Noodles", price: 650.00, cost: 500.00, stock: 50, alertLevel: 10, description: "Chicken Biriyani" },
    { code: "P032", name: "Yellow Rice", category: "Rice & Noodles", price: 650.00, cost: 450.00, stock: 50, alertLevel: 10, description: "Yellow Rice" },
    { code: "P033", name: "Koththu Mee Noodle Cup", category: "Rice & Noodles", price: 280.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Koththu Mee Noodle Cup" },
    { code: "P034", name: "Faluda", category: "Beverages", price: 250.00, cost: 200.00, stock: 50, alertLevel: 10, description: "Faluda" },
    { code: "P035", name: "Chocolate Milkshake", category: "Beverages", price: 400.00, cost: 300.00, stock: 50, alertLevel: 10, description: "Chocolate Milkshake" },
    { code: "P036", name: "Vanila milkshake", category: "Beverages", price: 400.00, cost: 300.00, stock: 50, alertLevel: 10, description: "Vanila milkshake" },
    { code: "P037", name: "Strawberry Milkshake", category: "Beverages", price: 400.00, cost: 300.00, stock: 50, alertLevel: 10, description: "Strawberry Milkshake" },
    { code: "P038", name: "Mango Mint Fizzy", category: "Beverages", price: 350.00, cost: 250.00, stock: 50, alertLevel: 10, description: "Mango Mint Fizzy" },
    { code: "P039", name: "Lime Fizzy", category: "Beverages", price: 350.00, cost: 250.00, stock: 50, alertLevel: 10, description: "Lime Fizzy" },
    { code: "P040", name: "Passion Mint Fizzy", category: "Beverages", price: 350.00, cost: 250.00, stock: 50, alertLevel: 10, description: "Passion Mint Fizzy" },
    { code: "P041", name: "Sun Crush 250ml", category: "Beverages", price: 150.00, cost: 132.00, stock: 50, alertLevel: 10, description: "Sun Crush 250ml" },
    { code: "P042", name: "Spinner Energy Drink 250ml", category: "Beverages", price: 350.00, cost: 308.00, stock: 50, alertLevel: 10, description: "Spinner Energy Drink 250ml" },
    { code: "P043", name: "Red bull", category: "Beverages", price: 750.00, cost: 635.00, stock: 50, alertLevel: 10, description: "Red bull" },
    { code: "P044", name: "Pepsi 250 ml", category: "Beverages", price: 120.00, cost: 111.00, stock: 50, alertLevel: 10, description: "Pepsi 250 ml" },
    { code: "P045", name: "Sting 250 ml", category: "Beverages", price: 120.00, cost: 111.00, stock: 50, alertLevel: 10, description: "Sting 250 ml" },
    { code: "P046", name: "Mountain dew 250ml", category: "Beverages", price: 120.00, cost: 111.00, stock: 50, alertLevel: 10, description: "Mountain dew 250ml" },
    { code: "P047", name: "7 Up 250ml", category: "Beverages", price: 120.00, cost: 111.00, stock: 50, alertLevel: 10, description: "7 Up 250ml" },
    { code: "P048", name: "Zingo Ole 250 ml", category: "Beverages", price: 100.00, cost: 92.00, stock: 50, alertLevel: 10, description: "Zingo Ole 250 ml" },
    { code: "P049", name: "Cream soda Ole 250 ml", category: "Beverages", price: 100.00, cost: 92.00, stock: 50, alertLevel: 10, description: "Cream soda Ole 250 ml" },
    { code: "P050", name: "Mirinda 250 ml", category: "Beverages", price: 120.00, cost: 111.00, stock: 50, alertLevel: 10, description: "Mirinda 250 ml" },
    { code: "P051", name: "Nestle Milo 180ml", category: "Beverages", price: 130.00, cost: 113.00, stock: 50, alertLevel: 10, description: "Nestle Milo 180ml" },
    { code: "P052", name: "Iced coffee 180 ml", category: "Beverages", price: 150.00, cost: 136.00, stock: 50, alertLevel: 10, description: "Iced coffee 180 ml" },
    { code: "P053", name: "Highland Kal Kiri Chocolate Bottle", category: "Beverages", price: 250.00, cost: 208.00, stock: 50, alertLevel: 10, description: "Highland Kal Kiri Chocolate Bottle" },
    { code: "P054", name: "Highland Kal kiri Vanilla Bottle", category: "Beverages", price: 250.00, cost: 208.00, stock: 50, alertLevel: 10, description: "Highland Kal kiri Vanilla Bottle" },
    { code: "P055", name: "Choco fingers 40 g", category: "Chocolates & Snacks", price: 100.00, cost: 90.00, stock: 50, alertLevel: 10, description: "Choco fingers 40 g" },
    { code: "P056", name: "Chunky choc 60 g", category: "Chocolates & Snacks", price: 120.00, cost: 108.00, stock: 50, alertLevel: 10, description: "Chunky choc 60 g" },
    { code: "P057", name: "Choco Mo 40 g", category: "Chocolates & Snacks", price: 120.00, cost: 108.00, stock: 50, alertLevel: 10, description: "Choco Mo 40 g" },
    { code: "P058", name: "Choky Bar 25g", category: "Chocolates & Snacks", price: 70.00, cost: 63.00, stock: 50, alertLevel: 10, description: "Choky Bar 25g" },
    { code: "P059", name: "Tropica 26g", category: "Chocolates & Snacks", price: 70.00, cost: 63.00, stock: 50, alertLevel: 10, description: "Tropica 26g" },
    { code: "P060", name: "Black Magic 20 g", category: "Chocolates & Snacks", price: 60.00, cost: 54.00, stock: 50, alertLevel: 10, description: "Black Magic 20 g" },
    { code: "P061", name: "Rollo 30 g", category: "Chocolates & Snacks", price: 80.00, cost: 68.00, stock: 50, alertLevel: 10, description: "Rollo 30 g" },
    { code: "P062", name: "Go choc 30 g", category: "Chocolates & Snacks", price: 80.00, cost: 68.00, stock: 50, alertLevel: 10, description: "Go choc 30 g" },
    { code: "P063", name: "4Gb Cereal bar", category: "Chocolates & Snacks", price: 40.00, cost: 36.00, stock: 50, alertLevel: 10, description: "4Gb Cereal bar" },
    { code: "P064", name: "Chick Bits 30 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Chick Bits 30 g" },
    { code: "P065", name: "Snackers Masala 25 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Snackers Masala 25 g" },
    { code: "P066", name: "Snackers Sweet Chille 25g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Snackers Sweet Chille 25g" },
    { code: "P067", name: "Snackers cheese and Chilie 25 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Snackers cheese and Chilie 25 g" },
    { code: "P068", name: "Snackers Korean Ramen 25 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Snackers Korean Ramen 25 g" },
    { code: "P069", name: "Tempo Cheese and Onion 25 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Tempo Cheese and Onion 25 g" },
    { code: "P070", name: "Tempo Koththu 25 g", category: "Chocolates & Snacks", price: 50.00, cost: 45.00, stock: 50, alertLevel: 10, description: "Tempo Koththu 25 g" },
    { code: "P071", name: "Real Temtation 25 g", category: "Chocolates & Snacks", price: 100.00, cost: 90.00, stock: 50, alertLevel: 10, description: "Real Temtation 25 g" },
    { code: "P072", name: "Casava Chips salt 50g", category: "Chips", price: 170.00, cost: 153.00, stock: 50, alertLevel: 10, description: "Casava Chips salt 50g" },
    { code: "P073", name: "Casava Chips Hot N Spicy 50g", category: "Chips", price: 170.00, cost: 153.00, stock: 50, alertLevel: 10, description: "Casava Chips Hot N Spicy 50g" },
    { code: "P074", name: "Casava Chips Cheese N Onion 50g", category: "Chips", price: 170.00, cost: 153.00, stock: 50, alertLevel: 10, description: "Casava Chips Cheese N Onion 50g" },
    { code: "P075", name: "Casava Chips Kochchi 50g", category: "Chips", price: 170.00, cost: 153.00, stock: 50, alertLevel: 10, description: "Casava Chips Kochchi 50g" }
];

const DEFAULT_SETTINGS = {
    companyName: "Apex Retail (Pvt) Ltd",
    companyAddress: "No 15, Galle Road, Colombo 03, Sri Lanka",
    companyPhone: "+94 11 234 5678",
    adminPasscode: "admin123",
    ebillEnabled: false,
    smsMethod: "gateway",
    smsUserId: "",
    smsApiKey: "",
    smsSenderId: "NotifyDEMO",
    autoLaunchEnabled: false,
    customerDisplayEnabled: false,
    silentPrintEnabled: true,
    autoPrintKot: true
};

// 2. Application State Management
let products = [];
let cart = [];
let transactions = [];
let zReports = [];
let heldCarts = [];
let settings = {};

let selectedCategory = "All";
let searchQuery = "";
let cartDiscount = { type: "percent", value: 0 };
let currentPaymentMode = "cash";
let cashTendered = "";
let cardInputMode = "terminal"; // 'terminal' or 'manual'
let selectedCardBrand = "Visa";
let currentCheckoutTotal = 0;
let editProductIndex = null;
let isAdminAuthenticated = false;
let currentReportType = "category";
let orderNote = ""; // Order-level note / instruction

// Chart references to prevent canvas reuse errors
let salesTrendChartRef = null;
let paymentMethodsChartRef = null;
let bestSellersChartRef = null;

// ==========================================================================
// Performance helpers
// ==========================================================================

// Inline SVG strings (avoid repeated lucide.createIcons() on every render)
const SVG_X = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const SVG_PKG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
const SVG_BAG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.25"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

// Simple debounce utility
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Splash screen dismiss
function dismissSplash() {
    const splash = document.getElementById("app-loading-splash");
    if (!splash) return;
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    setTimeout(() => splash.remove(), 450);
}

// Animate splash progress bar
function animateSplashProgress(targetPct, label) {
    const bar = document.getElementById("splash-progress-bar");
    if (bar) bar.style.width = targetPct + "%";
}

// Toast helper
function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.style.cssText = `
        background: #111827;
        color: #f1f5f9;
        border: 1px solid rgba(16, 185, 129, 0.25);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
    `;
    
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Wait for lucide to be available (since it's deferred)
function waitForLucide(callback) {
    if (typeof lucide !== "undefined") {
        callback();
    } else {
        const check = setInterval(() => {
            if (typeof lucide !== "undefined") {
                clearInterval(check);
                callback();
            }
        }, 20);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Show progress immediately
    animateSplashProgress(30);
    
    // 1. Instantly load from local storage cache for zero-latency startup
    loadDatabaseLocal();
    animateSplashProgress(55);
    
    initClock();
    setupRouting();
    setupCartControls();
    setupScannerSimulator();
    setupCheckoutModalHandlers();
    setupInventoryHandlers();
    setupReportsHandlers();
    setupTransactionsHandlers();
    setupSettingsHandlers();
    setupMobileHandlers();
    animateSplashProgress(80);
    
    // Initial UI render (with cached local data)
    renderCategories();
    renderProductsGrid();
    renderCart();
    animateSplashProgress(95);
    
    // Wait for Lucide (deferred), then create icons once and dismiss splash
    waitForLucide(() => {
        lucide.createIcons();
        animateSplashProgress(100);
        setTimeout(dismissSplash, 300);
    });

    // 2. Perform background synchronization with Firestore without blocking the UI
    syncDatabaseCloud();
});


// Helper: apply E-Bill toggle visual state + show/hide settings + checkout phone field
function applyEbillToggleState(enabled) {
    const track = document.getElementById("ebill-toggle-track");
    const thumb = document.getElementById("ebill-toggle-thumb");
    const allSettings = document.getElementById("sms-all-settings");
    const phoneRow = document.getElementById("checkout-phone-row");

    if (track) track.style.background = enabled ? "var(--color-primary)" : "#374151";
    if (thumb) thumb.style.transform = enabled ? "translateX(20px)" : "translateX(0)";
    if (allSettings) allSettings.style.display = enabled ? "block" : "none";
    if (phoneRow) phoneRow.style.display = "block"; // Always accessible for WhatsApp & SMS
}

// Load variables from localStorage instantly for fast page rendering
function loadDatabaseLocal() {
    db._loadFromLocalStorage();
    
    // Set settings inputs values
    const setCompany = document.getElementById("set-company-name");
    if (setCompany) setCompany.value = settings.companyName || "";
    const setAddress = document.getElementById("set-company-address");
    if (setAddress) setAddress.value = settings.companyAddress || "";
    const setPhone = document.getElementById("set-company-phone");
    if (setPhone) setPhone.value = settings.companyPhone || "";
    
    const setSmsUserId = document.getElementById("set-sms-userid");
    if (setSmsUserId) setSmsUserId.value = settings.smsUserId || "";
    const setSmsApiKey = document.getElementById("set-sms-apikey");
    if (setSmsApiKey) setSmsApiKey.value = settings.smsApiKey || "";
    const setSmsSenderId = document.getElementById("set-sms-senderid");
    if (setSmsSenderId) setSmsSenderId.value = settings.smsSenderId || "NotifyDEMO";

    const setSmsMethod = document.getElementById("set-sms-method");
    if (setSmsMethod) {
        setSmsMethod.value = settings.smsMethod || "gateway";
        const gatewayFields = document.getElementById("sms-gateway-fields");
        if (gatewayFields) {
            gatewayFields.style.display = setSmsMethod.value === "gateway" ? "block" : "none";
        }
    }

    // E-Bill toggle
    const ebillChk = document.getElementById("set-ebill-enabled");
    const enabled = settings.ebillEnabled === true;
    if (ebillChk) ebillChk.checked = enabled;
    applyEbillToggleState(enabled);

    // Auto-Print KOT toggle
    const autoKotChk = document.getElementById("set-auto-kot-checkbox");
    const autoKotStatus = settings.autoPrintKot !== false;
    if (autoKotChk) autoKotChk.checked = autoKotStatus;
    applyToggleUI("autokot", autoKotStatus);
    
    updateHeldCartBadge();
}

// Callback handler for real-time sync updates from Firestore
function handleRealtimeSyncUpdate(type) {
    console.log(`[ApexPOS] ☁️ Real-time cloud sync update received for: ${type}`);
    
    if (type === 'products') {
        renderCategories();
        renderProductsGrid();
        // Also refresh back-office inventory table if active
        const activeTab = document.querySelector(".admin-tab-content.active");
        if (activeTab && activeTab.id === "tab-inventory") {
            renderInventoryTable();
        }
    }
    
    if (type === 'transactions') {
        // Update cashier grid to reflect any stock updates from sales on other terminals
        renderProductsGrid();
        renderCart();
        // Refresh analytics and transactions log
        renderAnalyticsCharts();
        renderTransactionsTable();
    }
    
    if (type === 'zReports') {
        renderZReportsTab();
    }
    
    if (type === 'settings') {
        // Re-apply settings input values if they changed in the cloud
        const setCompany = document.getElementById("set-company-name");
        if (setCompany) setCompany.value = settings.companyName || "";
        const setAddress = document.getElementById("set-company-address");
        if (setAddress) setAddress.value = settings.companyAddress || "";
        const setPhone = document.getElementById("set-company-phone");
        if (setPhone) setPhone.value = settings.companyPhone || "";
        
        const setSmsUserId = document.getElementById("set-sms-userid");
        if (setSmsUserId) setSmsUserId.value = settings.smsUserId || "";
        const setSmsApiKey = document.getElementById("set-sms-apikey");
        if (setSmsApiKey) setSmsApiKey.value = settings.smsApiKey || "";
        const setSmsSenderId = document.getElementById("set-sms-senderid");
        if (setSmsSenderId) setSmsSenderId.value = settings.smsSenderId || "NotifyDEMO";

        const setSmsMethod = document.getElementById("set-sms-method");
        if (setSmsMethod) {
            setSmsMethod.value = settings.smsMethod || "gateway";
            const gatewayFields = document.getElementById("sms-gateway-fields");
            if (gatewayFields) {
                gatewayFields.style.display = setSmsMethod.value === "gateway" ? "block" : "none";
            }
        }

        // Sync E-Bill toggle
        const ebillChk = document.getElementById("set-ebill-enabled");
        const enabled = settings.ebillEnabled === true;
        if (ebillChk) ebillChk.checked = enabled;
        applyEbillToggleState(enabled);

        // Sync Auto-Print KOT toggle
        const autoKotChk = document.getElementById("set-auto-kot-checkbox");
        const autoKotStatus = settings.autoPrintKot !== false;
        if (autoKotChk) autoKotChk.checked = autoKotStatus;
        applyToggleUI("autokot", autoKotStatus);
    }
    
    if (type === 'heldCarts') {
        updateHeldCartBadge();
    }
    
    // Refresh icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

// Background sync from Cloud Firestore (re-renders UI silently once loaded)
async function syncDatabaseCloud() {
    if (!db.isCloud()) return;
    
    console.log('[ApexPOS] ☁️ Registering real-time cloud database synchronization...');
    try {
        await db.init(handleRealtimeSyncUpdate);
        console.log('[ApexPOS] ☁️ Real-time sync listeners registered successfully.');
    } catch (error) {
        console.error('[ApexPOS] Real-time cloud sync registration failed:', error);
    }
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function persistState() {
    // Cart data saves immediately (localStorage for speed — critical for active session)
    db.saveActiveCart(cart);
    updateHeldCartBadge();
}

function persistHeldCarts() {
    db.saveHeldCarts(heldCarts).catch(err => console.error('[ApexPOS] Failed to save held carts:', err));
}


// ==========================================================================
// Navigation & Router Setup
// ==========================================================================
function switchView(target) {
    const mainNavButtons = document.querySelectorAll(".main-nav .nav-btn");
    const viewPanels = document.querySelectorAll(".view-panel");

    mainNavButtons.forEach(b => {
        if (b.getAttribute("data-target") === target) {
            b.classList.add("active");
        } else {
            b.classList.remove("active");
        }
    });
    
    viewPanels.forEach(panel => {
        if (panel.id === target) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    if (target === "admin-view") {
        triggerAdminTabRefresh();
    }
}

function setupAdminAuth() {
    const authForm = document.getElementById("admin-auth-form");
    const passcodeVal = document.getElementById("admin-passcode-input");
    const errorMsg = document.getElementById("auth-error-msg");
    
    authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pwd = passcodeVal.value;
        const correctPwd = settings.adminPasscode || "admin123";
        
        if (pwd === correctPwd) {
            isAdminAuthenticated = true;
            errorMsg.style.display = "none";
            document.getElementById("admin-auth-modal").classList.remove("active");
            switchView("admin-view");
        } else {
            errorMsg.style.display = "block";
            passcodeVal.value = "";
            passcodeVal.focus();
        }
    });
}

function setupRouting() {
    const mainNavButtons = document.querySelectorAll(".main-nav .nav-btn");
    setupAdminAuth();

    mainNavButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            
            if (target === "admin-view" && !isAdminAuthenticated) {
                document.getElementById("auth-error-msg").style.display = "none";
                document.getElementById("admin-passcode-input").value = "";
                document.getElementById("admin-auth-modal").classList.add("active");
                setTimeout(() => document.getElementById("admin-passcode-input").focus(), 150);
                return;
            }
            
            switchView(target);
        });
    });

    // Admin Sidebar Tabs Routing
    const adminSidebarButtons = document.querySelectorAll(".admin-sidebar .admin-nav-btn");
    const adminTabContents = document.querySelectorAll(".admin-tab-content");

    adminSidebarButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            adminSidebarButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            adminTabContents.forEach(tab => {
                if (tab.id === targetTab) {
                    tab.classList.add("active");
                } else {
                    tab.classList.remove("active");
                }
            });

            if (targetTab === "tab-analytics") {
                renderAnalyticsCharts();
            } else if (targetTab === "tab-inventory") {
                renderInventoryTable();
            } else if (targetTab === "tab-zreports") {
                renderZReportsTab();
            } else if (targetTab === "tab-transactions") {
                renderTransactionsTable();
            } else if (targetTab === "tab-reports") {
                renderAdvancedReports();
            }
        });
    });

    const lockBtn = document.getElementById("btn-lock-terminal");
    if (lockBtn) {
        lockBtn.addEventListener("click", logoutUser);
    }
}

function logoutUser() {
    if (confirm("Are you sure you want to lock the terminal and log out?")) {
        sessionStorage.removeItem("apexpos_login_role");
        window.location.replace("login.html");
    }
}

function triggerAdminTabRefresh() {
    const activeAdminTab = document.querySelector(".admin-tab-content.active");
    if (!activeAdminTab) return;
    if (activeAdminTab.id === "tab-analytics") {
        renderAnalyticsCharts();
    } else if (activeAdminTab.id === "tab-inventory") {
        renderInventoryTable();
    } else if (activeAdminTab.id === "tab-zreports") {
        renderZReportsTab();
    } else if (activeAdminTab.id === "tab-transactions") {
        renderTransactionsTable();
    } else if (activeAdminTab.id === "tab-reports") {
        renderAdvancedReports();
    }
}

// Clock updates
function initClock() {
    const timeEl = document.getElementById("current-time");
    const dateEl = document.getElementById("current-date");
    
    function tick() {
        const now = new Date();
        // Time format: HH:MM:SS AM/PM
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        timeEl.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
        
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    tick();
    setInterval(tick, 1000);
}

// ==========================================================================
// Catalog Display & Categories Filter
// ==========================================================================

function renderCategories() {
    const container = document.getElementById("category-tabs-container");
    
    // Extract unique categories in inventory
    const categoriesSet = new Set(products.map(p => p.category));
    const categoriesList = ["All", ...Array.from(categoriesSet)];
    
    container.innerHTML = "";
    categoriesList.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = `category-btn ${cat === selectedCategory ? "active" : ""}`;
        btn.textContent = cat;
        btn.addEventListener("click", () => {
            selectedCategory = cat;
            renderCategories();
            renderProductsGrid();
        });
        container.appendChild(btn);
    });
}

const CATEGORY_THEMES = {
    "Burgers": {
        grad: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a8 8 0 0 0-16 0"/><path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2"/><path d="M3 15h18"/><path d="m5 11 2 2 2-2 2 2 2-2 2 2 2-2 2 2"/></svg>`
    },
    "Subs & Sandwiches": {
        grad: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1H3v-1z"/><path d="M3 16a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-1H3v1z"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="8" cy="10" r="0.6" fill="#fff"/><circle cx="12" cy="9.5" r="0.6" fill="#fff"/><circle cx="16" cy="10" r="0.6" fill="#fff"/></svg>`
    },
    "Short Eats": {
        grad: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 7-4 13H8L4 9l8-7z"/><path d="M8 9l4 4 4-4"/><path d="M12 13v9"/></svg>`
    },
    "Rice & Noodles": {
        grad: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11c0 4.97 4.03 9 9 9s9-4.03 9-9H3z"/><path d="M7 21h10"/><path d="M8 4c0 2-1 3-1 4"/><path d="M12 3c0 2-1 3-1 5"/><path d="M16 4c0 2-1 3-1 4"/><line x1="20" y1="3" x2="16" y2="11"/></svg>`
    },
    "Beverages": {
        grad: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10l1-14H6L7 21z"/><path d="M5 7h14"/><line x1="12" y1="2" x2="15" y2="7"/><path d="M9 12h6"/></svg>`
    },
    "Chocolates & Snacks": {
        grad: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="9.33" x2="20" y2="9.33"/><line x1="4" y1="14.67" x2="20" y2="14.67"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`
    },
    "Chips": {
        grad: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10l2-13H5l2 13z"/><path d="M9 8V4"/><path d="M12 8V2"/><path d="M15 8V4"/><path d="M7 8V5"/></svg>`
    },
    "Groceries": {
        grad: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`
    },
    "Bakery": {
        grad: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)",
        svg: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 7-4 13H8L4 9l8-7z"/><path d="M8 9l4 4 4-4"/></svg>`
    }
};

function getCategoryTheme(cat) {
    if (!cat) return { grad: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", svg: SVG_PKG };
    if (CATEGORY_THEMES[cat]) return CATEGORY_THEMES[cat];
    const foundKey = Object.keys(CATEGORY_THEMES).find(k => k.toLowerCase() === cat.trim().toLowerCase());
    if (foundKey) return CATEGORY_THEMES[foundKey];
    return { grad: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", svg: SVG_PKG };
}

function renderProductsGrid() {
    const container = document.getElementById("products-grid-container");
    
    const filtered = products.filter(p => {
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state col-span-full">
                ${SVG_PKG}
                <p>No products found</p>
                <small>Try selecting a different category or clearing search query</small>
            </div>
        `;
        return;
    }

    // Build all cards in a DocumentFragment — single DOM write
    const fragment = document.createDocumentFragment();
    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = `product-card`;
        
        const theme = getCategoryTheme(p.category);

        card.innerHTML = `
            <div class="product-image-placeholder" style="background: ${theme.grad}; position: relative;">
                <span class="product-category-tag">${p.category}</span>
                <span class="product-code-tag">${p.code}</span>
                ${theme.svg}
            </div>
            <div class="product-details">
                <span class="product-title" title="${p.name}">${p.name}</span>
                <div class="product-price-row">
                    <div class="product-price-wrap">
                        <span class="product-currency">LKR</span>
                        <span class="product-price">${p.price.toFixed(2)}</span>
                    </div>
                    <div class="product-add-badge" title="Add to Order">+</div>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            addToCart(p.code);
        });

        fragment.appendChild(card);
    });

    // Single reflow: clear + insert all at once
    container.innerHTML = "";
    container.appendChild(fragment);
}


// Catalog Search Text Input handler — debounced so grid doesn't re-render every keystroke
const debouncedSearchRender = debounce(() => renderProductsGrid(), 180);
document.getElementById("catalog-search").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    const clearBtn = document.getElementById("clear-search-btn");
    clearBtn.style.display = searchQuery ? "block" : "none";
    debouncedSearchRender();
});

document.getElementById("clear-search-btn").addEventListener("click", () => {
    document.getElementById("catalog-search").value = "";
    searchQuery = "";
    document.getElementById("clear-search-btn").style.display = "none";
    renderProductsGrid();
});

// ==========================================================================
// Sales & Checkout Cart State Processor
// ==========================================================================

function setupCartControls() {
    // Discount value changed
    document.getElementById("cart-discount-input").addEventListener("input", (e) => {
        cartDiscount.value = parseFloat(e.target.value) || 0;
        renderCart();
    });

    // Discount type toggled (%) or Flat currency LKR
    document.getElementById("btn-discount-toggle").addEventListener("click", () => {
        const btn = document.getElementById("btn-discount-toggle");
        if (cartDiscount.type === "percent") {
            cartDiscount.type = "flat";
            btn.textContent = "LKR";
        } else {
            cartDiscount.type = "percent";
            btn.textContent = "%";
        }
        renderCart();
    });

    // Clear entire cart
    document.getElementById("btn-clear-cart").addEventListener("click", () => {
        if (cart.length > 0) {
            cart = [];
            cartDiscount.value = 0;
            orderNote = "";
            document.getElementById("cart-discount-input").value = "";
            const noteEl = document.getElementById("cart-order-note");
            if (noteEl) noteEl.value = "";
            renderCart();
            persistState();
        }
    });

    // Open Cash Drawer button
    const btnDrawer = document.getElementById("btn-open-drawer");
    if (btnDrawer) {
        btnDrawer.addEventListener("click", () => {
            // Standard ESC/POS cash drawer pulse command (works via WebSerial if supported)
            if (navigator.serial) {
                // WebSerial: open drawer pulse
                navigator.serial.requestPort().then(port => {
                    return port.open({ baudRate: 9600 }).then(() => {
                        const writer = port.writable.getWriter();
                        const cmd = new Uint8Array([0x10, 0x14, 0x00, 0x01, 0x00]);
                        return writer.write(cmd).then(() => {
                            writer.releaseLock();
                            port.close();
                        });
                    });
                }).catch(() => {
                    showToast("💰 Cash Drawer — Open signal sent!");
                });
            } else {
                // Fallback: just show a toast (for browsers without WebSerial)
                showToast("💰 Cash Drawer — Open signal sent!");
            }
        });
    }

    // Park / Hold Order
    document.getElementById("btn-hold-order").addEventListener("click", () => {
        if (cart.length === 0) return;
        
        heldCarts.push({
            id: 'HC-' + Date.now().toString().slice(-5),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            items: [...cart],
            discount: { ...cartDiscount },
            note: orderNote
        });
        
        cart = [];
        cartDiscount.value = 0;
        orderNote = "";
        document.getElementById("cart-discount-input").value = "";
        const noteEl = document.getElementById("cart-order-note");
        if (noteEl) noteEl.value = "";
        
        renderCart();
        persistState();
        persistHeldCarts();
        alert("Cart parked successfully! You can recall it anytime.");
    });

    // Recall parked orders (opens selection modal queue)
    document.getElementById("btn-recall-order").addEventListener("click", showHeldOrdersModal);

    // Pay now trigger checkout F8
    document.getElementById("btn-trigger-checkout").addEventListener("click", openCheckoutModal);
    
    // Physical keyboard shortcut bindings
    window.addEventListener("keydown", (e) => {
        if (e.key === "F8") {
            e.preventDefault();
            openCheckoutModal();
        }
    });

    // KOT - Print Kitchen Ticket
    const btnKot = document.getElementById("btn-print-kot");
    if (btnKot) {
        btnKot.addEventListener("click", openKotModal);
    }

    // Qty entry modal numpad
    setupQtyEntryModal();
}

function updateHeldCartBadge() {
    document.getElementById("held-count").textContent = heldCarts.length;
}

// ==========================================================================
// KOT — Kitchen Order Ticket
// ==========================================================================

// ==========================================================================
// KOT — Kitchen Order Ticket Helpers & Auto-Printing
// ==========================================================================

function generateKotContent(items, note, kotId, txnDate) {
    const now = txnDate || new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB');
    const id = kotId || ("KOT-" + Date.now().toString().slice(-5));

    return `
        <div style="text-align:center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px;">KITCHEN ORDER</div>
            <div style="font-size: 12px; font-weight: 700; color: #333;">${settings.companyName || "Apex Retail"}</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: #000; font-weight: 700;">
            <span><strong>KOT#:</strong> ${id}</span>
            <span>${dateStr} ${timeStr}</span>
        </div>
        <div style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 8px 0; margin: 8px 0;">
            ${items.map(item => {
                const itemName = item.product ? item.product.name : (item.name || "Item");
                const itemQty = item.quantity !== undefined ? item.quantity : (item.qty || 1);
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 15px; border-bottom: 1px dotted #bbb;">
                        <span style="font-weight: 800; color: #000; flex: 1; padding-right: 8px;">${itemName}</span>
                        <span style="font-size: 20px; font-weight: 900; min-width: 40px; text-align: right; color: #000;">x${itemQty}</span>
                    </div>
                `;
            }).join("")}
        </div>
        ${note ? `<div style="margin-top: 8px; padding: 6px 8px; border: 2px solid #000; font-size: 13px; font-weight: 700; background: #f4f4f4;"><strong>Note:</strong> ${note}</div>` : ""}
        <div style="text-align:center; margin-top: 10px; font-size: 11px; font-weight: 700; color: #444; border-top: 1px dashed #000; padding-top: 6px;">*** Kitchen Copy Only ***</div>
    `;
}

function printKotDirect(kotContent) {
    if (typeof ipcRenderer !== "undefined" && ipcRenderer) {
        // In Electron: Send silent print command directly to kitchen thermal printer
        ipcRenderer.send('print-kot-silent', { htmlContent: kotContent, silent: true });
        if (typeof showToast === "function") showToast("🖨️ Auto-printed KOT to Kitchen Printer!");
        return;
    }

    // In Web Browser / Mobile: Print via invisible iframe without disrupting UI
    let printFrame = document.getElementById("kot-hidden-frame");
    if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "kot-hidden-frame";
        printFrame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(printFrame);
    }
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Kitchen Order Ticket</title>
            <style>
                @page { margin: 0; size: 80mm auto; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    margin: 0;
                    padding: 8px;
                    font-size: 13px;
                    width: 72mm;
                    color: #000;
                    background: #fff;
                }
            </style>
        </head>
        <body>
            ${kotContent}
        </body>
        </html>
    `);
    frameDoc.close();
    setTimeout(() => {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        } catch (e) {
            console.error("[ApexPOS] Print KOT error:", e);
        }
        if (typeof showToast === "function") showToast("🖨️ Kitchen Order Ticket (KOT) sent to printer!");
    }, 250);
}

function openKotModal() {
    if (cart.length === 0) {
        alert("Cart is empty. Add items before printing a kitchen ticket.");
        return;
    }

    const noteEl = document.getElementById("cart-order-note");
    const note = noteEl ? noteEl.value.trim() : "";
    const kotId = "KOT-" + Date.now().toString().slice(-5);
    const kotContent = generateKotContent(cart, note, kotId, new Date());

    document.getElementById("kot-print-area").innerHTML = kotContent;
    document.getElementById("kot-modal").classList.add("active");

    // KOT confirm button wires up print
    const btnConfirm = document.getElementById("btn-confirm-kot");
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    newBtnConfirm.addEventListener("click", () => {
        document.getElementById("kot-modal").classList.remove("active");
        printKotDirect(kotContent);
    });
}

// ==========================================================================
// Qty Entry Modal — Touch-friendly large numpad for quantity input
// ==========================================================================

let qtyEntryTargetCode = null;
let qtyEntryBuffer = "";

window.openQtyEntryModal = function(code) {
    const item = cart.find(i => i.product.code === code);
    if (!item) return;
    qtyEntryTargetCode = code;
    qtyEntryBuffer = String(item.quantity);
    document.getElementById("qty-entry-display").textContent = qtyEntryBuffer;
    document.getElementById("qty-entry-title").textContent = `Qty — ${item.product.name}`;
    document.getElementById("qty-entry-modal").classList.add("active");
};

window.closeQtyEntryModal = function() {
    document.getElementById("qty-entry-modal").classList.remove("active");
    qtyEntryTargetCode = null;
    qtyEntryBuffer = "";
};

function setupQtyEntryModal() {
    const display = document.getElementById("qty-entry-display");

    document.querySelectorAll(".qty-numpad-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-val");
            if (val === "C") {
                qtyEntryBuffer = "0";
            } else if (val === "DEL") {
                qtyEntryBuffer = qtyEntryBuffer.slice(0, -1) || "0";
            } else {
                if (qtyEntryBuffer === "0") {
                    qtyEntryBuffer = val;
                } else {
                    if (qtyEntryBuffer.length < 4) qtyEntryBuffer += val;
                }
            }
            if (display) display.textContent = qtyEntryBuffer || "0";
        });
    });

    const btnConfirm = document.getElementById("btn-confirm-qty-entry");
    if (btnConfirm) {
        btnConfirm.addEventListener("click", () => {
            const newQty = parseInt(qtyEntryBuffer) || 0;
            if (qtyEntryTargetCode) {
                updateCartQty(qtyEntryTargetCode, newQty);
            }
            closeQtyEntryModal();
        });
    }
}


function addToCart(code) {
    const prod = products.find(p => p.code === code);
    if (!prod) return;

    const existingCartItem = cart.find(item => item.product.code === code);
    
    if (existingCartItem) {
        existingCartItem.quantity++;
    } else {
        cart.push({
            product: prod,
            quantity: 1
        });
    }

    renderCart();
    persistState();
}

function updateCartQty(code, qty) {
    const item = cart.find(i => i.product.code === code);
    if (!item) return;

    const newQty = parseInt(qty);
    if (isNaN(newQty) || newQty <= 0) {
        removeFromCart(code);
        return;
    }

    item.quantity = newQty;

    renderCart();
    persistState();
}

function removeFromCart(code) {
    cart = cart.filter(i => i.product.code !== code);
    renderCart();
    persistState();
}

// Compute cart mathematical values (Tax-free calculations)
function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => {
        const price = item.overridePrice !== undefined ? item.overridePrice : item.product.price;
        return sum + (price * item.quantity);
    }, 0);
    
    // Cart Discount
    let discount = 0;
    if (cartDiscount.type === "percent") {
        discount = subtotal * (cartDiscount.value / 100);
    } else {
        discount = cartDiscount.value;
    }
    // Cap discount at subtotal
    discount = Math.min(subtotal, Math.max(0, discount));
    
    const grandTotal = subtotal - discount;

    return {
        subtotal,
        discount,
        grandTotal
    };
}

// Override price for a single cart item
window.overrideItemPrice = function(code) {
    const item = cart.find(i => i.product.code === code);
    if (!item) return;
    const currentPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.price;
    const input = prompt(`Override price for "${item.product.name}"\nOriginal: LKR ${item.product.price.toFixed(2)}\n\nEnter new price (LKR):`, currentPrice.toFixed(2));
    if (input === null) return; // cancelled
    const newPrice = parseFloat(input);
    if (isNaN(newPrice) || newPrice < 0) {
        alert("Invalid price entered. Please enter a positive number.");
        return;
    }
    item.overridePrice = newPrice;
    renderCart();
    persistState();
    showToast(`Price updated → LKR ${newPrice.toFixed(2)}`);
};

function renderCart() {
    const container = document.getElementById("cart-items-container");
    const totals = calculateCartTotals();
    
    // Update labels count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-item-count").textContent = `${totalItems} Item${totalItems === 1 ? '' : 's'}`;
    const mobileCartBadge = document.getElementById("mobile-cart-badge");
    if (mobileCartBadge) {
        mobileCartBadge.textContent = totalItems;
    }

    if (cart.length === 0) {
        const btnMobileShowCatalog = document.getElementById("btn-mobile-show-catalog");
        const btnMobileShowCart = document.getElementById("btn-mobile-show-cart");
        const cashierLayout = document.querySelector(".cashier-layout");
        if (btnMobileShowCatalog && btnMobileShowCart && cashierLayout) {
            btnMobileShowCatalog.classList.add("active");
            btnMobileShowCart.classList.remove("active");
            cashierLayout.classList.remove("show-cart-panel");
        }

        container.innerHTML = `
            <div class="cart-empty-state">
                ${SVG_BAG}
                <p>Cart is empty</p>
                <small>Select products or scan barcode to add</small>
            </div>
        `;
        document.getElementById("val-subtotal").textContent = "LKR 0.00";
        document.getElementById("val-discount").textContent = "- LKR 0.00";
        document.getElementById("val-net-subtotal").textContent = "LKR 0.00";
        document.getElementById("val-grand-total").textContent = "LKR 0.00";
        currentCheckoutTotal = 0;
        return;
    }

    // Build all rows in a DocumentFragment — single DOM write
    const fragment = document.createDocumentFragment();
    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item-row";
        const itemPrice = item.overridePrice !== undefined ? item.overridePrice : item.product.price;
        const lineTotal = itemPrice * item.quantity;
        row.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.product.name}</span>
                <span class="cart-item-subtext" style="display:flex;align-items:center;gap:6px;">
                    ${item.product.code} &times;
                    <span style="display:inline-flex;align-items:center;gap:3px;">
                        LKR ${itemPrice.toFixed(2)}
                        <button onclick="overrideItemPrice('${item.product.code}')" title="Edit price" style="
                            background:none;border:none;padding:2px 3px;cursor:pointer;
                            color:var(--text-muted);display:inline-flex;align-items:center;
                            border-radius:4px;transition:color 0.15s;
                        " onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--text-muted)'">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                    </span>
                </span>
            </div>
            
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateCartQty('${item.product.code}', ${item.quantity - 1})">-</button>
                <input type="text" class="qty-input" value="${item.quantity}" readonly
                    onclick="openQtyEntryModal('${item.product.code}')"
                    style="cursor:pointer;"
                    title="Tap to enter quantity">
                <button class="qty-btn" onclick="updateCartQty('${item.product.code}', ${item.quantity + 1})">+</button>
            </div>

            <span class="cart-item-price-sum">LKR ${lineTotal.toFixed(2)}</span>

            <button class="btn-qty-delete" onclick="removeFromCart('${item.product.code}')">
                ${SVG_X}
            </button>
        `;
        fragment.appendChild(row);
    });

    container.innerHTML = "";
    container.appendChild(fragment);

    // Populate Pricing numbers in cart panel footer
    document.getElementById("val-subtotal").textContent = `LKR ${totals.subtotal.toFixed(2)}`;
    document.getElementById("val-discount").textContent = `- LKR ${totals.discount.toFixed(2)}`;
    document.getElementById("val-net-subtotal").textContent = `LKR ${(totals.subtotal - totals.discount).toFixed(2)}`;
    document.getElementById("val-grand-total").textContent = `LKR ${totals.grandTotal.toFixed(2)}`;
    
    currentCheckoutTotal = totals.grandTotal;
    
    // Sync customer display screen
    if (typeof syncCustomerDisplay === "function") {
        syncCustomerDisplay("cart");
    }
}


// ==========================================================================
// Barcode Scanner Simulator Module
// ==========================================================================

function setupScannerSimulator() {
    const scannerInput = document.getElementById("barcode-scanner-input");
    
    // Listen for Keypress Enter in barcode input
    scannerInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const code = scannerInput.value.trim().toUpperCase();
            if (code) {
                const prod = products.find(p => p.code === code);
                if (prod) {
                    addToCart(code);
                    scannerInput.value = "";
                    scannerInput.focus();
                } else {
                    alert(`Product code "${code}" not recognized in active database catalog.`);
                }
            }
        }
    });

    // Open scanner modal button click
    const btnOpenScanSim = document.getElementById("btn-open-scanner-sim");
    const scanSelectSku = document.getElementById("scanner-select-sku");
    
    btnOpenScanSim.addEventListener("click", () => {
        // Pre-populate mock scanner select with existing active database codes
        scanSelectSku.innerHTML = "";
        products.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.code;
            opt.textContent = `${p.code} - ${p.name} (Price: LKR ${p.price})`;
            scanSelectSku.appendChild(opt);
        });
        
        document.getElementById("scan-sim-message").className = "scan-status-overlay";
        document.getElementById("scan-sim-message").textContent = "Point Barcode SKU towards camera lens...";
        document.getElementById("scanner-sim-modal").classList.add("active");
    });

    // Perform scanner checkout trigger
    document.getElementById("btn-perform-mock-scan").addEventListener("click", () => {
        const code = scanSelectSku.value;
        const msgOverlay = document.getElementById("scan-sim-message");
        
        msgOverlay.className = "scan-status-overlay success";
        msgOverlay.innerHTML = `<i data-lucide="check" class="inline-icon"></i> Successfully Read Barcode: <strong>${code}</strong>`;
        lucide.createIcons();
        
        // Timeout to simulate scanning time delay
        setTimeout(() => {
            addToCart(code);
            document.getElementById("scanner-sim-modal").classList.remove("active");
        }, 800);
    });
}

// ==========================================================================
// Checkout Dialog & Numerical Pad Handlers
// ==========================================================================

function openCheckoutModal() {
    if (cart.length === 0) {
        alert("Your shopping cart is empty! Please add products before checking out.");
        return;
    }

    const totals = calculateCartTotals();
    document.getElementById("pay-total-due").textContent = `LKR ${totals.grandTotal.toFixed(2)}`;
    
    // Default mode reset
    currentPaymentMode = "cash";
    cashTendered = "";
    cardInputMode = "manual";
    selectedCardBrand = "Visa";
    
    // UI field resets
    document.getElementById("amount-tendered").value = "";
    document.getElementById("pay-change-due").textContent = "LKR 0.00";
    document.getElementById("change-display-card").className = "change-due-badge";
    const phoneInput = document.getElementById("checkout-customer-phone");
    if (phoneInput) phoneInput.value = "";
    
    // Card inputs layout reset
    const viewManual = document.getElementById("card-manual-keyin-view");
    if (viewManual) viewManual.style.display = "block";
    
    const cardLast4Input = document.getElementById("card-last4");
    if (cardLast4Input) cardLast4Input.value = "";

    // Reset split fields
    const splitCashInput = document.getElementById("split-cash-amount");
    if (splitCashInput) splitCashInput.value = "";
    const splitCardBal = document.getElementById("split-card-balance");
    if (splitCardBal) splitCardBal.textContent = `LKR ${totals.grandTotal.toFixed(2)}`;
    const splitCardLast4 = document.getElementById("split-card-last4");
    if (splitCardLast4) splitCardLast4.value = "";
    const splitFields = document.getElementById("split-payment-fields");
    if (splitFields) splitFields.style.display = "none";
    
    const brandBtns = document.querySelectorAll(".card-brands-selector .btn-brand");
    brandBtns.forEach(btn => {
        if (btn.getAttribute("data-brand") === "Visa") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Toggles reset
    const modes = document.querySelectorAll(".pay-mode-btn");
    modes.forEach(btn => {
        if (btn.getAttribute("data-mode") === "cash") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    document.getElementById("cash-calculator-fields").style.display = "block";
    document.getElementById("payment-numpad-panel").style.display = "flex";
    document.getElementById("card-details-fields").style.display = "none";
    
    document.getElementById("checkout-modal").classList.add("active");
    
    // Sync customer display screen
    if (typeof syncCustomerDisplay === "function") {
        syncCustomerDisplay("checkout");
    }
}

function setupCheckoutModalHandlers() {
    // Payment mode toggle clicks (Cash vs Card)
    const modes = document.querySelectorAll(".pay-mode-btn");
    modes.forEach(btn => {
        btn.addEventListener("click", () => {
            modes.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const mode = btn.getAttribute("data-mode");
            currentPaymentMode = mode;
            
            const splitFields = document.getElementById("split-payment-fields");
            const cashFields = document.getElementById("cash-calculator-fields");
            const cardFields = document.getElementById("card-details-fields");
            const numpad = document.getElementById("payment-numpad-panel");

            if (mode === "cash") {
                cashFields.style.display = "block";
                numpad.style.display = "flex";
                cardFields.style.display = "none";
                splitFields.style.display = "none";
            } else if (mode === "split") {
                cashFields.style.display = "none";
                numpad.style.display = "none";
                cardFields.style.display = "none";
                splitFields.style.display = "block";
                // Set card balance to full total initially
                const totals = calculateCartTotals();
                const splitCardBal = document.getElementById("split-card-balance");
                if (splitCardBal) splitCardBal.textContent = `LKR ${totals.grandTotal.toFixed(2)}`;
                const splitCashInput = document.getElementById("split-cash-amount");
                if (splitCashInput) splitCashInput.value = "";
            } else {
                cashFields.style.display = "none";
                numpad.style.display = "flex";
                cardFields.style.display = "block";
                splitFields.style.display = "none";
                
                // Card mode is now always manual
                cardInputMode = "manual";
                
                const viewManual = document.getElementById("card-manual-keyin-view");
                if (viewManual) viewManual.style.display = "block";
            }
        });
    });

    // Card Brand Selection buttons
    const brandBtns = document.querySelectorAll(".card-brands-selector .btn-brand");
    brandBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            brandBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedCardBrand = btn.getAttribute("data-brand");
        });
    });

    // Touch Numpad input events
    const keyButtons = document.querySelectorAll(".keypad-btn");
    keyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-val");
            
            if (currentPaymentMode === "card") {
                const last4Input = document.getElementById("card-last4");
                if (last4Input) {
                    if (val === "C") {
                        last4Input.value = "";
                    } else if (last4Input.value.length < 4 && !isNaN(val)) {
                        last4Input.value += val;
                    }
                }
            } else {
                if (val === "C") {
                    cashTendered = "";
                } else {
                    cashTendered += val;
                }
                updatePaymentNumpadDisplay();
            }
        });
    });

    // Quick cash shortcuts
    const quickCashButtons = document.querySelectorAll(".btn-quick-cash");
    quickCashButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const amt = parseFloat(btn.getAttribute("data-cash"));
            const totals = calculateCartTotals();
            
            // Add or set cash tendered
            const curVal = parseFloat(cashTendered) || 0;
            cashTendered = String(curVal + amt);
            updatePaymentNumpadDisplay();
        });
    });

    // Split cash amount live update
    const splitCashInput = document.getElementById("split-cash-amount");
    if (splitCashInput) {
        splitCashInput.addEventListener("input", () => {
            const totals = calculateCartTotals();
            const cashPart = parseFloat(splitCashInput.value) || 0;
            const cardPart = Math.max(0, totals.grandTotal - cashPart);
            const splitCardBal = document.getElementById("split-card-balance");
            if (splitCardBal) splitCardBal.textContent = `LKR ${cardPart.toFixed(2)}`;
        });
    }

    // Confirm Payment Finalize Button
    document.getElementById("btn-confirm-payment").addEventListener("click", finalizeSaleCheckout);
}

function updatePaymentNumpadDisplay() {
    const inputEl = document.getElementById("amount-tendered");
    const changeEl = document.getElementById("pay-change-due");
    const changeCard = document.getElementById("change-display-card");
    
    if (!cashTendered) {
        inputEl.value = "0.00";
        changeEl.textContent = "LKR 0.00";
        changeCard.className = "change-due-badge";
        return;
    }
    
    // Parse value (e.g. 5000)
    const floatVal = parseFloat(cashTendered);
    inputEl.value = floatVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const change = floatVal - currentCheckoutTotal;
    changeEl.textContent = `LKR ${Math.max(0, change).toFixed(2)}`;
    
    if (change < 0) {
        changeCard.classList.add("danger-change");
        changeEl.textContent = `LKR ${(change).toFixed(2)} (Insufficient)`;
    } else {
        changeCard.className = "change-due-badge";
    }
}

// Checkout Finalizer - Records transactions, prints receipt, and updates warehouse inventories
function finalizeSaleCheckout() {
    const totals = calculateCartTotals();
    const parsedTendered = parseFloat(cashTendered) || 0;
    
    if (currentPaymentMode === "cash" && parsedTendered < totals.grandTotal) {
        alert("Cash amount tendered is less than invoice total due. Please enter a valid sum.");
        return;
    }

    // Split payment validation
    let splitCashAmount = 0;
    let splitCardAmount = 0;
    if (currentPaymentMode === "split") {
        const splitCashEl = document.getElementById("split-cash-amount");
        splitCashAmount = parseFloat(splitCashEl ? splitCashEl.value : 0) || 0;
        splitCardAmount = Math.max(0, totals.grandTotal - splitCashAmount);
        if (splitCashAmount <= 0 && splitCardAmount <= 0) {
            alert("Please enter the cash amount for the split payment.");
            if (splitCashEl) splitCashEl.focus();
            return;
        }
        if (splitCashAmount > totals.grandTotal) {
            alert("Cash amount cannot exceed the total. Please enter a lesser amount.");
            if (splitCashEl) splitCashEl.focus();
            return;
        }
    }

    // Read order note from cart panel
    const noteEl = document.getElementById("cart-order-note");
    orderNote = noteEl ? noteEl.value.trim() : "";

    // Prepare transaction record
    const txnId = "TXN" + Date.now().toString().slice(-6);
    const dateObj = new Date();
    
    const phoneInput = document.getElementById("checkout-customer-phone");
    const rawCustomerPhone = phoneInput ? phoneInput.value.trim() : "";

    // Phone is OPTIONAL — skip e-bill if not provided
    let customerPhone = "";
    if (rawCustomerPhone) {
        // Clean formatting and convert international +94 prefix to local 0 format
        customerPhone = rawCustomerPhone.replace(/[\s-]/g, "");
        if (customerPhone.startsWith("+94")) {
            customerPhone = "0" + customerPhone.slice(3);
        } else if (customerPhone.startsWith("94") && customerPhone.length === 11) {
            customerPhone = "0" + customerPhone.slice(2);
        } else if (customerPhone.length === 9 && customerPhone.startsWith("7")) {
            customerPhone = "0" + customerPhone;
        }

        // Validate 10-digit Sri Lankan mobile number starting with 07, or generic phone
        if (!/^07\d{8}$/.test(customerPhone) && !/^\d{9,15}$/.test(customerPhone)) {
            alert("Please enter a valid mobile number (e.g. 0771234567), or leave blank to skip.");
            if (phoneInput) phoneInput.focus();
            return;
        }
    }

    const newTxn = {
        id: txnId,
        timestamp: dateObj.toISOString(),
        items: cart.map(item => ({
            code: item.product.code,
            name: item.product.name,
            price: item.overridePrice !== undefined ? item.overridePrice : item.product.price,
            cost: item.product.cost || 0,
            quantity: item.quantity,
            total: (item.overridePrice !== undefined ? item.overridePrice : item.product.price) * item.quantity,
            ...(item.overridePrice !== undefined ? { originalPrice: item.product.price } : {})
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        netSubtotal: totals.subtotal - totals.discount,
        grandTotal: totals.grandTotal,
        paymentMode: currentPaymentMode,
        cashTendered: currentPaymentMode === "cash" ? parsedTendered : (currentPaymentMode === "split" ? splitCashAmount : totals.grandTotal),
        changeDue: currentPaymentMode === "cash" ? Math.max(0, parsedTendered - totals.grandTotal) : 0,
        refNo: currentPaymentMode === "card" ? (selectedCardBrand + ((document.getElementById("card-last4") && document.getElementById("card-last4").value.trim()) ? " *" + document.getElementById("card-last4").value.trim() : "")) :
               currentPaymentMode === "split" ? `Split: Cash LKR ${splitCashAmount.toFixed(2)} + Card LKR ${splitCardAmount.toFixed(2)}${(document.getElementById("split-card-last4") && document.getElementById("split-card-last4").value.trim()) ? ` (*${document.getElementById("split-card-last4").value.trim()})` : ""}` : "",
        customerPhone: customerPhone,
        note: orderNote || ""
    };

    // Clear phone input element value
    if (phoneInput) {
        phoneInput.value = "";
    }

    // 1. Save Transaction to database (in-memory + cloud)
    transactions.push(newTxn);
    db.saveTransaction(newTxn);

    // Auto-Print Kitchen Order Ticket (KOT) to printer if enabled
    if (settings.autoPrintKot !== false && cart.length > 0) {
        try {
            const kotItems = [...cart];
            const kotNote = orderNote || "";
            const kotId = "KOT-" + newTxn.id.slice(-5);
            const kotContent = generateKotContent(kotItems, kotNote, kotId, dateObj);
            printKotDirect(kotContent);
        } catch (kotErr) {
            console.error("[ApexPOS] Auto-print KOT error:", kotErr);
        }
    }

    // 2. Clear Active checkout cart state
    cart = [];
    cartDiscount.value = 0;
    orderNote = "";
    document.getElementById("cart-discount-input").value = "";
    const cartNoteEl = document.getElementById("cart-order-note");
    if (cartNoteEl) cartNoteEl.value = "";

    // 4. Save active cart (cleared)
    db.saveActiveCart(cart);
    
    // 5. Update Cashier product grid representation (updates stocks visually)
    renderProductsGrid();
    renderCart();

    // 6. Close Settlement Modal
    document.getElementById("checkout-modal").classList.remove("active");

    // Send E-Bill via SMS only if enabled AND customer phone provided
    if (settings.ebillEnabled && newTxn.customerPhone) {
        sendEBillSMS(newTxn);
    }

    // 7. Load and Show Invoice Thermal Receipt
    printThermalReceiptPreview(newTxn);
    
    // Sync customer display completed state
    if (typeof syncCustomerDisplay === "function") {
        syncCustomerDisplay("completed");
    }

    // Trigger silent print if running in Electron and enabled
    if (typeof ipcRenderer !== "undefined" && ipcRenderer && settings.silentPrintEnabled) {
        localStorage.setItem('apex_pos_last_printed_txn', JSON.stringify(newTxn));
        ipcRenderer.send('print-silent', newTxn.id);
        showToast("🖨️ Silent Print job sent to printer.");
    }
}

// ==========================================================================
// E-Bill SMS Dispatcher — Notify.lk API
// ==========================================================================

async function sendEBillSMS(txn) {
    if (!settings.ebillEnabled) return;   // Feature is disabled
    const method = settings.smsMethod || "gateway";
    const receiptUrl = `${window.location.origin}/receipt.html?id=${txn.id}`;
    const smsText = `${settings.companyName || "Apex Retail"}: Receipt #${txn.id} | LKR ${txn.grandTotal.toFixed(2)} | View: ${receiptUrl}`;

    let toNumber = txn.customerPhone;
    if (!toNumber) return;

    if (method === "device") {
        // Trigger native device SMS application using hidden anchor click
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const separator = isIOS ? '&' : '?';
        const smsUrl = `sms:${toNumber}${separator}body=${encodeURIComponent(smsText)}`;
        
        const anchor = document.createElement('a');
        anchor.href = smsUrl;
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => anchor.remove(), 500);
        showToast(`📱 SMS app opened for: ${toNumber}`);
        return;
    }

    // Otherwise, use Notify.lk API Gateway
    const userId  = settings.smsUserId  ? settings.smsUserId.trim()  : "";
    const apiKey  = settings.smsApiKey  ? settings.smsApiKey.trim()  : "";
    const sender  = settings.smsSenderId ? settings.smsSenderId.trim() : "NotifyDEMO";

    // Convert 07x → 94x (Notify.lk format)
    if (toNumber.startsWith("0")) toNumber = "94" + toNumber.slice(1);

    if (!userId || !apiKey) {
        showToast(`⚠️ SMS API not configured. Go to Settings → SMS Setup.`);
        return;
    }

    try {
        const apiUrl = `https://app.notify.lk/api/v1/send?user_id=${encodeURIComponent(userId)}&api_key=${encodeURIComponent(apiKey)}&sender_id=${encodeURIComponent(sender)}&to=${encodeURIComponent(toNumber)}&message=${encodeURIComponent(smsText)}`;

        // Use no-cors mode to bypass CORS issues on the client-side
        await fetch(apiUrl, { method: "GET", mode: "no-cors" });
        showToast(`✅ E-Bill request sent via SMS to ${txn.customerPhone}`);
    } catch (err) {
        console.error("[ApexPOS] SMS API error:", err);
        showToast(`❌ SMS error: ${err.message}`);
    }
}

window.resendTxnSMS = function(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (txn && txn.customerPhone) {
        sendEBillSMS(txn);
    } else {
        alert("Transaction or customer phone not found.");
    }
};

// ==========================================================================
// WhatsApp Bill Sharing Helpers & Utilities
// ==========================================================================

function normalizeWhatsAppPhone(phone) {
    if (!phone) return "";
    let clean = phone.toString().replace(/\D/g, ""); // keep only digits
    if (clean.startsWith("0")) {
        clean = "94" + clean.slice(1);
    } else if (clean.startsWith("+94")) {
        clean = clean.replace("+", "");
    } else if (clean.length === 9 && clean.startsWith("7")) {
        clean = "94" + clean;
    }
    return clean;
}

function formatWhatsAppBillMessage(txn) {
    const company = settings.companyName || "Apex Retail & Food";
    const formattedDate = new Date(txn.timestamp).toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    const receiptUrl = `${window.location.origin}/receipt.html?id=${txn.id}`;

    let itemsText = "";
    if (Array.isArray(txn.items) && txn.items.length > 0) {
        itemsText = txn.items.map(item => 
            `• *${item.name}* x ${item.quantity} = LKR ${item.total.toFixed(2)}`
        ).join("\n");
    } else {
        itemsText = "• Order Items";
    }

    let msg = `🧾 *INVOICE RECEIPT* - ${company}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Invoice No:* #${txn.id}\n`;
    msg += `*Date:* ${formattedDate}\n`;
    if (txn.cashierName) {
        msg += `*Cashier:* ${txn.cashierName}\n`;
    }
    msg += `\n🛍️ *Order Items:*\n${itemsText}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Subtotal:* LKR ${txn.subtotal.toFixed(2)}\n`;
    if (txn.discount > 0) {
        msg += `*Discount:* -LKR ${txn.discount.toFixed(2)}\n`;
    }
    msg += `💰 *GRAND TOTAL: LKR ${txn.grandTotal.toFixed(2)}*\n`;
    msg += `💳 *Payment Mode:* ${txn.paymentMode.toUpperCase()}\n`;
    if (txn.paymentMode === 'cash' && txn.changeDue > 0) {
        msg += `💵 *Change Returned:* LKR ${txn.changeDue.toFixed(2)}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🌐 *View & Download Digital E-Bill:*\n${receiptUrl}\n\n`;
    msg += `Thank you for your visit! 🙏`;

    return msg;
}

window.sendWhatsAppBill = function(txnIdOrTxn, customPhone = null) {
    let txn = typeof txnIdOrTxn === 'object' ? txnIdOrTxn : transactions.find(t => t.id === txnIdOrTxn);
    if (!txn) {
        alert("Transaction not found.");
        return;
    }

    let phone = customPhone !== null ? customPhone : (txn.customerPhone || "");
    phone = (phone || "").trim();

    // If no phone provided, prompt or let cashier pick inside WhatsApp
    if (!phone) {
        const entered = prompt("Enter customer's WhatsApp number (e.g. 0771234567):\n(Or leave blank to pick contact directly in WhatsApp)", "");
        if (entered === null) return; // User pressed Cancel
        phone = entered.trim();
    }

    if (phone) {
        if (!txn.customerPhone) {
            txn.customerPhone = phone;
            db.saveTransaction(txn);
        }
        const phoneInput = document.getElementById("modal-whatsapp-phone");
        if (phoneInput) phoneInput.value = phone;
    }

    const cleanPhone = normalizeWhatsAppPhone(phone);
    const msg = formatWhatsAppBillMessage(txn);
    const encodedMsg = encodeURIComponent(msg);

    let waUrl;
    if (cleanPhone) {
        waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    } else {
        waUrl = `https://wa.me/?text=${encodedMsg}`;
    }

    window.open(waUrl, "_blank");
    showToast("💬 Opening WhatsApp to send bill...");
};

window.sendActiveReceiptWhatsApp = function() {
    const txnId = window.currentActiveReceiptTxnId;
    if (!txnId) return;
    const phoneInput = document.getElementById("modal-whatsapp-phone");
    const phone = phoneInput ? phoneInput.value.trim() : null;
    sendWhatsAppBill(txnId, phone);
};

window.copyReceiptBillText = function(txnId) {
    const txn = typeof txnId === 'object' ? txnId : transactions.find(t => t.id === txnId);
    if (!txn) return;
    const text = formatWhatsAppBillMessage(txn);
    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Bill text copied to clipboard!");
    }).catch(() => {
        alert("Could not copy text to clipboard.");
    });
};

// ==========================================================================
// Invoice Receipt Generator
// ==========================================================================

function printThermalReceiptPreview(txn) {
    window.currentActiveReceiptTxnId = txn.id;
    try {
        localStorage.setItem('apex_pos_last_printed_txn', JSON.stringify(txn));
    } catch (e) {
        console.warn('Failed to cache last printed txn:', e);
    }
    const printArea = document.getElementById("receipt-print-area");
    
    const formattedDate = new Date(txn.timestamp).toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    let itemsRowsHTML = "";
    txn.items.forEach(item => {
        itemsRowsHTML += `
            <div class="receipt-item-line">
                <div class="receipt-row-bold">
                    <span>${item.name}</span>
                </div>
                <div class="receipt-item-details">
                    <span>${item.quantity} &times; ${item.price.toFixed(2)}</span>
                    <span>LKR ${item.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    printArea.innerHTML = `
        <div class="receipt-header">
            <h3>${settings.companyName}</h3>
            <p>${settings.companyAddress}</p>
            <p>Hotline: ${settings.companyPhone}</p>
            <div class="receipt-divider"></div>
            <p><strong>INVOICE RECEIPT</strong></p>
            <p>Txn ID: ${txn.id}</p>
            <p>Date: ${formattedDate}</p>
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-body">
            ${itemsRowsHTML}
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-summary">
            <div class="receipt-row">
                <span>Subtotal:</span>
                <span>LKR ${txn.subtotal.toFixed(2)}</span>
            </div>
            ${txn.discount > 0 ? `
            <div class="receipt-row">
                <span>Discount:</span>
                <span>-LKR ${txn.discount.toFixed(2)}</span>
            </div>` : ''}
            <div class="receipt-row">
                <span>Net Subtotal:</span>
                <span>LKR ${txn.netSubtotal.toFixed(2)}</span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-row-bold" style="font-size: 14px;">
                <span>GRAND TOTAL:</span>
                <span>LKR ${txn.grandTotal.toFixed(2)}</span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-row">
                <span>Payment Mode:</span>
                <span>${txn.paymentMode.toUpperCase()}</span>
            </div>
            ${txn.paymentMode === 'cash' ? `
            <div class="receipt-row">
                <span>Amount Tendered:</span>
                <span>LKR ${txn.cashTendered.toFixed(2)}</span>
            </div>
            <div class="receipt-row">
                <span>Change Given:</span>
                <span>LKR ${txn.changeDue.toFixed(2)}</span>
            </div>
            ` : `
            <div class="receipt-row">
                <span>Payment Details:</span>
                <span>${txn.refNo || (txn.paymentMode === 'split' ? 'Split Payment' : 'Card Payment')}</span>
            </div>
            `}
        </div>
        
        <div class="receipt-footer">
            <div class="receipt-divider"></div>
            <p>Thank you for shopping with us!</p>
            <p>System by ApexPOS Enterprise</p>
            <br>
            <p style="font-family: monospace; font-size: 8px;">* Invoice compliant with IRD taxes</p>
        </div>
    `;

    // Handle E-Bill (WhatsApp & Digital receipt sharing)
    const eBillSection = document.getElementById("e-bill-share-section");
    if (eBillSection) {
        const receiptUrl = `${window.location.origin}/receipt.html?id=${txn.id}`;
        const phoneVal = txn.customerPhone || "";
        const smsSentNote = (settings.ebillEnabled && txn.customerPhone)
            ? `<div style="font-size: 11px; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <i data-lucide="check-circle" style="width: 13px; height: 13px;"></i> SMS Dispatched to ${txn.customerPhone}
               </div>`
            : "";

        eBillSection.innerHTML = `
            ${smsSentNote}
            <div class="receipt-whatsapp-box">
                <div class="receipt-whatsapp-header">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp / E-Bill Delivery
                    </span>
                    <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Direct to Phone</span>
                </div>
                <div class="receipt-whatsapp-input-row">
                    <input type="tel" id="modal-whatsapp-phone" class="receipt-whatsapp-input" placeholder="Customer WhatsApp (e.g. 0771234567)" value="${phoneVal}">
                    <button class="btn-whatsapp" onclick="sendWhatsAppBill('${txn.id}', document.getElementById('modal-whatsapp-phone').value)" style="padding: 8px 14px; font-size: 12px; height: auto;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Send
                    </button>
                </div>
                <div class="receipt-whatsapp-actions">
                    <button class="receipt-whatsapp-btn-sub" onclick="copyReceiptBillText('${txn.id}')">
                        <i data-lucide="file-text" style="width:13px;height:13px;"></i> Copy Bill Text
                    </button>
                    <button class="receipt-whatsapp-btn-sub" onclick="copyTransactionEBillLink('${txn.id}')">
                        <i data-lucide="copy" style="width:13px;height:13px;"></i> Copy Invoice Link
                    </button>
                </div>
            </div>
        `;
        eBillSection.style.display = "block";
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    document.getElementById("receipt-modal").classList.add("active");
}

// ==========================================================================
// Admin Dashboard Tab: Analytics & Chart.js Engine
// ==========================================================================

function renderAnalyticsCharts() {
    // 1. Calculate General Operations metrics cards values
    const totals = transactions.reduce((acc, t) => {
        acc.gross += t.grandTotal;
        acc.discount += t.discount;
        return acc;
    }, { gross: 0, discount: 0 });

    document.getElementById("stat-gross-revenue").textContent = `LKR ${totals.gross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById("stat-transactions").textContent = transactions.length.toString();
    document.getElementById("stat-discounts-given").textContent = `LKR ${totals.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // 2. Setup Chart.js Charts
    initSalesTrendChart();
    initPaymentMethodsChart();
    initBestSellersChart();
}

function updateDashboardMetrics() {
    renderAnalyticsCharts();
}

function initSalesTrendChart() {
    const ctx = document.getElementById("salesTrendChart").getContext("2d");
    if (salesTrendChartRef) {
        salesTrendChartRef.destroy();
    }

    // Aggregate transactional sales by dates (or times if today)
    const salesData = {};
    
    // Sort transactions by date chronological order
    const sortedTxns = [...transactions].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    sortedTxns.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        salesData[dateStr] = (salesData[dateStr] || 0) + t.grandTotal;
    });

    const labels = Object.keys(salesData).slice(-7); // Last 7 transaction dates
    const data = Object.values(salesData).slice(-7);

    // Default placeholder data if empty database
    const finalLabels = labels.length ? labels : ["June 10", "June 11", "June 12", "June 13", "June 14"];
    const finalData = data.length ? data : [0, 0, 0, 0, 0];

    salesTrendChartRef = new Chart(ctx, {
        type: 'line',
        data: {
            labels: finalLabels,
            datasets: [{
                label: 'Gross Sales (LKR)',
                data: finalData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#94a3b8' }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
                }
            }
        }
    });
}

function initPaymentMethodsChart() {
    const ctx = document.getElementById("paymentMethodsChart").getContext("2d");
    if (paymentMethodsChartRef) {
        paymentMethodsChartRef.destroy();
    }

    let cashTotal = 0;
    let cardTotal = 0;

    transactions.forEach(t => {
        if (t.paymentMode === "cash") {
            cashTotal += t.grandTotal;
        } else if (t.paymentMode === "card") {
            cardTotal += t.grandTotal;
        } else if (t.paymentMode === "split") {
            const cashPart = t.cashTendered || 0;
            cashTotal += cashPart;
            cardTotal += Math.max(0, t.grandTotal - cashPart);
        }
    });

    const isDataEmpty = cashTotal === 0 && cardTotal === 0;

    paymentMethodsChartRef = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash Payment', 'Card Payment'],
            datasets: [{
                data: isDataEmpty ? [1, 1] : [cashTotal, cardTotal],
                backgroundColor: isDataEmpty ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.08)'] : ['#10b981', '#8b5cf6'],
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
                }
            },
            cutout: '65%'
        }
    });
}

function initBestSellersChart() {
    const ctx = document.getElementById("bestSellersChart").getContext("2d");
    if (bestSellersChartRef) {
        bestSellersChartRef.destroy();
    }

    // Sum product sale frequencies
    const productSalesCount = {};
    transactions.forEach(t => {
        t.items.forEach(item => {
            productSalesCount[item.name] = (productSalesCount[item.name] || 0) + item.quantity;
        });
    });

    // Sort descending
    const sortedProducts = Object.entries(productSalesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Take top 5

    const labels = sortedProducts.map(p => p[0]);
    const data = sortedProducts.map(p => p[1]);

    const finalLabels = labels.length ? labels : ["Item A", "Item B", "Item C", "Item D", "Item E"];
    const finalData = data.length ? data : [0, 0, 0, 0, 0];

    bestSellersChartRef = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: finalLabels,
            datasets: [{
                label: 'Quantity Sold',
                data: finalData,
                backgroundColor: 'rgba(139, 92, 246, 0.85)',
                hoverBackgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 9 } }
                }
            }
        }
    });
}



// ==========================================================================
// Admin Dashboard Tab: Inventory Editor Management
// ==========================================================================

function renderInventoryTable() {
    const tbody = document.getElementById("inventory-table-body");
    tbody.innerHTML = "";

    const filterText = document.getElementById("inventory-search").value.toLowerCase();
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(filterText) || 
        p.code.toLowerCase().includes(filterText) ||
        p.category.toLowerCase().includes(filterText)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">No items in local directory index matching search.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach((p, idx) => {
        // Map actual original index
        const originalIndex = products.findIndex(item => item.code === p.code);
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: 700;">${p.code}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>LKR ${p.price.toFixed(2)}</td>
            <td>LKR ${(p.cost || 0).toFixed(2)}</td>
            <td><span class="badge-status ${p.stock !== undefined && p.stock <= 0 ? 'danger' : (p.stock !== undefined && p.stock <= (p.alertLevel || 10) ? 'warning' : 'success')}">${p.stock !== undefined ? p.stock : 50} in stock</span></td>
            <td class="action-buttons-cell">
                <button class="btn-table-action edit" onclick="openEditProductModal(${originalIndex})" title="Edit Details">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-table-action delete" onclick="deleteProduct(${originalIndex})" title="Delete Product">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function setupInventoryHandlers() {
    // Inventory filter search input
    document.getElementById("inventory-search").addEventListener("input", renderInventoryTable);
    
    // Add product open trigger
    document.getElementById("btn-open-add-product").addEventListener("click", () => {
        editProductIndex = null;
        document.getElementById("product-editor-form").reset();
        document.getElementById("edit-prod-index").value = "";
        document.getElementById("prod-code").disabled = false; // Barcode SKU editable for new items
        document.getElementById("product-modal-title").textContent = "Add New Product to Database";
        document.getElementById("btn-save-product").textContent = "Add Product";
        document.getElementById("product-modal").classList.add("active");
    });

    // Save product form submit
    document.getElementById("product-editor-form").addEventListener("submit", (e) => {
        e.preventDefault();
        saveProductRecord();
    });
}

window.openEditProductModal = function(index) {
    const p = products[index];
    editProductIndex = index;
    
    document.getElementById("edit-prod-index").value = index;
    document.getElementById("prod-code").value = p.code;
    document.getElementById("prod-code").disabled = true; // Barcode SKU locked on edit mode
    document.getElementById("prod-name").value = p.name;
    document.getElementById("prod-category").value = p.category;
    document.getElementById("prod-price").value = p.price;
    document.getElementById("prod-cost").value = p.cost || 0;
    document.getElementById("prod-desc").value = p.description || "";
    
    document.getElementById("product-modal-title").textContent = `Modify Product details [${p.code}]`;
    document.getElementById("btn-save-product").textContent = "Update Product";
    document.getElementById("product-modal").classList.add("active");
};

function saveProductRecord() {
    const code = document.getElementById("prod-code").value.trim().toUpperCase();
    const name = document.getElementById("prod-name").value.trim();
    const category = document.getElementById("prod-category").value;
    const price = parseFloat(document.getElementById("prod-price").value);
    const cost = parseFloat(document.getElementById("prod-cost").value) || 0;
    const desc = document.getElementById("prod-desc").value.trim();

    const record = {
        code,
        name,
        category,
        price,
        cost,
        stock: 999999,
        alertLevel: 0,
        description: desc
    };

    if (editProductIndex !== null) {
        // Edit record
        products[editProductIndex] = record;
    } else {
        // Validate code unique for new items
        const isExists = products.some(p => p.code === code);
        if (isExists) {
            alert(`Error: A product with Barcode SKU "${code}" already exists in inventory. Code must be unique.`);
            return;
        }
        products.push(record);
    }

    // Save single product to cloud (efficient — no full rewrite)
    db.saveSingleProduct(record);
    renderInventoryTable();
    renderCategories();
    renderProductsGrid();
    
    document.getElementById("product-modal").classList.remove("active");
}

window.deleteProduct = function(index) {
    const p = products[index];
    if (confirm(`Are you sure you want to permanently delete "${p.name}" (${p.code}) from database directory?`)) {
        const deletedCode = p.code;
        products.splice(index, 1);
        // Delete from cloud
        db.deleteProduct(deletedCode);
        renderInventoryTable();
        renderCategories();
        renderProductsGrid();
    }
};

// ==========================================================================
// Admin Dashboard Tab: Z-Reports CLOSURE Engine
// ==========================================================================

function renderZReportsTab() {
    // 1. Calculate running stats of active unclosed register (filter out archived closed shift txns)
    const activeTxns = transactions.filter(t => !t.closed);
    const unclosedCount = activeTxns.length;
    
    const unclosedTotals = activeTxns.reduce((acc, t) => {
        acc.sales += t.grandTotal;
        acc.discount += t.discount;
        return acc;
    }, { sales: 0, discount: 0 });

    document.getElementById("z-unclosed-sales").textContent = `LKR ${unclosedTotals.sales.toFixed(2)}`;
    document.getElementById("z-unclosed-discount").textContent = `LKR ${unclosedTotals.discount.toFixed(2)}`;
    document.getElementById("z-unclosed-invoices").textContent = `${unclosedCount} Transaction${unclosedCount === 1 ? '' : 's'}`;
    
    // 2. Render Historical records archives table
    const tbody = document.getElementById("z-reports-history-body");
    
    if (zReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No historical Z-Report shift closures recorded yet.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = "";
    zReports.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--color-secondary);">${r.id}</td>
            <td>${new Date(r.timestamp).toLocaleString()}</td>
            <td>${r.closedBy}</td>
            <td><strong>LKR ${r.totalsSales.toFixed(2)}</strong></td>
            <td>LKR ${r.totalDiscount.toFixed(2)}</td>
            <td>${r.transactionsCount}</td>
            <td>
                <button class="btn-secondary small" onclick="printHistoricalZReport('${r.id}')">
                    <i data-lucide="printer" style="width: 13px; height: 13px;"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Admin Dashboard Tab: Transactions Log Engine
// ==========================================================================

function renderTransactionsTable() {
    const tbody = document.getElementById("transactions-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    const searchInput = document.getElementById("transactions-search");
    const filterText = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    // Sort transactions chronologically descending (newest first)
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const filtered = sorted.filter(t => 
        t.id.toLowerCase().includes(filterText) ||
        (t.customerPhone && t.customerPhone.toLowerCase().includes(filterText))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No transactions found matching search.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleString();
        const customerPhone = t.customerPhone || "N/A";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--color-primary);">${t.id}</td>
            <td>${dateStr}</td>
            <td><strong>${customerPhone}</strong></td>
            <td><strong>LKR ${t.grandTotal.toFixed(2)}</strong></td>
            <td>${t.paymentMode.toUpperCase()}</td>
            <td class="action-buttons-cell">
                <button class="btn-table-action view" onclick="viewTransactionReceipt('${t.id}')" title="View / Print Receipt" style="background: rgba(16, 185, 129, 0.1); color: var(--color-primary); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer;">
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                </button>
                <button class="btn-table-action whatsapp" onclick="sendWhatsAppBill('${t.id}')" title="Send Bill via WhatsApp" style="background: rgba(37, 211, 102, 0.12); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: var(--radius-sm); padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; margin-left: 6px;">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                </button>
                <button class="btn-table-action copy" onclick="copyTransactionEBillLink('${t.id}')" title="Copy Digital Receipt Link" style="background: rgba(139, 92, 246, 0.1); color: var(--color-secondary); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: var(--radius-sm); padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; margin-left: 6px;">
                    <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Link
                </button>
                <button class="btn-table-action edit" onclick="editTransaction('${t.id}')" title="Edit Order" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); border-radius: var(--radius-sm); padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; margin-left: 6px;">
                    <i data-lucide="edit" style="width: 14px; height: 14px;"></i> Edit
                </button>
                <button class="btn-table-action delete" onclick="deleteTransaction('${t.id}')" title="Delete Order" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-sm); padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; margin-left: 6px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

window.viewTransactionReceipt = function(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (txn) {
        printThermalReceiptPreview(txn);
    }
};

window.deleteTransaction = function(txnId) {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    transactions = transactions.filter(t => t.id !== txnId);
    if (window.db) {
        db.saveAllTransactions(transactions).then(() => {
            renderTransactionsTable();
            updateDashboardMetrics();
            if (typeof showToast === 'function') showToast("Order deleted successfully.");
        }).catch(err => {
            console.error("Failed to delete transaction:", err);
            alert("Error deleting order.");
        });
    } else {
        localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
        renderTransactionsTable();
        updateDashboardMetrics();
        if (typeof showToast === 'function') showToast("Order deleted successfully.");
    }
};

window.editTransaction = function(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;
    
    if (!confirm("Are you sure you want to edit this order? It will be removed from history and loaded into your cart.")) return;
    
    // Delete from history
    transactions = transactions.filter(t => t.id !== txnId);
    const savePromise = window.db ? db.saveAllTransactions(transactions) : Promise.resolve(localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions)));
    
    savePromise.then(() => {
        // Load into cart
        cart = txn.items.map(item => ({
            product: {
                code: item.code,
                name: item.name,
                price: item.originalPrice || item.price,
                cost: item.cost || 0
            },
            quantity: item.quantity,
            overridePrice: item.originalPrice ? item.price : undefined
        }));
        
        // Save cart state
        persistState();
        
        // Return to POS view
        switchView("cashier-view");
        
        renderCart();
        renderTransactionsTable();
        updateDashboardMetrics();
        if (typeof showToast === 'function') showToast("Order loaded for editing.");
    });
};

window.copyTransactionEBillLink = function(txnId) {
    const receiptUrl = `${window.location.origin}/receipt.html?id=${txnId}`;
    navigator.clipboard.writeText(receiptUrl).then(() => {
        alert("E-Receipt URL copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy receipt URL:", err);
    });
};

function setupTransactionsHandlers() {
    const searchInput = document.getElementById("transactions-search");
    if (searchInput) {
        searchInput.addEventListener("input", renderTransactionsTable);
    }
}

function setupReportsHandlers() {
    // Close Day register closure
    const btnZReport = document.getElementById("btn-trigger-zreport");
    if (btnZReport) {
        btnZReport.addEventListener("click", () => {
            const activeShiftTxns = transactions.filter(t => !t.closed);
            if (activeShiftTxns.length === 0) {
                alert("No active transactions recorded in the current shift. Cannot perform Z-Report closure.");
                return;
            }

            const promptConfirm = confirm(
                "CRITICAL PROCESS WARNING:\n\n" +
                "Are you sure you want to CLOSE the current shift and generate a Z-Report?\n\n" +
                "This will:\n" +
                "1. Consolidate and archive all shift sales & tax liability tallies.\n" +
                "2. Reset the active transactions tally to zero.\n" +
                "3. Clear unclosed sales database and increment Z-Report Serial."
            );

            if (promptConfirm) {
                performZReportShiftClosure();
            }
        });
    }

    // Select Report Buttons
    const reportBtns = document.querySelectorAll(".btn-report-select");
    reportBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            reportBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentReportType = btn.getAttribute("data-report");
            
            // Update Title
            const titleEl = document.getElementById("report-view-title");
            if (titleEl) {
                if (currentReportType === "category") {
                    titleEl.textContent = "Category Sales Summary";
                } else if (currentReportType === "product") {
                    titleEl.textContent = "Product Sales Summary";
                } else if (currentReportType === "hourly") {
                    titleEl.textContent = "Hourly Sales Distribution";
                } else if (currentReportType === "payment") {
                    titleEl.textContent = "Payment Methods Sales Summary";
                } else if (currentReportType === "daily") {
                    titleEl.textContent = "Daily Sales Summary";
                } else if (currentReportType === "profit") {
                    titleEl.textContent = "Profit & Loss Summary";
                }
            }
            
            renderAdvancedReports();
        });
    });

    // Export Button
    const btnExport = document.getElementById("btn-export-reports");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            exportSelectedReportToCSV();
        });
    }
}

// Consolidate current active transactions and archived historical Z-report sales
function getAllTransactionsCombined() {
    const txnMap = new Map();
    // Add current active transactions
    if (Array.isArray(transactions)) {
        transactions.forEach(t => txnMap.set(t.id, t));
    }
    // Add archived Z-Report transaction histories
    if (Array.isArray(zReports)) {
        zReports.forEach(r => {
            if (r.rawTransactionsList && Array.isArray(r.rawTransactionsList)) {
                r.rawTransactionsList.forEach(t => txnMap.set(t.id, t));
            }
        });
    }
    return Array.from(txnMap.values());
}

// Controller to render selected report
function renderAdvancedReports() {
    const table = document.getElementById("report-output-table");
    if (!table) return;
    
    const allTxns = getAllTransactionsCombined();
    
    if (currentReportType === "category") {
        renderCategoryReport(table, allTxns);
    } else if (currentReportType === "product") {
        renderProductReport(table, allTxns);
    } else if (currentReportType === "hourly") {
        renderHourlyReport(table, allTxns);
    } else if (currentReportType === "payment") {
        renderPaymentReport(table, allTxns);
    } else if (currentReportType === "daily") {
        renderDailyReport(table, allTxns);
    } else if (currentReportType === "profit") {
        renderProfitReport(table, allTxns);
    }
    
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

// Report 1: Category Sales Summary
function renderCategoryReport(table, allTxns) {
    const categoryData = {};
    let totalRevenueAll = 0;
    let totalCogsAll = 0;
    
    const productCategoryMap = new Map();
    const productCostMap = new Map();
    products.forEach(p => {
        productCategoryMap.set(p.code, p.category);
        productCostMap.set(p.code, p.cost || 0);
    });
    DEFAULT_PRODUCTS.forEach(p => {
        if (!productCategoryMap.has(p.code)) {
            productCategoryMap.set(p.code, p.category);
        }
        if (!productCostMap.has(p.code)) {
            productCostMap.set(p.code, p.cost || 0);
        }
    });

    allTxns.forEach(t => {
        t.items.forEach(item => {
            const cat = productCategoryMap.get(item.code) || "Other";
            if (!categoryData[cat]) {
                categoryData[cat] = { quantity: 0, revenue: 0, cogs: 0 };
            }
            const itemCost = item.cost !== undefined ? item.cost : (productCostMap.get(item.code) || 0);
            categoryData[cat].quantity += item.quantity;
            categoryData[cat].revenue += item.total;
            categoryData[cat].cogs += itemCost * item.quantity;
            totalRevenueAll += item.total;
            totalCogsAll += itemCost * item.quantity;
        });
    });

    const reportRows = Object.entries(categoryData).map(([cat, data]) => {
        const profit = data.revenue - data.cogs;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        const share = totalRevenueAll > 0 ? (data.revenue / totalRevenueAll) * 100 : 0;
        return {
            category: cat,
            quantity: data.quantity,
            revenue: data.revenue,
            cogs: data.cogs,
            profit: profit,
            margin: margin,
            share: share
        };
    }).sort((a, b) => b.revenue - a.revenue);

    let html = `
        <thead>
            <tr>
                <th>Category Name</th>
                <th>Quantity Sold</th>
                <th>Gross Revenue</th>
                <th>Gross Profit</th>
                <th>Profit Margin (%)</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (reportRows.length === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        reportRows.forEach(row => {
            html += `
                <tr>
                    <td><strong>${row.category}</strong></td>
                    <td>${row.quantity} units</td>
                    <td>LKR ${row.revenue.toFixed(2)}</td>
                    <td class="${row.profit >= 0 ? 'text-success' : 'text-danger'}"><strong>LKR ${row.profit.toFixed(2)}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow: hidden; max-width: 80px;">
                                <div style="height: 100%; width: ${Math.max(0, Math.min(100, row.margin))}%; background: var(--color-primary); border-radius: 9999px;"></div>
                            </div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${row.margin.toFixed(1)}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        const totalProfitAll = totalRevenueAll - totalCogsAll;
        const overallMargin = totalRevenueAll > 0 ? (totalProfitAll / totalRevenueAll) * 100 : 0;

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL</td>
                <td>${reportRows.reduce((sum, r) => sum + r.quantity, 0)} units</td>
                <td>LKR ${totalRevenueAll.toFixed(2)}</td>
                <td style="color: var(--color-primary);">LKR ${totalProfitAll.toFixed(2)}</td>
                <td>${overallMargin.toFixed(1)}%</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Report 2: Product Performance Summary
function renderProductReport(table, allTxns) {
    const productData = {};
    let totalRevenueAll = 0;
    let totalCogsAll = 0;
    let totalQtyAll = 0;

    const productDetailsMap = new Map();
    const productCostMap = new Map();
    products.forEach(p => {
        productDetailsMap.set(p.code, { name: p.name, category: p.category });
        productCostMap.set(p.code, p.cost || 0);
    });
    DEFAULT_PRODUCTS.forEach(p => {
        if (!productDetailsMap.has(p.code)) {
            productDetailsMap.set(p.code, { name: p.name, category: p.category });
        }
        if (!productCostMap.has(p.code)) {
            productCostMap.set(p.code, p.cost || 0);
        }
    });

    allTxns.forEach(t => {
        t.items.forEach(item => {
            const code = item.code;
            if (!productData[code]) {
                const details = productDetailsMap.get(code) || { name: item.name, category: "Other" };
                productData[code] = {
                    name: details.name,
                    category: details.category,
                    quantity: 0,
                    revenue: 0,
                    cogs: 0
                };
            }
            const itemCost = item.cost !== undefined ? item.cost : (productCostMap.get(code) || 0);
            productData[code].quantity += item.quantity;
            productData[code].revenue += item.total;
            productData[code].cogs += itemCost * item.quantity;
            totalRevenueAll += item.total;
            totalCogsAll += itemCost * item.quantity;
            totalQtyAll += item.quantity;
        });
    });

    const reportRows = Object.entries(productData).map(([code, data]) => {
        const profit = data.revenue - data.cogs;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        return {
            code: code,
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            revenue: data.revenue,
            profit: profit,
            margin: margin
        };
    }).sort((a, b) => b.revenue - a.revenue);

    let html = `
        <thead>
            <tr>
                <th>SKU Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Quantity Sold</th>
                <th>Gross Revenue</th>
                <th>Gross Profit</th>
                <th>Margin (%)</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (reportRows.length === 0) {
        html += `
            <tr>
                <td colspan="7" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        reportRows.forEach(row => {
            html += `
                <tr>
                    <td style="font-family: monospace; font-weight: 700;">${row.code}</td>
                    <td><strong>${row.name}</strong></td>
                    <td>${row.category}</td>
                    <td>${row.quantity} units</td>
                    <td>LKR ${row.revenue.toFixed(2)}</td>
                    <td class="${row.profit >= 0 ? 'text-success' : 'text-danger'}"><strong>LKR ${row.profit.toFixed(2)}</strong></td>
                    <td>${row.margin.toFixed(1)}%</td>
                </tr>
            `;
        });

        const totalProfitAll = totalRevenueAll - totalCogsAll;
        const overallMargin = totalRevenueAll > 0 ? (totalProfitAll / totalRevenueAll) * 100 : 0;

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL</td>
                <td>-</td>
                <td>-</td>
                <td>${totalQtyAll} units</td>
                <td>LKR ${totalRevenueAll.toFixed(2)}</td>
                <td style="color: var(--color-primary);">LKR ${totalProfitAll.toFixed(2)}</td>
                <td>${overallMargin.toFixed(1)}%</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Report 3: Hourly Sales distribution (2-hour slots)
function renderHourlyReport(table, allTxns) {
    const slots = [];
    for (let i = 0; i < 12; i++) {
        const startHour = String(i * 2).padStart(2, '0');
        const endHour = String((i * 2) + 2).padStart(2, '0');
        const label = `${startHour}:00 - ${endHour}:00`;
        slots.push({
            slotIndex: i,
            label: label,
            count: 0,
            revenue: 0
        });
    }

    allTxns.forEach(t => {
        const dt = new Date(t.timestamp);
        const hour = dt.getHours();
        const slotIndex = Math.floor(hour / 2);
        if (slotIndex >= 0 && slotIndex < 12) {
            slots[slotIndex].count++;
            slots[slotIndex].revenue += t.grandTotal;
        }
    });

    const activeSlots = slots.filter(s => s.count > 0);

    let html = `
        <thead>
            <tr>
                <th>Time Interval</th>
                <th>Transaction Count</th>
                <th>Gross Revenue</th>
                <th>Avg Ticket Size</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (activeSlots.length === 0) {
        html += `
            <tr>
                <td colspan="4" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        let totalCount = 0;
        let totalRevenue = 0;

        activeSlots.forEach(s => {
            const avgTicket = s.count > 0 ? s.revenue / s.count : 0;
            totalCount += s.count;
            totalRevenue += s.revenue;

            html += `
                <tr>
                    <td><strong>${s.label}</strong></td>
                    <td>${s.count} txns</td>
                    <td><strong>LKR ${s.revenue.toFixed(2)}</strong></td>
                    <td>LKR ${avgTicket.toFixed(2)}</td>
                </tr>
            `;
        });

        const overallAvgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL / AVERAGE</td>
                <td>${totalCount} txns</td>
                <td style="color: var(--color-primary);">LKR ${totalRevenue.toFixed(2)}</td>
                <td>LKR ${overallAvgTicket.toFixed(2)}</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Report 4: Payment Methods Report
function renderPaymentReport(table, allTxns) {
    const paymentData = {
        "cash": { count: 0, revenue: 0 },
        "card": { count: 0, revenue: 0 }
    };
    
    let totalRevenue = 0;
    let totalCount = 0;

    allTxns.forEach(t => {
        const mode = t.paymentMode || "cash";
        if (!paymentData[mode]) {
            paymentData[mode] = { count: 0, revenue: 0 };
        }
        paymentData[mode].count++;
        paymentData[mode].revenue += t.grandTotal;
        totalRevenue += t.grandTotal;
        totalCount += 1;
    });

    let html = `
        <thead>
            <tr>
                <th>Payment Method</th>
                <th>Transaction Count</th>
                <th>Gross Revenue</th>
                <th>Revenue Share (%)</th>
                <th>Avg Ticket Size</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (totalCount === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        Object.entries(paymentData).forEach(([mode, data]) => {
            const share = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
            const avgTicket = data.count > 0 ? data.revenue / data.count : 0;

            html += `
                <tr>
                    <td><strong>${mode.toUpperCase()}</strong></td>
                    <td>${data.count} txns</td>
                    <td><strong>LKR ${data.revenue.toFixed(2)}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow: hidden; max-width: 100px;">
                                <div style="height: 100%; width: ${share}%; background: var(--color-secondary); border-radius: 9999px;"></div>
                            </div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${share.toFixed(1)}%</span>
                        </div>
                    </td>
                    <td>LKR ${avgTicket.toFixed(2)}</td>
                </tr>
            `;
        });

        const overallAvgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL / AVERAGE</td>
                <td>${totalCount} txns</td>
                <td style="color: var(--color-primary);">LKR ${totalRevenue.toFixed(2)}</td>
                <td>100.0%</td>
                <td>LKR ${overallAvgTicket.toFixed(2)}</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Report 5: Daily Sales Summary
function renderDailyReport(table, allTxns) {
    const dailyData = {};
    
    allTxns.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = { count: 0, gross: 0, discount: 0, net: 0 };
        }
        dailyData[dateStr].count++;
        dailyData[dateStr].gross += t.subtotal || t.grandTotal;
        dailyData[dateStr].discount += t.discount || 0;
        dailyData[dateStr].net += t.grandTotal;
    });

    const sortedDays = Object.entries(dailyData).sort((a, b) => new Date(a[0]) - new Date(b[0]));

    let html = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Transaction Count</th>
                <th>Gross Sales</th>
                <th>Total Discounts</th>
                <th>Net Revenue</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (sortedDays.length === 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        let totalCount = 0;
        let totalGross = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        sortedDays.forEach(([date, data]) => {
            totalCount += data.count;
            totalGross += data.gross;
            totalDiscount += data.discount;
            totalNet += data.net;

            html += `
                <tr>
                    <td><strong>${date}</strong></td>
                    <td>${data.count} txns</td>
                    <td>LKR ${data.gross.toFixed(2)}</td>
                    <td class="text-success">- LKR ${data.discount.toFixed(2)}</td>
                    <td><strong>LKR ${data.net.toFixed(2)}</strong></td>
                </tr>
            `;
        });

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL</td>
                <td>${totalCount} txns</td>
                <td>LKR ${totalGross.toFixed(2)}</td>
                <td class="text-success">- LKR ${totalDiscount.toFixed(2)}</td>
                <td style="color: var(--color-primary); font-size: 14px;">LKR ${totalNet.toFixed(2)}</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Report 6: Profit & Loss (P&L) Summary
function renderProfitReport(table, allTxns) {
    const dailyProfitData = {};

    const productCostMap = new Map();
    products.forEach(p => productCostMap.set(p.code, p.cost || 0));
    DEFAULT_PRODUCTS.forEach(p => {
        if (!productCostMap.has(p.code)) {
            productCostMap.set(p.code, p.cost || 0);
        }
    });

    allTxns.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        let txnCogs = 0;
        t.items.forEach(item => {
            const cost = item.cost !== undefined ? item.cost : (productCostMap.get(item.code) || 0);
            txnCogs += cost * item.quantity;
        });

        if (!dailyProfitData[dateStr]) {
            dailyProfitData[dateStr] = { count: 0, gross: 0, discount: 0, net: 0, cogs: 0 };
        }

        dailyProfitData[dateStr].count++;
        dailyProfitData[dateStr].gross += t.subtotal || t.grandTotal;
        dailyProfitData[dateStr].discount += t.discount || 0;
        dailyProfitData[dateStr].net += t.grandTotal;
        dailyProfitData[dateStr].cogs += txnCogs;
    });

    const sortedDays = Object.entries(dailyProfitData).sort((a, b) => new Date(a[0]) - new Date(b[0]));

    let html = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Txns</th>
                <th>Net Revenue</th>
                <th>Cost of Sales (COGS)</th>
                <th>Gross Profit</th>
                <th>Margin (%)</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (sortedDays.length === 0) {
        html += `
            <tr>
                <td colspan="6" class="text-center text-muted">No sales data recorded yet.</td>
            </tr>
        `;
    } else {
        let totalCount = 0;
        let totalNet = 0;
        let totalCogs = 0;
        let totalProfit = 0;

        sortedDays.forEach(([date, data]) => {
            const profit = data.net - data.cogs;
            const margin = data.net > 0 ? (profit / data.net) * 100 : 0;

            totalCount += data.count;
            totalNet += data.net;
            totalCogs += data.cogs;
            totalProfit += profit;

            html += `
                <tr>
                    <td><strong>${date}</strong></td>
                    <td>${data.count}</td>
                    <td>LKR ${data.net.toFixed(2)}</td>
                    <td>LKR ${data.cogs.toFixed(2)}</td>
                    <td class="${profit >= 0 ? 'text-success' : 'text-danger'}"><strong>LKR ${profit.toFixed(2)}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow: hidden; max-width: 80px;">
                                <div style="height: 100%; width: ${Math.max(0, Math.min(100, margin))}%; background: var(--color-primary); border-radius: 9999px;"></div>
                            </div>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${margin.toFixed(1)}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        const overallMargin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

        html += `
            <tr style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 700;">
                <td>TOTAL</td>
                <td>${totalCount} txns</td>
                <td>LKR ${totalNet.toFixed(2)}</td>
                <td>LKR ${totalCogs.toFixed(2)}</td>
                <td style="color: var(--color-primary);">LKR ${totalProfit.toFixed(2)}</td>
                <td>${overallMargin.toFixed(1)}%</td>
            </tr>
        `;
    }

    html += `</tbody>`;
    table.innerHTML = html;
}

// Export the active report type as CSV
function exportSelectedReportToCSV() {
    const allTxns = getAllTransactionsCombined();
    let csv = "";
    let filename = "";

    if (currentReportType === "category") {
        filename = "category_sales_report.csv";
        csv = "\uFEFFCategory Name,Quantity Sold,Gross Revenue (LKR),Cost of Goods Sold (LKR),Gross Profit (LKR),Profit Margin (%)\n";
        
        const categoryData = {};
        let totalRevenueAll = 0;
        let totalCogsAll = 0;
        const productCategoryMap = new Map();
        const productCostMap = new Map();
        products.forEach(p => {
            productCategoryMap.set(p.code, p.category);
            productCostMap.set(p.code, p.cost || 0);
        });
        DEFAULT_PRODUCTS.forEach(p => {
            if (!productCategoryMap.has(p.code)) {
                productCategoryMap.set(p.code, p.category);
            }
            if (!productCostMap.has(p.code)) {
                productCostMap.set(p.code, p.cost || 0);
            }
        });

        allTxns.forEach(t => {
            t.items.forEach(item => {
                const cat = productCategoryMap.get(item.code) || "Other";
                if (!categoryData[cat]) {
                    categoryData[cat] = { quantity: 0, revenue: 0, cogs: 0 };
                }
                const itemCost = item.cost !== undefined ? item.cost : (productCostMap.get(item.code) || 0);
                categoryData[cat].quantity += item.quantity;
                categoryData[cat].revenue += item.total;
                categoryData[cat].cogs += itemCost * item.quantity;
                totalRevenueAll += item.total;
                totalCogsAll += itemCost * item.quantity;
            });
        });

        const reportRows = Object.entries(categoryData).map(([cat, data]) => {
            const profit = data.revenue - data.cogs;
            const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
            return { category: cat, quantity: data.quantity, revenue: data.revenue, cogs: data.cogs, profit: profit, margin: margin };
        }).sort((a, b) => b.revenue - a.revenue);

        reportRows.forEach(row => {
            csv += `"${row.category}","${row.quantity}","${row.revenue.toFixed(2)}","${row.cogs.toFixed(2)}","${row.profit.toFixed(2)}","${row.margin.toFixed(1)}%"\n`;
        });
        const totalProfitAll = totalRevenueAll - totalCogsAll;
        const overallMargin = totalRevenueAll > 0 ? (totalProfitAll / totalRevenueAll) * 100 : 0;
        csv += `"TOTAL","${reportRows.reduce((sum, r) => sum + r.quantity, 0)}","${totalRevenueAll.toFixed(2)}","${totalCogsAll.toFixed(2)}","${totalProfitAll.toFixed(2)}","${overallMargin.toFixed(1)}%"\n`;

    } else if (currentReportType === "product") {
        filename = "product_sales_report.csv";
        csv = "\uFEFFSKU Code,Product Name,Category,Quantity Sold,Gross Revenue (LKR),Gross Profit (LKR),Margin (%)\n";

        const productData = {};
        const productDetailsMap = new Map();
        const productCostMap = new Map();
        products.forEach(p => {
            productDetailsMap.set(p.code, { name: p.name, category: p.category });
            productCostMap.set(p.code, p.cost || 0);
        });
        DEFAULT_PRODUCTS.forEach(p => {
            if (!productDetailsMap.has(p.code)) {
                productDetailsMap.set(p.code, { name: p.name, category: p.category });
            }
            if (!productCostMap.has(p.code)) {
                productCostMap.set(p.code, p.cost || 0);
            }
        });

        let totalRevenueAll = 0;
        let totalCogsAll = 0;
        let totalQtyAll = 0;

        allTxns.forEach(t => {
            t.items.forEach(item => {
                const code = item.code;
                if (!productData[code]) {
                    const details = productDetailsMap.get(code) || { name: item.name, category: "Other" };
                    productData[code] = { name: details.name, category: details.category, quantity: 0, revenue: 0, cogs: 0 };
                }
                const itemCost = item.cost !== undefined ? item.cost : (productCostMap.get(code) || 0);
                productData[code].quantity += item.quantity;
                productData[code].revenue += item.total;
                productData[code].cogs += itemCost * item.quantity;
                totalRevenueAll += item.total;
                totalCogsAll += itemCost * item.quantity;
                totalQtyAll += item.quantity;
            });
        });

        const reportRows = Object.entries(productData).map(([code, data]) => {
            const profit = data.revenue - data.cogs;
            const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
            return { code: code, name: data.name, category: data.category, quantity: data.quantity, revenue: data.revenue, profit: profit, margin: margin };
        }).sort((a, b) => b.revenue - a.revenue);

        reportRows.forEach(row => {
            csv += `"${row.code}","${row.name.replace(/'/g, "''")}","${row.category}","${row.quantity}","${row.revenue.toFixed(2)}","${row.profit.toFixed(2)}","${row.margin.toFixed(1)}%"\n`;
        });
        const totalProfitAll = totalRevenueAll - totalCogsAll;
        const overallMargin = totalRevenueAll > 0 ? (totalProfitAll / totalRevenueAll) * 100 : 0;
        csv += `"TOTAL","","","${totalQtyAll}","${totalRevenueAll.toFixed(2)}","${totalProfitAll.toFixed(2)}","${overallMargin.toFixed(1)}%"\n`;

    } else if (currentReportType === "hourly") {
        filename = "hourly_sales_report.csv";
        csv = "\uFEFFTime Interval,Transaction Count,Gross Revenue (LKR),Avg Ticket Size (LKR)\n";

        const slots = [];
        for (let i = 0; i < 12; i++) {
            const startHour = String(i * 2).padStart(2, '0');
            const endHour = String((i * 2) + 2).padStart(2, '0');
            const label = `${startHour}:00 - ${endHour}:00`;
            slots.push({ slotIndex: i, label: label, count: 0, revenue: 0 });
        }

        allTxns.forEach(t => {
            const dt = new Date(t.timestamp);
            const hour = dt.getHours();
            const slotIndex = Math.floor(hour / 2);
            if (slotIndex >= 0 && slotIndex < 12) {
                slots[slotIndex].count++;
                slots[slotIndex].revenue += t.grandTotal;
            }
        });

        const activeSlots = slots.filter(s => s.count > 0);
        let totalCount = 0;
        let totalRevenue = 0;

        activeSlots.forEach(s => {
            const avgTicket = s.count > 0 ? s.revenue / s.count : 0;
            totalCount += s.count;
            totalRevenue += s.revenue;
            csv += `"${s.label}","${s.count}","${s.revenue.toFixed(2)}","${avgTicket.toFixed(2)}"\n`;
        });

        const overallAvgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;
        csv += `"TOTAL / AVERAGE","${totalCount}","${totalRevenue.toFixed(2)}","${overallAvgTicket.toFixed(2)}"\n`;

    } else if (currentReportType === "payment") {
        filename = "payment_methods_report.csv";
        csv = "\uFEFFPayment Method,Transaction Count,Gross Revenue (LKR),Revenue Share (%),Avg Ticket Size (LKR)\n";
        
        const paymentData = {
            "cash": { count: 0, revenue: 0 },
            "card": { count: 0, revenue: 0 }
        };
        let totalRevenue = 0;
        let totalCount = 0;

        allTxns.forEach(t => {
            const mode = t.paymentMode || "cash";
            if (!paymentData[mode]) {
                paymentData[mode] = { count: 0, revenue: 0 };
            }
            paymentData[mode].count++;
            paymentData[mode].revenue += t.grandTotal;
            totalRevenue += t.grandTotal;
            totalCount += 1;
        });

        Object.entries(paymentData).forEach(([mode, data]) => {
            const share = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
            const avgTicket = data.count > 0 ? data.revenue / data.count : 0;
            csv += `"${mode.toUpperCase()}","${data.count}","${data.revenue.toFixed(2)}","${share.toFixed(1)}%","${avgTicket.toFixed(2)}"\n`;
        });
        const overallAvgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;
        csv += `"TOTAL / AVERAGE","${totalCount}","${totalRevenue.toFixed(2)}","100%","${overallAvgTicket.toFixed(2)}"\n`;

    } else if (currentReportType === "daily") {
        filename = "daily_sales_summary.csv";
        csv = "\uFEFFDate,Transaction Count,Gross Sales (LKR),Total Discounts (LKR),Net Revenue (LKR)\n";
        
        const dailyData = {};
        allTxns.forEach(t => {
            const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { count: 0, gross: 0, discount: 0, net: 0 };
            }
            dailyData[dateStr].count++;
            dailyData[dateStr].gross += t.subtotal || t.grandTotal;
            dailyData[dateStr].discount += t.discount || 0;
            dailyData[dateStr].net += t.grandTotal;
        });

        const sortedDays = Object.entries(dailyData).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        let totalCount = 0;
        let totalGross = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        sortedDays.forEach(([date, data]) => {
            totalCount += data.count;
            totalGross += data.gross;
            totalDiscount += data.discount;
            totalNet += data.net;
            csv += `"${date}","${data.count}","${data.gross.toFixed(2)}","${data.discount.toFixed(2)}","${data.net.toFixed(2)}"\n`;
        });
        csv += `"TOTAL","${totalCount}","${totalGross.toFixed(2)}","${totalDiscount.toFixed(2)}","${totalNet.toFixed(2)}"\n`;
    } else if (currentReportType === "profit") {
        filename = "profit_and_loss_report.csv";
        csv = "\uFEFFDate,Transaction Count,Net Revenue (LKR),Cost of Goods Sold (COGS) (LKR),Gross Profit (LKR),Margin (%)\n";

        const dailyProfitData = {};
        const productCostMap = new Map();
        products.forEach(p => productCostMap.set(p.code, p.cost || 0));
        DEFAULT_PRODUCTS.forEach(p => {
            if (!productCostMap.has(p.code)) {
                productCostMap.set(p.code, p.cost || 0);
            }
        });

        allTxns.forEach(t => {
            const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            let txnCogs = 0;
            t.items.forEach(item => {
                const cost = item.cost !== undefined ? item.cost : (productCostMap.get(item.code) || 0);
                txnCogs += cost * item.quantity;
            });

            if (!dailyProfitData[dateStr]) {
                dailyProfitData[dateStr] = { count: 0, net: 0, cogs: 0 };
            }
            dailyProfitData[dateStr].count++;
            dailyProfitData[dateStr].net += t.grandTotal;
            dailyProfitData[dateStr].cogs += txnCogs;
        });

        const sortedDays = Object.entries(dailyProfitData).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        let totalCount = 0;
        let totalNet = 0;
        let totalCogs = 0;
        let totalProfit = 0;

        sortedDays.forEach(([date, data]) => {
            const profit = data.net - data.cogs;
            const margin = data.net > 0 ? (profit / data.net) * 100 : 0;
            totalCount += data.count;
            totalNet += data.net;
            totalCogs += data.cogs;
            totalProfit += profit;
            csv += `"${date}","${data.count}","${data.net.toFixed(2)}","${data.cogs.toFixed(2)}","${profit.toFixed(2)}","${margin.toFixed(1)}%"\n`;
        });

        const overallMargin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;
        csv += `"TOTAL","${totalCount} txns","${totalNet.toFixed(2)}","${totalCogs.toFixed(2)}","${totalProfit.toFixed(2)}","${overallMargin.toFixed(1)}%"\n`;
    }

    if (csv) {
        downloadCSV(csv, filename);
    }
}


async function performZReportShiftClosure() {
    // 1. Calculate shift aggregates using active (unclosed) transactions
    const currentZId = "ZREP-" + String(zReports.length + 1).padStart(4, '0');
    const timestamp = new Date().toISOString();
    
    const activeTxns = transactions.filter(t => !t.closed);
    const count = activeTxns.length;
    let salesVal = 0;
    let discountVal = 0;
    let cashVal = 0;
    let cardVal = 0;

    activeTxns.forEach(t => {
        salesVal += t.grandTotal;
        discountVal += t.discount;
        if (t.paymentMode === "cash") {
            cashVal += t.grandTotal;
        } else if (t.paymentMode === "card") {
            cardVal += t.grandTotal;
        } else if (t.paymentMode === "split") {
            const cashPart = t.cashTendered || 0;
            cashVal += cashPart;
            cardVal += Math.max(0, t.grandTotal - cashPart);
        } else {
            cardVal += t.grandTotal;
        }
    });

    const newZReport = {
        id: currentZId,
        timestamp,
        closedBy: "Admin Cashier",
        transactionsCount: count,
        transactionCount: count,
        totalsSales: salesVal,
        grossRevenue: salesVal,
        totalDiscount: discountVal,
        totalDiscounts: discountVal,
        cashShare: cashVal,
        cardShare: cardVal,
        rawTransactionsList: [...activeTxns] // Archive full snapshot of shift sales
    };

    // 2. Append Z-Report to logs & save to cloud
    zReports.push(newZReport);
    await db.saveZReport(newZReport);

    // 3. Mark active shift transactions as closed (does NOT delete from Firestore, keeping customer e-receipts working!)
    const closedTxnIds = [];
    activeTxns.forEach(t => {
        t.closed = true;
        t.zReportId = currentZId;
        closedTxnIds.push(t.id);
    });
    await db.closeShiftTransactions(currentZId, closedTxnIds);

    // 4. Save active cart state
    db.saveActiveCart(cart);

    // 5. Update display tables & charts
    renderZReportsTab();
    renderAnalyticsCharts();
    
    const storageLabel = db.isCloud() ? 'cloud vault' : 'local registers';
    alert(`Success! Shift closed. Z-Report ${currentZId} archived to ${storageLabel}.`);
    
    // View/print the Z-Report
    printHistoricalZReport(currentZId);
}

// Generates thermal print view layout for Z-Report summaries
window.printHistoricalZReport = function(zReportId) {
    const report = zReports.find(r => r.id === zReportId);
    if (!report) return;

    const printArea = document.getElementById("receipt-print-area");
    const formattedDate = new Date(report.timestamp).toLocaleString();

    printArea.innerHTML = `
        <div class="receipt-header">
            <h3>${settings.companyName}</h3>
            <p>${settings.companyAddress}</p>
            <div class="receipt-divider"></div>
            <p><strong>SHIFT CLOSURE Z-REPORT</strong></p>
            <p><strong>Report ID: ${report.id}</strong></p>
            <p>Closed On: ${formattedDate}</p>
            <p>Operator: ${report.closedBy}</p>
        </div>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-summary" style="font-size: 11px;">
            <div class="receipt-row-bold">
                <span>REGISTER SUMMARY</span>
            </div>
            <div class="receipt-row">
                <span>Invoices Issued:</span>
                <span>${report.transactionsCount} Sales</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-row">
                <span>Gross Invoiced Sales:</span>
                <span>LKR ${report.totalsSales.toFixed(2)}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-row-bold">
                <span>DISCOUNTS GRANTED (LKR)</span>
            </div>
            <div class="receipt-row">
                <span>Total Discounts Given:</span>
                <span>LKR ${report.totalDiscount.toFixed(2)}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-row-bold">
                <span>PAYMENT TYPE ACCOUNT</span>
            </div>
            <div class="receipt-row">
                <span>Cash Drawer Sales:</span>
                <span>LKR ${report.cashShare.toFixed(2)}</span>
            </div>
            <div class="receipt-row">
                <span>Card Drawer Sales:</span>
                <span>LKR ${report.cardShare.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="receipt-footer">
            <div class="receipt-divider"></div>
            <p>=== REGISTER SESSION CLOSED ===</p>
            <p>ApexPOS Enterprise Audit Vault</p>
        </div>
    `;

    document.getElementById("receipt-modal").classList.add("active");
};

// ==========================================================================
// Settings, Config and Mock Data Injection
// ==========================================================================

function setupSettingsHandlers() {
    // Database Server Connection Mode Settings Handler
    const dbModeSelect = document.getElementById("set-database-mode");
    if (dbModeSelect) {
        dbModeSelect.value = localStorage.getItem("apexpos_db_mode") || "cloud";
    }

    const btnSaveDbMode = document.getElementById("btn-save-db-mode");
    if (btnSaveDbMode) {
        btnSaveDbMode.addEventListener("click", () => {
            const selectedMode = document.getElementById("set-database-mode").value;
            const currentMode = localStorage.getItem("apexpos_db_mode") || "cloud";

            if (selectedMode !== currentMode) {
                localStorage.setItem("apexpos_db_mode", selectedMode);
                const modeLabel = selectedMode === "cloud" ? "Cloud Server (Firebase)" : "Local Server (LocalStorage)";
                alert(`Database server mode updated to ${modeLabel}.\n\nThe POS terminal will now reload to apply configuration changes.`, () => {
                    window.location.reload();
                });
            } else {
                alert("No changes detected in database server mode.");
            }
        });
    }

    // Branding changes form
    document.getElementById("settings-branding-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        settings.companyName = document.getElementById("set-company-name").value.trim();
        settings.companyAddress = document.getElementById("set-company-address").value.trim();
        settings.companyPhone = document.getElementById("set-company-phone").value.trim();
        
        db.saveSettings(settings);
        alert("Store Info branding details updated successfully.");
    });

    // Tax form removed (SSCL/VAT disabled — system is tax-free)


    // Passcode configuration changes form
    document.getElementById("settings-passcode-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newPasscode = document.getElementById("set-admin-passcode").value;
        const confirmPasscode = document.getElementById("set-admin-passcode-confirm").value;
        
        if (newPasscode !== confirmPasscode) {
            alert("Passcodes do not match! Please check and try again.");
            return;
        }
        
        settings.adminPasscode = newPasscode;
        db.saveSettings(settings);
        
        document.getElementById("set-admin-passcode").value = "";
        document.getElementById("set-admin-passcode-confirm").value = "";
        alert("Administrative Back-Office passcode updated successfully.");
    });

    // SMS Gateway configurations form
    const smsForm = document.getElementById("settings-sms-form");
    if (smsForm) {
        // Wire E-Bill enable/disable toggle
        const ebillChk = document.getElementById("set-ebill-enabled");
        if (ebillChk) {
            ebillChk.addEventListener("change", () => {
                applyEbillToggleState(ebillChk.checked);
            });
        }

        // Handle SMS method dropdown change
        const setSmsMethod = document.getElementById("set-sms-method");
        if (setSmsMethod) {
            setSmsMethod.addEventListener("change", () => {
                const gatewayFields = document.getElementById("sms-gateway-fields");
                if (gatewayFields) {
                    gatewayFields.style.display = setSmsMethod.value === "gateway" ? "block" : "none";
                }
            });
        }

        smsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const ebillEnabledEl = document.getElementById("set-ebill-enabled");
            settings.ebillEnabled = ebillEnabledEl ? ebillEnabledEl.checked : false;
            settings.smsMethod = document.getElementById("set-sms-method").value;
            settings.smsUserId = document.getElementById("set-sms-userid").value.trim();
            settings.smsApiKey = document.getElementById("set-sms-apikey").value.trim();
            settings.smsSenderId = document.getElementById("set-sms-senderid").value.trim() || "NotifyDEMO";
            
            db.saveSettings(settings);

            // Apply toggle state immediately
            applyEbillToggleState(settings.ebillEnabled);

            const statusLabel = settings.ebillEnabled ? "✅ E-Bill SMS ENABLED" : "🚫 E-Bill SMS DISABLED";
            alert(`SMS configuration saved.\n${statusLabel}`);
        });
    }

    // Wipe database (cloud + local)
    document.getElementById("btn-wipe-database").addEventListener("click", async () => {
        const storageLabel = db.isCloud() ? 'Cloud Firestore AND browser LocalStorage' : 'browser LocalStorage Cache';
        const check = confirm(
            "DANGER ZONE WARNING!\n\n" +
            `This will wipe ALL transactional logs, inventory items, and configurations from ${storageLabel}.\n\n` +
            "Do you want to proceed and factory reset database?"
        );
        if (check) {
            await db.factoryReset();
            await loadDatabase();
            renderCategories();
            renderProductsGrid();
            renderCart();
            const doneLabel = db.isCloud() ? 'Cloud + local' : 'Local';
            alert(`${doneLabel} database factory reset completed. Reloaded default catalog items.`);
        }
    });

    // Inject heavy mock transaction data history (highly analytical visuals immediately!)
    document.getElementById("btn-load-mock-sales").addEventListener("click", () => {
        injectMockTransactions();
    });
}

async function injectMockTransactions() {
    const check = confirm("Load a robust sample database representing 14 transactions spread over the past week to populate analytics charts immediately?");
    if (!check) return;

    // Reset database to ensure clean metrics charts
    transactions = [];
    await db.clearTransactions();
    
    // Generate dates representing the past 7 days
    const now = new Date();
    const mockTxns = [];

    // Helper to pick random products
    function getRandomProducts(cnt) {
        const list = [];
        const shuf = [...products].sort(() => 0.5 - Math.random());
        for (let i = 0; i < cnt; i++) {
            const item = shuf[i];
            const qty = Math.floor(Math.random() * 3) + 1; // 1-3 qty
            list.push({
                code: item.code,
                name: item.name,
                price: item.price,
                quantity: qty,
                total: item.price * qty
            });
        }
        return list;
    }

    const currentSettings = settings;

    // Build 14 mock transactions
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        // 2 transactions per day
        for (let tNum = 1; tNum <= 2; tNum++) {
            const txnDate = new Date(now);
            txnDate.setDate(now.getDate() - dayOffset);
            txnDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 59));

            const items = getRandomProducts(Math.floor(Math.random() * 3) + 1); // 1-3 items
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            
            // Random discount
            const discountAmt = Math.random() > 0.6 ? (Math.random() > 0.5 ? subtotal * 0.1 : 200.0) : 0;
            const netSubtotal = subtotal - discountAmt;
            
            const grandTotal = netSubtotal; // Tax-free!

            const paymentMode = Math.random() > 0.45 ? "cash" : "card";
            const cashTenderedVal = paymentMode === "cash" ? Math.ceil(grandTotal / 500) * 500 : grandTotal;

            mockTxns.push({
                id: "TXN" + (10000 + mockTxns.length),
                timestamp: txnDate.toISOString(),
                items,
                subtotal,
                discount: discountAmt,
                netSubtotal,
                grandTotal,
                paymentMode,
                cashTendered: cashTenderedVal,
                changeDue: paymentMode === "cash" ? Math.max(0, cashTenderedVal - grandTotal) : 0,
                refNo: paymentMode === "card" ? "CRD-" + Math.floor(100000 + Math.random() * 900000) : ""
            });
        }
    }

    transactions = mockTxns;
    // Save all mock transactions to cloud
    await db.saveAllTransactions(transactions);
    const storageLabel = db.isCloud() ? 'cloud database' : 'local storage';
    alert(`Injected 14 mock transactions across the past week into ${storageLabel}. Visit Back-Office to see the updated graphs!`);
    
    // Refresh tables and charts if active
    triggerAdminTabRefresh();
}

function setupMobileHandlers() {
    const btnMobileShowCatalog = document.getElementById("btn-mobile-show-catalog");
    const btnMobileShowCart = document.getElementById("btn-mobile-show-cart");
    const cashierLayout = document.querySelector(".cashier-layout");

    if (btnMobileShowCatalog && btnMobileShowCart && cashierLayout) {
        btnMobileShowCatalog.addEventListener("click", () => {
            btnMobileShowCatalog.classList.add("active");
            btnMobileShowCart.classList.remove("active");
            cashierLayout.classList.remove("show-cart-panel");
        });
        btnMobileShowCart.addEventListener("click", () => {
            btnMobileShowCatalog.classList.remove("active");
            btnMobileShowCart.classList.add("active");
            cashierLayout.classList.add("show-cart-panel");
        });
    }
}

function showHeldOrdersModal() {
    const modal = document.getElementById("held-orders-modal");
    const listContainer = document.getElementById("held-orders-list");
    const countBadge = document.getElementById("held-modal-count");
    
    if (!modal || !listContainer) return;
    
    countBadge.textContent = `${heldCarts.length} Parked`;
    listContainer.innerHTML = "";
    
    if (heldCarts.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i data-lucide="archive" style="width: 48px; height: 48px; opacity: 0.25; margin-bottom: 12px; display: inline-block;"></i>
                <p style="margin: 0; font-size: 14px;">No parked orders currently queueing</p>
            </div>
        `;
        modal.classList.add("active");
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
    }
    
    heldCarts.forEach(c => {
        const subtotal = c.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        let discountAmt = 0;
        if (c.discount) {
            if (c.discount.type === "percent") {
                discountAmt = subtotal * (c.discount.value / 100);
            } else {
                discountAmt = c.discount.value;
            }
        }
        const grandTotal = Math.max(0, subtotal - discountAmt);
        
        // Item preview string
        const itemNamesPreview = c.items.map(item => `${item.product.name} &times; ${item.quantity}`).join(", ");
        
        const card = document.createElement("div");
        card.className = "held-order-card";
        card.style.cssText = `
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 14px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.2s ease;
        `;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
                <span style="font-weight: 700; color: var(--text-color); font-size: 14px;">#${c.id}</span>
                <span style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${c.time}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                <div style="flex: 1;">
                    <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5; word-break: break-word;">
                        ${itemNamesPreview}
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--color-primary); margin-top: 6px;">
                        Total: LKR ${grandTotal.toFixed(2)}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-self: flex-end;">
                    <button class="btn-icon-danger" onclick="discardHeldOrder('${c.id}')" title="Discard Order" style="padding: 6px 10px; height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                    <button class="btn-primary" onclick="recallHeldOrder('${c.id}')" style="padding: 6px 12px; font-size: 12px; height: 32px; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="folder-open" style="width: 12px; height: 12px;"></i> Load
                    </button>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
    
    modal.classList.add("active");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

window.recallHeldOrder = function(id) {
    const recalled = heldCarts.find(c => c.id === id);
    if (!recalled) return;
    
    const activeItemsCount = cart.length;
    if (activeItemsCount > 0) {
        const confirmMerge = confirm("You already have items in the active cart. Click OK to MERGE the parked order into your active cart, or Cancel to OVERWRITE (clear) the current cart before loading.");
        if (confirmMerge) {
            // Merge
            recalled.items.forEach(newItem => {
                const existing = cart.find(i => i.product.code === newItem.product.code);
                if (existing) {
                    existing.quantity += newItem.quantity;
                } else {
                    cart.push({ ...newItem });
                }
            });
        } else {
            // Overwrite
            cart = recalled.items;
            cartDiscount = recalled.discount;
        }
    } else {
        cart = recalled.items;
        cartDiscount = recalled.discount;
    }
    
    // Remove from parked stack
    heldCarts = heldCarts.filter(c => c.id !== id);
    
    document.getElementById("cart-discount-input").value = cartDiscount.value || "";
    const btn = document.getElementById("btn-discount-toggle");
    if (btn) btn.textContent = cartDiscount.type === "percent" ? "%" : "LKR";
    
    renderCart();
    persistState();
    persistHeldCarts();
    
    document.getElementById("held-orders-modal").classList.remove("active");
};

window.discardHeldOrder = function(id) {
    if (!confirm("Are you sure you want to permanently discard this parked order?")) return;
    
    heldCarts = heldCarts.filter(c => c.id !== id);
    persistState();
    persistHeldCarts();
    showHeldOrdersModal();
};

// ==========================================================================
// Desktop App Integration & Advanced Features
// ==========================================================================

// Note: isElectron and ipcRenderer are declared at top of app.js for safe global access

// Network connectivity status updater
function updateNetworkStatus() {
    const dot = document.getElementById("network-status-dot");
    const text = document.getElementById("network-status-text");
    if (!dot || !text) return;
    
    if (navigator.onLine) {
        dot.style.background = "#10b981"; // green
        dot.style.animation = "none";
        text.textContent = "Synced";
    } else {
        dot.style.background = "#ef4444"; // red
        dot.style.animation = "pulse 1.5s infinite";
        text.textContent = "Offline Mode";
    }
}

// Register network status events
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
document.addEventListener("DOMContentLoaded", () => {
    updateNetworkStatus();
    
    // Wire CSV Exporters
    const exportInvBtn = document.getElementById("btn-export-inventory");
    if (exportInvBtn) {
        exportInvBtn.addEventListener("click", exportProductsToCSV);
    }
    const exportTxnsBtn = document.getElementById("btn-export-transactions");
    if (exportTxnsBtn) {
        exportTxnsBtn.addEventListener("click", exportTransactionsToCSV);
    }
    const exportZBtn = document.getElementById("btn-export-zreports");
    if (exportZBtn) {
        exportZBtn.addEventListener("click", exportZReportsToCSV);
    }

    // Configure Hardware & Desktop Settings
    const configCard = document.getElementById("desktop-config-card");
    if (configCard) {
        configCard.style.display = "block";
    }

    if (ipcRenderer) {
        const rowAutoLaunch = document.getElementById("row-setting-autolaunch");
        if (rowAutoLaunch) rowAutoLaunch.style.display = "flex";
        const rowCustDisp = document.getElementById("row-setting-custdisp");
        if (rowCustDisp) rowCustDisp.style.display = "flex";
        const rowSilent = document.getElementById("row-setting-silentprint");
        if (rowSilent) rowSilent.style.display = "flex";

        // 1. Auto-Launch checkbox
        const autolaunchChk = document.getElementById("set-auto-launch-checkbox");
        if (autolaunchChk) {
            ipcRenderer.invoke('get-auto-launch').then(status => {
                autolaunchChk.checked = status;
                applyToggleUI("autolaunch", status);
            }).catch(e => console.error(e));

            autolaunchChk.addEventListener("change", () => {
                const enabled = autolaunchChk.checked;
                ipcRenderer.send('set-auto-launch', enabled);
                applyToggleUI("autolaunch", enabled);
                settings.autoLaunchEnabled = enabled;
                db.saveSettings(settings);
            });
        }

        // 2. Customer Display checkbox
        const custdispChk = document.getElementById("set-customer-display-checkbox");
        if (custdispChk) {
            const status = settings.customerDisplayEnabled === true;
            custdispChk.checked = status;
            applyToggleUI("custdisp", status);
            ipcRenderer.send('toggle-customer-display', status);

            custdispChk.addEventListener("change", () => {
                const enabled = custdispChk.checked;
                ipcRenderer.send('toggle-customer-display', enabled);
                applyToggleUI("custdisp", enabled);
                settings.customerDisplayEnabled = enabled;
                db.saveSettings(settings);
                if (enabled) {
                    syncCustomerDisplay("cart");
                }
            });
        }

        // 3. Silent Print checkbox
        const silentprintChk = document.getElementById("set-silent-print-checkbox");
        if (silentprintChk) {
            const status = settings.silentPrintEnabled === true;
            silentprintChk.checked = status;
            applyToggleUI("silentprint", status);

            silentprintChk.addEventListener("change", () => {
                const enabled = silentprintChk.checked;
                applyToggleUI("silentprint", enabled);
                settings.silentPrintEnabled = enabled;
                db.saveSettings(settings);
            });
        }
    }

    // 4. Auto-Print KOT checkbox (Available in both Electron and Web browser)
    const autokotChk = document.getElementById("set-auto-kot-checkbox");
    if (autokotChk) {
        const kotStatus = settings.autoPrintKot !== false;
        autokotChk.checked = kotStatus;
        applyToggleUI("autokot", kotStatus);

        autokotChk.addEventListener("change", () => {
            const enabled = autokotChk.checked;
            applyToggleUI("autokot", enabled);
            settings.autoPrintKot = enabled;
            db.saveSettings(settings);
            if (typeof showToast === "function") {
                showToast(enabled ? "✅ Auto-Print KOT Enabled" : "🚫 Auto-Print KOT Disabled");
            }
        });
    }
});

function applyToggleUI(prefix, enabled) {
    const track = document.getElementById(`${prefix}-toggle-track`);
    const thumb = document.getElementById(`${prefix}-toggle-thumb`);
    if (track) track.style.background = enabled ? "var(--color-primary)" : "#374151";
    if (thumb) thumb.style.transform = enabled ? "translateX(20px)" : "translateX(0)";
}

// Sync Customer Display window
window.syncCustomerDisplay = function(state = "cart") {
    if (!ipcRenderer || !settings.customerDisplayEnabled) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    let discountVal = 0;
    if (cartDiscount) {
        if (cartDiscount.type === "percent") {
            discountVal = subtotal * (cartDiscount.value / 100);
        } else {
            discountVal = cartDiscount.value;
        }
    }
    const grandTotal = Math.max(0, subtotal - discountVal);

    ipcRenderer.send('update-customer-display', {
        cart: cart,
        discount: cartDiscount,
        totals: {
            subtotal: subtotal,
            discount: discountVal,
            grandTotal: grandTotal
        },
        state: state
    });
};

// Trigger Silent Printing or fallback to standard printer window
window.triggerPhysicalPrint = function() {
    if (ipcRenderer && settings.silentPrintEnabled) {
        if (window.currentActiveReceiptTxnId) {
            // Cache the transaction object locally to prevent database retrieval delay
            const txn = transactions.find(t => t.id === window.currentActiveReceiptTxnId);
            if (txn) {
                localStorage.setItem('apex_pos_last_printed_txn', JSON.stringify(txn));
            }
            ipcRenderer.send('print-silent', window.currentActiveReceiptTxnId);
            showToast("🖨️ Silent Print job sent to printer.");
        } else {
            window.print();
        }
    } else {
        window.print();
    }
};

// Excel/CSV Exporters
function exportProductsToCSV() {
    let csv = "\uFEFFSKU Code,Product Name,Category,Unit Price (LKR),Description\n";
    products.forEach(p => {
        csv += `"${p.code}","${p.name.replace(/"/g, '""')}","${p.category}","${p.price.toFixed(2)}","${(p.description || '').replace(/"/g, '""')}"\n`;
    });
    downloadCSV(csv, "products_inventory.csv");
}

function exportTransactionsToCSV() {
    let csv = "\uFEFFTransaction ID,Date & Time,Payment Mode,Subtotal (LKR),Discounts (LKR),Grand Total (LKR),Customer Phone,Cash Tendered,Change Due\n";
    transactions.forEach(t => {
        const dt = new Date(t.timestamp).toLocaleString();
        csv += `"${t.id}","${dt}","${t.paymentMode}","${t.subtotal.toFixed(2)}","${t.discount.toFixed(2)}","${t.grandTotal.toFixed(2)}","${t.customerPhone || ''}","${t.cashTendered || t.grandTotal}","${t.changeDue || 0}"\n`;
    });
    downloadCSV(csv, "transactions_history.csv");
}

function exportZReportsToCSV() {
    let csv = "\uFEFFZ-Report ID,Closure Date,Closed By,Gross Revenue (LKR),Total Discounts (LKR),Invoice Count\n";
    zReports.forEach(z => {
        const dt = new Date(z.timestamp).toLocaleString();
        const gross = z.totalsSales !== undefined ? z.totalsSales : (z.grossRevenue || 0);
        const discount = z.totalDiscount !== undefined ? z.totalDiscount : (z.totalDiscounts || 0);
        const count = z.transactionsCount !== undefined ? z.transactionsCount : (z.transactionCount || 0);
        csv += `"${z.id}","${dt}","${z.closedBy}","${gross.toFixed(2)}","${discount.toFixed(2)}","${count}"\n`;
    });
    downloadCSV(csv, "zreports_history.csv");
}

function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// ==========================================================================
// PWA & ChromeOS Installation Support
// ==========================================================================

let deferredPWAInstallPrompt = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
        }).catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPWAInstallPrompt = e;
    const headerBtn = document.getElementById('btn-install-pwa');
    if (headerBtn) {
        headerBtn.style.display = 'inline-flex';
    }
});

window.triggerPWAInstall = function() {
    if (deferredPWAInstallPrompt) {
        deferredPWAInstallPrompt.prompt();
        deferredPWAInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                if (typeof showToast === 'function') showToast('🎉 App installed successfully!');
                const headerBtn = document.getElementById('btn-install-pwa');
                if (headerBtn) headerBtn.style.display = 'none';
            }
            deferredPWAInstallPrompt = null;
        });
    } else {
        alert('To install ApexPOS on ChromeOS / Chromebook:\n\n1. Click the Chrome 3-dots menu (⋮) at top right.\n2. Click "Save and share" ➔ "Install ApexPOS".\n\nIt will add ApexPOS as an app icon on your ChromeOS shelf!');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const headerPwaBtn = document.getElementById('btn-install-pwa');
    if (headerPwaBtn) {
        headerPwaBtn.addEventListener('click', window.triggerPWAInstall);
    }
});
