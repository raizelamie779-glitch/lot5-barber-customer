// Supabase Configuration
const SUPABASE_URL = 'https://gclryovysxtjovwqubni.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHJ5b3Z5c3h0am92d3F1Ym5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjI4MjEsImV4cCI6MjA5MzUzODgyMX0.XaYoRlVugoI7xkrh6_EuyV18R1jWEFHwZG12UMbBA7c';
let supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!window.supabase) {
            throw new Error("Supabase script is not loaded from CDN.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (initError) {
        console.error("Initialization Error:", initError);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queueId = urlParams.get('queue_id');

    if (queueId) {
        // Set the reference number using the queue_id
        const refEl = document.getElementById('booking-ref');
        if (refEl) refEl.innerText = `LOT5-${String(queueId).padStart(4, '0')}`;

        // Fetch the real appointment time from Supabase
        fetchBookingDetails(queueId);
    }

    async function fetchBookingDetails(id) {
        try {
            const { data, error } = await supabaseClient
                .from('queue')
                .select('appointment_time')
                .eq('queue_id', id)
                .single();

            if (error) throw error;

            if (data && data.appointment_time) {
                // Parse the UTC timestamp from Supabase
                const apptDate = new Date(data.appointment_time);

                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // Format date as "Tuesday, May 6"
                // Use UTC values since we stored as UTC
                const dayName = days[apptDate.getUTCDay()];
                const monthName = months[apptDate.getUTCMonth()];
                const dateNum = apptDate.getUTCDate();
                const year = apptDate.getUTCFullYear();

                // Format start time (e.g. "3:00 PM")
                let startHour = apptDate.getUTCHours();
                const startMin = apptDate.getUTCMinutes();
                const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                if (startHour > 12) startHour -= 12;
                if (startHour === 0) startHour = 12;
                const startTimeStr = `${startHour}:${String(startMin).padStart(2, '0')} ${startPeriod}`;

                // Format end time (+30 mins for estimated service slot)
                const endDate = new Date(apptDate.getTime() + 30 * 60000);
                let endHour = endDate.getUTCHours();
                const endMin = endDate.getUTCMinutes();
                const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                if (endHour > 12) endHour -= 12;
                if (endHour === 0) endHour = 12;
                const endTimeStr = `${endHour}:${String(endMin).padStart(2, '0')} ${endPeriod}`;

                document.getElementById('booking-date').innerText = `${dayName}, ${monthName} ${dateNum}, ${year}`;
                document.getElementById('booking-time').innerText = `${startTimeStr} - ${endTimeStr}`;
            }
        } catch (err) {
            console.error('Error fetching booking details:', err);
            document.getElementById('booking-date').innerText = 'Could not load date';
            document.getElementById('booking-time').innerText = '';
        }
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!queueId) {
                alert('Could not find your appointment ID. Please go back to home.');
                window.location.href = '../lot5_barber/index.html';
                return;
            }

            const confirmCancel = confirm('Are you sure you want to cancel your booking?');
            if (!confirmCancel) return;

            const originalText = cancelBtn.innerText;
            cancelBtn.innerText = 'Canceling...';
            cancelBtn.disabled = true;

            try {
                const { error } = await supabaseClient
                    .from('queue')
                    .delete()
                    .eq('queue_id', queueId);

                if (error) throw error;

                alert('Your booking has been successfully canceled.');
                window.location.href = '../lot5_barber/index.html';
            } catch (error) {
                console.error('Error canceling booking:', error);
                alert('Failed to cancel your booking. Please check console for details.');
                cancelBtn.innerText = originalText;
                cancelBtn.disabled = false;
            }
        });
    }
});
