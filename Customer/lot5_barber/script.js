// Supabase Configuration
const SUPABASE_URL = 'https://gclryovysxtjovwqubni.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHJ5b3Z5c3h0am92d3F1Ym5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjI4MjEsImV4cCI6MjA5MzUzODgyMX0.XaYoRlVugoI7xkrh6_EuyV18R1jWEFHwZG12UMbBA7c';

let currentMode = 'walkin';
let selectedDate = ''; 
let selectedTime = ''; 

function switchTab(tab) {
    currentMode = tab;
    const walkinTab = document.getElementById('tab-walkin');
    const bookingTab = document.getElementById('tab-booking');
    const timeSlots = document.getElementById('time-slots');
    const dateSelection = document.getElementById('date-selection');

    if (tab === 'walkin') {
        walkinTab.classList.add('text-primary-container', 'border-primary-container');
        walkinTab.classList.remove('text-on-surface-variant', 'border-transparent');

        bookingTab.classList.remove('text-primary-container', 'border-primary-container');
        bookingTab.classList.add('text-on-surface-variant', 'border-transparent');

        timeSlots.classList.add('hidden');
        timeSlots.classList.remove('flex');
        dateSelection.classList.add('hidden');
        dateSelection.classList.remove('flex');
    } else {
        bookingTab.classList.add('text-primary-container', 'border-primary-container');
        bookingTab.classList.remove('text-on-surface-variant', 'border-transparent');

        walkinTab.classList.remove('text-primary-container', 'border-primary-container');
        walkinTab.classList.add('text-on-surface-variant', 'border-transparent');

        timeSlots.classList.remove('hidden');
        timeSlots.classList.add('flex');
        dateSelection.classList.remove('hidden');
        dateSelection.classList.add('flex');
    }
}

let supabaseClient;

// Standard Operating Hours
const ALL_TIME_SLOTS = ["02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM"];
let bookedTimestamps = [];

function formatPGDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseTimeToPGTime(timeStr) {
    const timeParts = timeStr.match(/(\d+):(\d+)\s(AM|PM)/);
    let hours = parseInt(timeParts[1], 10);
    const minutes = timeParts[2];
    if (timeParts[3] === 'PM' && hours < 12) hours += 12;
    if (timeParts[3] === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase safely
    try {
        if (!window.supabase) {
            throw new Error("Supabase script is not loaded from CDN.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase successfully initialized.");
    } catch (initError) {
        console.error("Initialization Error:", initError);
        alert("System Error: " + initError.message);
    }

    generateDates();

    // Handle Form Submission
    const form = document.getElementById('booking-form');
    const confirmBtn = document.getElementById('confirm-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!name || !phone) {
            alert('Please fill in all fields.');
            return;
        }

        if (currentMode === 'booking' && !selectedTime) {
            alert('Please select an available time slot.');
            return;
        }

        const originalBtnHtml = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<span>Processing...</span>';
        confirmBtn.disabled = true;

        try {
            // 1. Insert into customer table
            const { data: customerData, error: customerError } = await supabaseClient
                .from('customer')
                .insert([{ customer_name: name, customer_contact: phone }])
                .select('customer_id')
                .single();

            if (customerError) throw customerError;

            const customerId = customerData.customer_id;

            // 2. Insert into queue table
            const queueData = {
                customer_id: customerId,
                appoint_type: currentMode === 'walkin' ? 'walk-in' : 'booking'
            };

            if (currentMode === 'booking') {
                const currentYear = new Date().getFullYear();
                const datePart = selectedDate.split(', ')[1]; // "Oct 24"
                
                // Parse 12-hour time into 24-hour time
                const pgTime = parseTimeToPGTime(selectedTime);
                
                // Format Date to YYYY-MM-DD
                // To avoid issues with string parsing, let's just use the selectedDate string cleanly
                // e.g. "Oct 24, 2024"
                const tempDate = new Date(`${datePart}, ${currentYear}`);
                const pgDate = formatPGDate(tempDate);
                
                queueData.appointment_time = `${pgDate} ${pgTime}`; // Postgres will parse this as a valid timestamp
            }

            const { data: insertedQueue, error: queueError } = await supabaseClient
                .from('queue')
                .insert([queueData])
                .select('queue_id')
                .single();

            if (queueError) throw queueError;

            const queueId = insertedQueue.queue_id;

            // 3. Redirect on success, passing the queue_id so they can cancel it if needed
            if (currentMode === 'walkin') {
                window.location.href = `../your_appointment_status/code.html?queue_id=${queueId}`;
            } else {
                window.location.href = `../booking_confirmed_status/code.html?queue_id=${queueId}`;
            }

        } catch (error) {
            console.error('Error submitting to Supabase:', error);
            // Show the specific error message to help with debugging
            let errorMsg = error.message || error.details || JSON.stringify(error);
            alert('Failed to connect or save data. Supabase Error: ' + errorMsg);
            
            confirmBtn.innerHTML = originalBtnHtml;
            confirmBtn.disabled = false;
        }
    });
});

