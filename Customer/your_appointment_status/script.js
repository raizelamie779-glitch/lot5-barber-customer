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

    let initialLoad = true;

    // Fetch initial status and poll every 2 seconds for real-time feel
    if (queueId) {
        fetchQueueStatus();
        setInterval(fetchQueueStatus, 2000);
    }

    async function fetchQueueStatus() {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // Fetch active queue and their associated tasks for today
            const { data: queueData, error: qErr } = await supabaseClient
                .from('queue')
                .select('*, task(*)')
                .gte('queue_timestamp', startOfDay.toISOString());

            if (qErr) throw qErr;

            const myQueueItem = queueData.find(q => q.queue_id === queueId);
            if (!myQueueItem) {
                document.getElementById('queue-position').innerText = "NOT IN QUEUE";
                document.getElementById('wait-time').innerText = "--";
                initialLoad = false;
                return;
            }

            if (myQueueItem.queue_status === 'cancelled') {
                document.getElementById('queue-position').innerText = "CANCELLED";
                document.getElementById('wait-time').innerText = "You have cancelled your spot.";
                const cancelBtn = document.getElementById('cancel-btn');
                if (cancelBtn) cancelBtn.style.display = 'none';
                initialLoad = false;
                return;
            }

            if (myQueueItem.queue_status === 'absent') {
                document.getElementById('queue-position').innerText = "ABSENT";
                document.getElementById('wait-time').innerText = "You missed your spot.";
                const cancelBtn = document.getElementById('cancel-btn');
                if (cancelBtn) cancelBtn.style.display = 'none';
                initialLoad = false;
                return;
            }

            let myTask = null;
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
                    const cancelBtn = document.getElementById('cancel-btn');
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    initialLoad = false;
                    return;
                } else if (myTask.task_status === 'completed') {
                    if (initialLoad) {
                        window.location.href = '../lot5_barber/';
                        return;
                    }
                    document.getElementById('queue-position').innerText = "COMPLETED";
                    document.getElementById('wait-time').innerText = "Thanks for visiting!";
                    const cancelBtn = document.getElementById('cancel-btn');
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    initialLoad = false;
                    return;
                }
            }

            const now = new Date();
            const fakeNow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()));

            // Evaluate statuses dynamically for all "in-progress" items waiting
            const inProgressItems = queueData.filter(q => q.queue_status === 'in-progress' && (!q.task || q.task.length === 0));

            // Dynamic absent evaluation for bookings
            for (let item of inProgressItems) {
                let updatedToAbsent = false;
                if (item.appoint_type === 'booking' && item.appointment_time) {
                    const apptTime = new Date(item.appointment_time);
                    if ((fakeNow - apptTime) > 10 * 60 * 1000) {
                        updatedToAbsent = true;
                    }
                }
                
                if (updatedToAbsent) {
                    await supabaseClient.from('queue').update({ queue_status: 'absent' }).eq('queue_id', item.queue_id);
                    item.queue_status = 'absent';
                }
            }

            // Valid waiting list
            const waitingList = inProgressItems.filter(q => q.queue_status === 'in-progress');

            // Sort waiting list
            waitingList.sort((a, b) => {
                const getScore = (q) => {
                    if (q.appoint_type === 'booking') {
                        const appTime = new Date(q.appointment_time);
                        return appTime <= fakeNow ? 1 : 3;
                    }
                    return 2; // walk-in
                };
                
                const scoreA = getScore(a);
                const scoreB = getScore(b);

                if (scoreA !== scoreB) {
                    return scoreA - scoreB;
                }

                if (scoreA === 1 || scoreA === 3) {
                    return new Date(a.appointment_time) - new Date(b.appointment_time);
                } else {
                    const timeA = new Date(a.queue_timestamp + (a.queue_timestamp.endsWith('Z') ? '' : 'Z'));
                    const timeB = new Date(b.queue_timestamp + (b.queue_timestamp.endsWith('Z') ? '' : 'Z'));
                    return timeA - timeB;
                }
            });

            // Check if 1st in line is a walk-in who waited > 1 hour
            while (waitingList.length > 0) {
                const first = waitingList[0];
                if (first.appoint_type === 'walk-in') {
                    const joinedTime = new Date(first.queue_timestamp + (first.queue_timestamp.endsWith('Z') ? '' : 'Z'));
                    if ((now - joinedTime) > 60 * 60 * 1000) {
                        await supabaseClient.from('queue').update({ queue_status: 'absent' }).eq('queue_id', first.queue_id);
                        if (first.queue_id === queueId) {
                            myQueueItem.queue_status = 'absent';
                        }
                        waitingList.shift();
                        continue;
                    }
                }
                break;
            }

            if (myQueueItem.queue_status === 'absent') {
                document.getElementById('queue-position').innerText = "ABSENT";
                document.getElementById('wait-time').innerText = "You missed your spot.";
                const cancelBtn = document.getElementById('cancel-btn');
                if (cancelBtn) cancelBtn.style.display = 'none';
                initialLoad = false;
                return;
            }

            const myIndex = waitingList.findIndex(q => q.queue_id === queueId);

            if (myIndex === -1) {
                document.getElementById('queue-position').innerText = "NOT IN QUEUE";
                document.getElementById('wait-time').innerText = "--";
                initialLoad = false;
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
            initialLoad = false;

        } catch (err) {
            console.error("Error fetching queue status:", err);
            const posEl = document.getElementById('queue-position');
            if (posEl && posEl.innerText === 'Loading...') {
                posEl.innerText = "STATUS ERROR";
            }
            initialLoad = false;
        }
    }

    // We only have the cancel button on this page
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!queueId) {
                alert('Could not find your appointment ID. Please go back to home.');
                window.location.href = '../lot5_barber/';
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
                    .update({ queue_status: 'cancelled' })
                    .eq('queue_id', queueId);

                if (error) throw error;

                alert('Your spot has been successfully canceled.');
                window.location.href = '../lot5_barber/';
            } catch (error) {
                console.error('Error canceling spot:', error);
                alert('Failed to cancel your spot. Please check console for details.');
                cancelBtn.innerText = originalText;
                cancelBtn.disabled = false;
            }
        });
    }
});
