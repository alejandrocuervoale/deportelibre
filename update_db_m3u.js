import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
    const m3uUrl = "http://localhost:5175/test-playlist.m3u";

    const { data, error } = await supabase
        .from('partidos_hoy')
        .update({ stream_url: m3uUrl })
        .in('id', [3]); // Update third row to point to our test .m3u list

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Successfully updated row 3 to an .m3u playlist url.");
    }
}
update();
