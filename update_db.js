import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
    const workingStream = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

    const { data, error } = await supabase
        .from('partidos_hoy')
        .update({ stream_url: workingStream })
        .in('id', [1, 2]); // Update first two rows

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Successfully updated stream URLs to a working test stream.");
    }
}
update();
