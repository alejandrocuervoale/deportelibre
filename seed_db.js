import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Inicializamos el cliente
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Iniciando carga de partidos al servidor...");

    const matches = [
        {
            equipo_local: "Boca Juniors",
            equipo_visitante: "River Plate",
            torneo: "Liga Profesional",
            categoria: "Fútbol Argentino",
            horario: "17:00",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "San Lorenzo",
            equipo_visitante: "Huracán",
            torneo: "Liga Profesional",
            categoria: "Fútbol Argentino",
            horario: "19:00",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Racing Club",
            equipo_visitante: "Independiente",
            torneo: "Liga Profesional",
            categoria: "Fútbol Argentino",
            horario: "21:00",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Estudiantes L.P.",
            equipo_visitante: "Gimnasia L.P.",
            torneo: "Liga Profesional",
            categoria: "Fútbol Argentino",
            horario: "15:30",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Rosario Central",
            equipo_visitante: "Newell's Old Boys",
            torneo: "Liga Profesional",
            categoria: "Fútbol Argentino",
            horario: "18:15",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Real Madrid",
            equipo_visitante: "FC Barcelona",
            torneo: "La Liga (España)",
            categoria: "Internacional",
            horario: "16:00",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Manchester City",
            equipo_visitante: "Arsenal",
            torneo: "Premier League",
            categoria: "Internacional",
            horario: "13:30",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Bayern Munich",
            equipo_visitante: "Borussia Dortmund",
            torneo: "Bundesliga",
            categoria: "Internacional",
            horario: "11:00",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Inter Milan",
            equipo_visitante: "AC Milan",
            torneo: "Serie A",
            categoria: "Internacional",
            horario: "15:45",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "PSG",
            equipo_visitante: "Olympique Marseille",
            torneo: "Ligue 1",
            categoria: "Internacional",
            horario: "16:45",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "ESPN Premium",
            equipo_visitante: "",
            torneo: "Canal 24/7",
            categoria: "Deportes 24/7",
            horario: "En vivo",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "TyC Sports",
            equipo_visitante: "",
            torneo: "Canal 24/7",
            categoria: "Deportes 24/7",
            horario: "En vivo",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "DSports",
            equipo_visitante: "",
            torneo: "Canal 24/7",
            categoria: "Deportes 24/7",
            horario: "En vivo",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Fox Sports",
            equipo_visitante: "",
            torneo: "Canal 24/7",
            categoria: "Deportes 24/7",
            horario: "En vivo",
            stream_url: "https://wp9xqedt.fubohd.com/disney13/mono.m3u8?token=94dda39cb4ccb9a5188dd9cf08af43bde9b49147-52-1772335411-1772317411"
        },
        {
            equipo_local: "Lista de Canales Extra",
            equipo_visitante: "Playlist",
            torneo: "Canales Externos",
            categoria: "Deportes 24/7",
            horario: "Varios",
            stream_url: "http://localhost:5176/test-playlist.m3u"
        }
    ];

    console.log("Borrando registros viejos (si los hay)...");
    const { error: deleteError } = await supabase.from('partidos_hoy').delete().neq('id', 0);

    // Ignoramos errores de RLS al borrar, quizás la tabla ya está vacía

    console.log(`Insertando ${matches.length} partidos...`);
    const { data, error } = await supabase.from('partidos_hoy').insert(matches).select();

    if (error) {
        console.error("❌ Error de Supabase al insertar:");
        console.error("Detalle del error:", error.message);
        console.error("Código:", error.code);

        if (error.code === '42501') {
            console.log("\n⚠️ ATENCIÓN: Tienes activado el RLS (Row Level Security) en Supabase.");
            console.log("Para que esto funcione con la ANON_KEY, debes ir a Supabase:");
            console.log("1. Ve a Authentication -> Policies (O ve a Table Editor -> partidos_hoy -> Add RLS Policy)");
            console.log("2. Desactiva RLS temporalmente o añade una política que permita INSERT a nivel anon/public.");
        }
    } else {
        console.log("✅ ¡Partidos insertados exitosamente!");
        console.log("Nuevos IDs:", data.map(d => d.id).join(', '));
    }
}

seed();
