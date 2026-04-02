import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlayCircle, Clock } from 'lucide-react';

export default function Sidebar({ onSelectMatch, selectedMatch }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMatches() {
            try {
                const { data, error } = await supabase
                    .from('partidos_hoy')
                    .select('*')
                    .order('horario', { ascending: true });

                if (error) {
                    console.error("Error fetching matches:", error);
                } else {
                    setMatches(data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMatches();
    }, []);

    if (loading) {
        return (
            <aside className="sidebar loading">
                <div className="spinner"></div>
                <p>Cargando programación...</p>
            </aside>
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">Agenda de Hoy</h2>
            </div>

            {matches.length === 0 ? (
                <div className="empty-state">
                    <p>No hay transmisiones programadas para hoy. Mantente atento.</p>
                </div>
            ) : (
                <ul className="match-list">
                    {matches.map(match => (
                        <li
                            key={match.id}
                            className={`match-item ${selectedMatch?.id === match.id ? 'active' : ''}`}
                            onClick={() => onSelectMatch(match)}
                        >
                            <div className="match-time-badge">
                                <Clock size={12} className="icon-clock" />
                                <span>{match.horario}</span>
                            </div>
                            <div className="match-content">
                                <span className="match-tournament">{match.torneo}</span>
                                <span className="match-title">{match.titulo}</span>
                            </div>
                            <div className="match-action">
                                <button className="watch-btn">
                                    <PlayCircle size={18} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}
