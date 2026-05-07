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

    // Fetch initial status and poll every 2 seconds for real-time feel
    if (queueId) {
        fetchQueueStatus();
        setInterval(fetchQueueStatus, 2000);
    }

    async function fetchQueueStatus() {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);

            // Fetch active queue and their associated tasks for today
            const { data: queueData, error: qErr } = await supabaseClient
                .from('queue')
                .select('*, task(*)')
                .gte('queue_timestamp', startOfDay.toISOString())
                .order('queue_order', { ascending: true });

            if (qErr) throw qErr;

            // Optional fallback: if task(*) relation fails or returns empty due to RLS on join, 
            // try fetching the specific task directly.
            let myTask = null;
            const myQueueItem = queueData.find(q => q.queue_id === queueId);
            
            if (myQueueItem && myQueueItem.task && myQueueItem.task.length > 0) {
                myTask = myQueueItem.task[0]; // Assuming one active task per queue
            } else {
                // Try fetching directly just in case the join was restricted
                const { data: directTask } = await supabaseClient
                    .from('task')
                    .select('*')
                    .eq('queue_id', queueId)
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (directTask && directTask.length > 0) {
                    myTask = directTask[0];
                }
            }

            // Determine if current user is in chair or completed
            if (myTask) {
                if (myTask.task_status === 'started') {
                    document.getElementById('queue-position').innerText = "YOUR TURN NOW";
                    document.getElementById('wait-time').innerText = "Head to the barber chair";
                    return;
                } else if (myTask.task_status === 'completed') {
                    document.getElementById('queue-position').innerText = "COMPLETED";
                    document.getElementById('wait-time').innerText = "Thanks for visiting!";
                    return;
                }
            }

            // User is still waiting. Find position in the waiting list.
            const waitingList = [];
            queueData.forEach(q => {
                // A queue item is waiting if it has no task
                const hasTask = (q.task && q.task.length > 0);
                if (!hasTask) {
                    // Double check if there's no direct task match if we had to fallback
                    waitingList.push(q);
                }
            });

            // If we did a direct fetch and found myTask, remove myself from waitingList if I was added
            if (myTask) {
                const idx = waitingList.findIndex(q => q.queue_id === queueId);
                if (idx !== -1) waitingList.splice(idx, 1);
            }

            const myIndex = waitingList.findIndex(q => q.queue_id === queueId);

            if (myIndex === -1) {
                document.getElementById('queue-position').innerText = "NOT IN QUEUE";
                document.getElementById('wait-time').innerText = "--";
                return;
            }

            const totalPeopleAhead = myIndex;
            const position = totalPeopleAhead + 1;
            
            let positionText = "";
            if (position === 1) {
                positionText = "1ST IN LINE";
            } else {
                // Format ordinal (2nd, 3rd, 4th...)
                const j = position % 10;
                const k = position % 100;
                let suffix = "TH";
                if (j === 2 && k !== 12) suffix = "ND";
                else if (j === 3 && k !== 13) suffix = "RD";
                else if (j === 1 && k !== 11) suffix = "ST";
                positionText = `${position}${suffix} IN LINE`;
            }
            
            const waitTimeText = `~${totalPeopleAhead * 20} mins`;

            document.getElementById('queue-position').innerText = positionText;
            document.getElementById('wait-time').innerText = waitTimeText;

        } catch (err) {
            console.error("Error fetching queue status:", err);
            const posEl = document.getElementById('queue-position');
            if (posEl && posEl.innerText === 'Loading...') {
                posEl.innerText = "STATUS ERROR";
            }
        }
    }

    // We only have the cancel button on this page
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!queueId) {
                alert('Could not find your appointment ID. Please go back to home.');
                window.location.href = '../lot5_barber/index.html';
                return;
            }

            const confirmCancel = confirm('Are you sure you want to cancel your spot?');
            if (!confirmCancel) return;

            const originalText = cancelBtn.innerText;
            cancelBtn.innerText = 'CANCELLING...';
            cancelBtn.disabled = true;

            try {
                const { error } = await supabaseClient
                    .from('queue')
                    .delete()
                    .eq('queue_id', queueId);

                if (error) throw error;

                alert('Your spot has been successfully canceled.');
                window.location.href = '../lot5_barber/index.html';
            } catch (error) {
                console.error('Error canceling spot:', error);
                alert('Failed to cancel your spot. Please check console for details.');
                cancelBtn.innerText = originalText;
                cancelBtn.disabled = false;
            }
        });
    }
});