async function generateDates() {
    const dateContainer = document.getElementById('dynamic-date-container');
    if (!dateContainer) return;
    dateContainer.innerHTML = '';

    const today = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        
        const dayName = daysOfWeek[d.getDay()];
        const monthName = months[d.getMonth()];
        const dateNum = d.getDate();
        
        // e.g., "Tue, Oct 24"
        const formattedLabel = `${dayName}, ${monthName} ${dateNum}`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg bg-[#121212] border border-[#222222] text-on-surface hover:border-primary-container transition-colors';
        
        const span = document.createElement('span');
        span.className = 'text-label-sm uppercase opacity-80';
        if (i === 0) {
            span.innerText = `Today, ${monthName} ${dateNum}`;
        } else if (i === 1) {
            span.innerText = `Tmrw, ${monthName} ${dateNum}`;
        } else {
            span.innerText = formattedLabel;
        }

        btn.appendChild(span);
        
        btn.addEventListener('click', async () => {
            selectedDate = formattedLabel; // Always keep the raw format for internal use
            
            // update classes
            Array.from(dateContainer.children).forEach(b => {
                b.className = 'flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg bg-[#121212] border border-[#222222] text-on-surface hover:border-primary-container transition-colors';
                b.querySelector('span').className = 'text-label-sm uppercase opacity-80';
            });
            btn.className = 'flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg bg-primary-container text-black border border-primary-container transition-colors';
            btn.querySelector('span').className = 'text-label-sm font-bold uppercase';
            
            await loadAvailabilityForDate(d);
        });

        dateContainer.appendChild(btn);
    }

    // Select the first date by default
    if (dateContainer.children.length > 0) {
        dateContainer.children[0].click();
    }
}

async function loadAvailabilityForDate(dateObj) {
    const timeContainer = document.getElementById('dynamic-time-container');
    if (!timeContainer) return;

    timeContainer.innerHTML = '<span class="text-on-surface-variant text-sm py-2 px-4">Loading availability...</span>';
    
    // Calculate start and end of day in local time, formatted for Postgres
    const pgDate = formatPGDate(dateObj);
    // Use ISO format with 'Z' to force UTC interpretation (matches how we store in Supabase)
    const startOfDay = `${pgDate}T00:00:00Z`;
    const endOfDay = `${pgDate}T23:59:59Z`;

    try {
        const { data, error } = await supabaseClient
            .from('queue')
            .select('appointment_time')
            .gte('appointment_time', startOfDay)
            .lte('appointment_time', endOfDay);

        if (error) throw error;
        
        bookedTimestamps = data.map(row => row.appointment_time);
        renderTimeSlots(dateObj);
    } catch (err) {
        console.error("Error fetching availability:", err);
        timeContainer.innerHTML = '<span class="text-error text-sm py-2 px-4">Failed to load time slots.</span>';
    }
}

function renderTimeSlots(dateObj) {
    const timeContainer = document.getElementById('dynamic-time-container');
    timeContainer.innerHTML = '';
    
    const pgDate = formatPGDate(dateObj);
    let foundAvailable = false;

    // Optional: If date is today, disable slots that have already passed in real-time
    const now = new Date();
    const isToday = now.getDate() === dateObj.getDate() && now.getMonth() === dateObj.getMonth();

    ALL_TIME_SLOTS.forEach(timeStr => {
        const pgTime = parseTimeToPGTime(timeStr);

        // Compare slot time directly using local hours/minutes to avoid UTC timezone issues
        const [slotHour, slotMinute] = pgTime.split(':').map(Number);
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();
        const hasPassed = isToday && (slotHour < nowHour || (slotHour === nowHour && slotMinute <= nowMinute));

        // Skip past slots entirely — don't render them at all
        if (hasPassed) return;

        // For booked check, use UTC-based comparison (matches Supabase storage format)
        const localDate = new Date(`${pgDate}T${pgTime}Z`);
        const localTimeMs = localDate.getTime();

        // Check against Supabase booked timestamps
        const isBooked = bookedTimestamps.some(rowStr => {
            const rowDate = new Date(rowStr);
            return rowDate.getTime() === localTimeMs;
        });

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = timeStr;
        
        if (isBooked) {
            btn.className = 'flex-shrink-0 py-2 px-4 rounded border border-[#333333] bg-[#222222] text-[#666666] font-label-sm cursor-not-allowed line-through opacity-50';
            btn.disabled = true;
        } else {
            btn.className = 'flex-shrink-0 py-2 px-4 rounded border border-[#222222] text-on-surface font-label-sm hover:border-primary-container transition-colors';
            btn.addEventListener('click', () => {
                selectedTime = timeStr;
                Array.from(timeContainer.children).forEach(b => {
                    if (!b.disabled) {
                        b.className = 'flex-shrink-0 py-2 px-4 rounded border border-[#222222] text-on-surface font-label-sm hover:border-primary-container transition-colors';
                    }
                });
                btn.className = 'flex-shrink-0 py-2 px-4 rounded border border-primary-container bg-primary-container text-black font-label-sm';
            });
            
            // Auto-select the first available slot
            if (!foundAvailable) {
                selectedTime = timeStr;
                btn.className = 'flex-shrink-0 py-2 px-4 rounded border border-primary-container bg-primary-container text-black font-label-sm';
                foundAvailable = true;
            }
        }
        
        timeContainer.appendChild(btn);
    });

    if (!foundAvailable) {
        timeContainer.innerHTML = '<span class="text-on-surface-variant text-sm py-2 px-4">No available slots for this date.</span>';
        selectedTime = null; // No time selected
    }
}
