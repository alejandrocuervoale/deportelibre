import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOURCES = [
    {
        name: 'Premium Latino & Deportes',
        file: 'scripts/tv5.m3u',
        category: 'Canales Premium'
    },
    {
        name: 'Películas Latino VOD',
        file: 'scripts/tv7.m3u',
        category: 'Películas'
    },
    {
        name: 'Backup Premium',
        file: 'scripts/tv2.m3u',
        category: 'Canales Premium'
    }
];

function parseM3U(text, category) {
    if (!text) return [];
    const lines = text.replace(/\r/g, '').split('\n');
    const channels = [];
    let currentChannel = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            currentChannel = {};
            // Logo
            const logoMatch = line.match(/tvg-logo=["'](.*?)["']/i);
            currentChannel.logo = logoMatch ? logoMatch[1] : '';

            // Name
            const commaIndex = line.lastIndexOf(',');
            if (commaIndex !== -1) {
                currentChannel.name = line.substring(commaIndex + 1).trim();
            } else {
                const nameMatch = line.match(/tvg-name=["'](.*?)["']/i);
                currentChannel.name = nameMatch ? nameMatch[1] : 'Canal Sin Nombre';
            }
        } else if (line.startsWith('http') && currentChannel) {
            currentChannel.url = line;
            if (currentChannel.name && !currentChannel.name.toLowerCase().includes('adulto')) {
                // Determine sub-category based on name or source
                let finalCategory = category;
                if (category === 'Canales Premium') {
                    const name = currentChannel.name.toLowerCase();
                    if (name.includes('espn') || name.includes('fox sports') || name.includes('tyc') || name.includes('tnt sports') || name.includes('win') || name.includes('tudn')) {
                        finalCategory = 'Deportes 24/7';
                    }
                }

                channels.push({
                    equipo_local: currentChannel.name,
                    equipo_visitante: '',
                    torneo: finalCategory,
                    categoria: finalCategory,
                    horario: 'EN VIVO',
                    stream_url: currentChannel.url,
                    escudo_local: currentChannel.logo,
                    escudo_visitante: ''
                });
            }
            currentChannel = null;
        }
    }
    return channels;
}

async function run() {
    console.log('🚀 Iniciando procesamiento de listas M3U...');
    let allData = [];

    for (const source of SOURCES) {
        console.log(`📥 Cargando archivo local: ${source.file}...`);
        try {
            const filePath = path.resolve(source.file);
            if (!fs.existsSync(filePath)) throw new Error(`Archivo no encontrado: ${filePath}`);
            const text = fs.readFileSync(filePath, 'utf-8');
            const channels = parseM3U(text, source.category);
            
            const limit = source.category === 'Películas' ? 100 : 150;
            const selection = channels.slice(0, limit);
            
            allData = [...allData, ...selection];
            console.log(`✅ Procesados ${selection.length} elementos de ${source.name}`);
        } catch (err) {
            console.error(`❌ Error en ${source.name}: ${err.message}`);
        }
    }

    if (allData.length > 0) {
        console.log('🧹 Limpiando base de datos...');
        const { error: delError } = await supabase.from('partidos_hoy').delete().neq('id', 0);
        if (delError) console.warn('Aviso: Error al borrar (posiblemente RLS):', delError.message);

        console.log(`📤 Insertando ${allData.length} registros...`);
        // Insert in chunks of 50 to avoid timeouts
        const chunkSize = 50;
        for (let i = 0; i < allData.length; i += chunkSize) {
            const chunk = allData.slice(i, i + chunkSize);
            const { error } = await supabase.from('partidos_hoy').insert(chunk);
            if (error) {
                console.error(`❌ Error al insertar bloque ${i/chunkSize}:`, error.message);
            } else {
                console.log(`- Bloque ${i/chunkSize + 1} insertado.`);
            }
        }
        console.log('🏁 Proceso finalizado con éxito.');
    } else {
        console.log('⚠️ No se encontró data para insertar.');
    }
}

run();
