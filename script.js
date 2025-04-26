// API Key and Google Sheets Information
const API_KEY = 'AIzaSyC5DCi_PeLMPpLZwSYj2QwOCwFrqomSJ6E';
const SPREADSHEET_ID = '1d1zYMNb8zbGoOI5OCeam16uPwVVxd03iJdeheGjU60Q';
const RANGE = 'A:C'; // We're looking at columns A through C as specified

// Elements
const trackingForm = document.getElementById('trackingForm');
const trackingNumber = document.getElementById('trackingNumber');
const loadingSpinner = document.getElementById('loadingSpinner');
const trackingResults = document.getElementById('trackingResults');
const trackingError = document.getElementById('trackingError');
const trackingTimeline = document.getElementById('trackingTimeline');

// Sample shipment data for demonstration
const shipmentDatabase = {
    "HC123456": {
        id: "HC123456",
        status: "In Transit",
        origin: "Beijing, China",
        destination: "Ulaanbaatar, Mongolia",
        eta: "April 30, 2025",
        price: "$245.00",
        timeline: [
            { date: "April 27, 2025", time: "09:45", location: "Beijing Branch", status: "Package departed facility" },
            { date: "April 26, 2025", time: "16:30", location: "Beijing Branch", status: "Package processed for international shipping" },
            { date: "April 25, 2025", time: "11:20", location: "Beijing Branch", status: "Package received at facility" }
        ]
    },
    "HC789012": {
        id: "HC789012",
        status: "Delivered",
        origin: "Shanghai, China",
        destination: "Ulaanbaatar, Mongolia",
        eta: "April 24, 2025",
        price: "$180.50",
        timeline: [
            { date: "April 24, 2025", time: "14:15", location: "UB Central Branch", status: "Package delivered to recipient" },
            { date: "April 24, 2025", time: "09:30", location: "UB Central Branch", status: "Out for delivery" },
            { date: "April 23, 2025", time: "18:45", location: "UB Central Branch", status: "Package arrived at destination facility" },
            { date: "April 21, 2025", time: "07:20", location: "Erlian Branch", status: "Package cleared customs" },
            { date: "April 20, 2025", time: "12:10", location: "Shanghai Branch", status: "Package departed facility" },
            { date: "April 19, 2025", time: "15:40", location: "Shanghai Branch", status: "Package received at facility" }
        ]
    },
    "HC345678": {
        id: "HC345678",
        status: "Processing",
        origin: "Guangzhou, China",
        destination: "Ulaanbaatar, Mongolia",
        eta: "May 3, 2025",
        price: "$310.75",
        timeline: [
            { date: "April 26, 2025", time: "10:30", location: "Guangzhou Branch", status: "Package received at facility" }
        ]
    }
};

// Modal Functions
function openModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
}

function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate the selected tab and content
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Tracking Functions
trackingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const trackingNum = trackingNumber.value.trim();
    if (!trackingNum) return;
    
    // Reset previous results
    trackingResults.style.display = 'none';
    trackingError.style.display = 'none';
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    
    // Fetch tracking data
    fetchTrackingData(trackingNum);
});

function fetchTrackingData(trackingNum) {
    console.log(`Fetching data for tracking number: ${trackingNum}`);
    
    // Simulate API delay
    setTimeout(() => {
        // Hide spinner
        loadingSpinner.style.display = 'none';
        
        // Check our sample database first
        if (shipmentDatabase[trackingNum]) {
            displayTrackingResults(shipmentDatabase[trackingNum]);
            return;
        }
        
        // If not in sample database, try the Google Sheets API
        // Construct the API URL for Google Sheets
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        
        // Fetch data from Google Sheets API
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Process the data from Google Sheets
                const values = data.values || [];
                if (values.length) {
                    // Skip header row if present
                    const dataRows = values[0][0] === 'Tracking id' ? values.slice(1) : values;
                    
                    // Find the tracking number in the data
                    // Based on your data, column A contains tracking numbers
                    const shipmentRow = dataRows.find(row => row[0] === trackingNum);
                    
                    if (shipmentRow) {
                        // Found the tracking number, process the data
                        const shipmentData = {
                            id: shipmentRow[0], // Tracking ID
                            status: shipmentRow[1], // Status
                            price: shipmentRow[2], // Cost
                            // Add default/placeholder values for other fields
                            origin: "China",
                            destination: "Mongolia",
                            eta: calculateETA(shipmentRow[1]),
                            timeline: generateTimeline(shipmentRow[1])
                        };
