import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertM3U() {
    const m3uUrl = "http://localhost:5175/test-playlist.m3u";

    const { data, error } = await supabase
        .from('partidos_hoy')
        .insert([{
            equipo_local: "Playlist M3U",
            equipo_visitante: "Demo",
            torneo: "Prueba de Listas",
            categoria: "Deportes 24/7",
            horario: "24 Horas",
            stream_url: m3uUrl
        }]);

    if (error) {
        console.error("Error inserting:", error);
    } else {
        console.log("Successfully inserted .m3u playlist row.");
    }
}
insertM3U();
