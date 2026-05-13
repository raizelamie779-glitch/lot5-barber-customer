// Supabase Configuration
const SUPABASE_URL = 'https://gclryovysxtjovwqubni.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHJ5b3Z5c3h0am92d3F1Ym5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjI4MjEsImV4cCI6MjA5MzUzODgyMX0.XaYoRlVugoI7xkrh6_EuyV18R1jWEFHwZG12UMbBA7c';
let supabaseClient;
let pollingInterval = null;
let isCompleted = false;

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!window.supabase) {
            throw new Error("Supabase script is not loaded from CDN.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (initError) {
        console.error("Initialization Error:", initError);
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queueId = urlParams.get('queue_id');

    if (queueId) {
        // Set the reference number using the queue_id
        const refEl = document.getElementById('booking-ref');
        if (refEl) refEl.innerText = `LOT5-${String(queueId).toUpperCase().slice(0, 8)}`;

        // Fetch initial details + check status
        fetchBookingDetails(queueId);

        // Try real-time subscription (best effort)
        subscribeToStatusChanges(queueId);

        // Start polling every 10 seconds as a reliable fallback
        pollingInterval = setInterval(() => pollStatus(queueId), 10000);
    }

    // ─── Show Completed UI (real-time or polling trigger) ────────────────────
    function showCompletedUI() {
        if (isCompleted) return; // prevent duplicate calls
        isCompleted = true;

        // Stop polling since we already know it's done
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // Update heading
        const heading = document.getElementById('status-heading');
        if (heading) heading.innerText = "Appointment Completed!";

        // Show completed badge
        const badge = document.getElementById('completed-badge');
        if (badge) badge.classList.remove('hidden');

        // Swap banners
        const barberBanner = document.getElementById('barber-banner');
        const completedBanner = document.getElementById('completed-banner');
        if (barberBanner) barberBanner.classList.add('hidden');
        if (completedBanner) completedBanner.classList.remove('hidden');

        // Hide cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) cancelBtn.classList.add('hidden');
    }

    // ─── Poll Status (fallback every 10s) ────────────────────────────────────
    async function pollStatus(id) {
        try {
            const { data, error } = await supabaseClient
                .from('queue')
                .select('queue_status')
                .eq('queue_id', id)
                .single();

            if (error) return; // silently ignore poll errors

            if (data && data.queue_status === 'completed') {
                showCompletedUI();
            }
        } catch (e) {
            // silent fail — polling will retry
        }
    }

    // ─── Fetch Booking Details on Load ───────────────────────────────────────
    async function fetchBookingDetails(id) {
        try {
            const { data, error } = await supabaseClient
                .from('queue')
                .select('appointment_time, queue_status')
                .eq('queue_id', id)
                .single();

            if (error) throw error;

            // If already completed on page load / refresh → redirect to main login page
            if (data && data.queue_status === 'completed') {
                window.location.href = '../lot5_barber/';
                return;
            }

            if (data && data.appointment_time) {
                const apptDate = new Date(data.appointment_time);

                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                const dayName = days[apptDate.getDay()];
                const monthName = months[apptDate.getMonth()];
                const dateNum = apptDate.getDate();
                const year = apptDate.getFullYear();

                let startHour = apptDate.getHours();
                const startMin = apptDate.getMinutes();
                const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                if (startHour > 12) startHour -= 12;
                if (startHour === 0) startHour = 12;
                const startTimeStr = `${startHour}:${String(startMin).padStart(2, '0')} ${startPeriod}`;

                const endDate = new Date(apptDate.getTime() + 30 * 60000);
                let endHour = endDate.getHours();
                const endMin = endDate.getMinutes();
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

    // ─── Real-time Subscription (primary, best effort) ───────────────────────
    function subscribeToStatusChanges(id) {
        try {
            supabaseClient
                .channel(`queue-status-${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'queue',
                        filter: `queue_id=eq.${id}`
                    },
                    (payload) => {
                        console.log('[Realtime] queue update received:', payload.new);
                        const newStatus = payload.new?.queue_status;
                        if (newStatus === 'completed') {
                            showCompletedUI();
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] subscription status:', status);
                });
        } catch (e) {
            console.warn('[Realtime] subscription failed, polling will handle updates:', e);
        }
    }

    // ─── Cancel Button ───────────────────────────────────────────────────────
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!queueId) {
                alert('Could not find your appointment ID. Please go back to home.');
                window.location.href = '../lot5_barber/';
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
                    .update({ queue_status: 'cancelled' })
                    .eq('queue_id', queueId);

                if (error) throw error;

                if (pollingInterval) clearInterval(pollingInterval);
                alert('Your booking has been successfully canceled.');
                window.location.href = '../lot5_barber/';
            } catch (error) {
                console.error('Error canceling booking:', error);
                alert('Failed to cancel your booking. Please check console for details.');
                cancelBtn.innerText = originalText;
                cancelBtn.disabled = false;
            }
        });
    }
});
