import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOURCES = [
    {
        name: 'Argentina (Películas/General)',
        url: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
        category: 'Películas',
        limit: 10
    },
    {
        name: 'Deportes/Argentina',
        url: 'https://gist.githubusercontent.com/frantdse/f6989518c73826ade6734c63c367af4c/raw/',
        category: 'Deportes 24/7',
        limit: 10
    }
];

function parseM3U(text) {
    if (!text) return [];
    const lines = text.replace(/\r/g, '').split('\n');
    console.log(`- Analizando ${lines.length} líneas...`);
    const channels = [];
    let currentChannel = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            currentChannel = {};
            // Extract logo - more robust regex
            const logoMatch = line.match(/tvg-logo=["'](.*?)["']/i);
            if (logoMatch) currentChannel.logo = logoMatch[1];

            // Extract name (handle comma)
            const commaIndex = line.lastIndexOf(',');
            if (commaIndex !== -1) {
                currentChannel.name = line.substring(commaIndex + 1).trim();
            } else {
                // Fallback for name if comma is missing
                const nameMatch = line.match(/tvg-name=["'](.*?)["']/i);
                currentChannel.name = nameMatch ? nameMatch[1] : null;
            }
        } else if (line.startsWith('http') && currentChannel) {
            currentChannel.url = line;
            if (currentChannel.name) {
                channels.push(currentChannel);
            }
            currentChannel = null;
        }
    }
    return channels;
}

async function populate() {
    console.log('--- Iniciando población de Supabase ---');

    let allInserted = [];

    for (const source of SOURCES) {
        console.log(`Procesando fuente: ${source.name}...`);
        try {
            const response = await fetch(source.url);
            const text = await response.text();
            const channels = parseM3U(text);

            // Tomar una muestra de 10 canales
            const selection = channels.slice(0, source.limit).map(c => ({
                equipo_local: c.name,
                equipo_visitante: source.category === 'Películas' ? '' : 'En Vivo',
                torneo: source.category,
                categoria: source.category,
                horario: '24/7',
                stream_url: c.url,
                escudo_local: c.logo || '',
                escudo_visitante: ''
            }));

            allInserted = [...allInserted, ...selection];
            console.log(`- Preparados ${selection.length} canales de ${source.name}`);
        } catch (err) {
            console.error(`Error procesando ${source.name}:`, err.message);
        }
    }

    if (allInserted.length > 0) {
        console.log('Borrando datos antiguos...');
        await supabase.from('partidos_hoy').delete().neq('id', 0);

        console.log(`Insertando ${allInserted.length} registros en Supabase...`);
        const { error } = await supabase.from('partidos_hoy').insert(allInserted);

        if (error) {
            console.error('Error al insertar en Supabase:', error.message);
        } else {
            console.log('✅ Base de datos poblada exitosamente con 20 canales reales.');
        }
    } else {
        console.log('No se encontraron canales para insertar.');
    }
}

populate();
