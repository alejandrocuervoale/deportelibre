import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import WebTorrent from 'webtorrent/dist/webtorrent.min.js';
import Logo from './Logo';
import { getSeriesMeta, getTorrentMagnets } from '../api/stremio';

const FALLBACK_SERVERS = {
    vidlink: 'https://vidlink.pro',
    vidsrc: 'https://vidsrc.cc/v2/embed',
    vidsrcin: 'https://vidsrc.in/embed',
    autoembed: 'https://autoembed.to'
};

export default function Player({ match }) {
    const [viewers, setViewers] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [useP2P, setUseP2P] = useState(true);
    const [movieServer, setMovieServer] = useState('vidlink');
    const [seriesMeta, setSeriesMeta] = useState(null);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [torrentStatus, setTorrentStatus] = useState({ peers: 0, progress: 0, speed: 0, ready: false });
    
    const [sourceIndex, setSourceIndex] = useState(0);
    
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const torrentClient = useRef(null);

    // Reset when match changes
    useEffect(() => {
        if (!match) return;
        setSeriesMeta(null);
        setSeason(1);
        setEpisode(1);
        setTorrentStatus({ peers: 0, progress: 0, speed: 0, ready: false });
        setErrorMsg(null);
        setSourceIndex(0); // Reset source index for new channel

        if (match.type === 'series') {
            const imdbId = match.stream_url.replace('stremio://', '');
            getSeriesMeta(imdbId).then(meta => {
                if (meta) {
                    setSeriesMeta(meta);
                    if (meta.videos && meta.videos.length > 0) {
                        setSeason(meta.videos[0].season || 1);
                        setEpisode(meta.videos[0].episode || 1);
                    }
                }
            });
        }
    }, [match]);

    // Viewer count simulation
    useEffect(() => {
        if (!match) return;
        setViewers(Math.floor(Math.random() * 3500) + 1500);
        const interval = setInterval(() => {
            setViewers(prev => Math.max(1000, prev + (Math.floor(Math.random() * 31) - 15)));
        }, 5000);
        return () => clearInterval(interval);
    }, [match]);

    // 1. P2P WEB TORRENT LOGIC
    useEffect(() => {
        if (!match || !useP2P || !match.stream_url.startsWith('stremio://')) return;
        if (!videoRef.current) return;

        const id = match.stream_url.replace('stremio://', '');
        const rid = match.type === 'series' ? `${id}:${season}:${episode}` : id;

        // Cleanup previous torrent
        if (torrentClient.current) {
            torrentClient.current.destroy();
        }

        const client = new WebTorrent();
        torrentClient.current = client;

        getTorrentMagnets(match.type === 'series' ? 'series' : 'movie', rid).then(streams => {
            if (!streams || streams.length === 0) {
                setUseP2P(false); // Fallback to Iframe if no magnets
                return;
            }

            const bestMagnet = streams[0].magnet;
            client.add(bestMagnet, (torrent) => {
                console.log('Torrent ready:', torrent.infoHash);
                const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));
                
                if (file) {
                    file.renderTo(videoRef.current, { autoplay: true });
                    setTorrentStatus(prev => ({ ...prev, ready: true }));
                }

                torrent.on('download', () => {
                   setTorrentStatus({
                       peers: torrent.numPeers,
                       progress: Math.round(torrent.progress * 100),
                       speed: Math.round(torrent.downloadSpeed / 1024),
                       ready: true
                   });
                });
            });
        });

        return () => {
            if (torrentClient.current) torrentClient.current.destroy();
        };
    }, [match, useP2P, season, episode]);

    // 2. LIVE IPTV (HLS) LOGIC
    useEffect(() => {
        if (!match || !videoRef.current || match.stream_url.startsWith('stremio://')) return;

        const video = videoRef.current;
        const currentUrl = match.alternatives && match.alternatives[sourceIndex] 
            ? match.alternatives[sourceIndex] 
            : match.stream_url;

        console.log(`🔗 Cargando fuente ${sourceIndex + 1}/${match.alternatives?.length || 1}: ${currentUrl}`);
        
        const streamUrl = currentUrl.startsWith('http') ? `/hls-proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;

        if (hlsRef.current) hlsRef.current.destroy();

        if (Hls.isSupported()) {
            const hls = new Hls({ 
                backBufferLength: 90, 
                fragLoadingTimeOut: 15000,
                manifestLoadingTimeOut: 15000,
                levelLoadingTimeOut: 15000
            });
            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setErrorMsg(null);
                video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) {
                    console.warn("HLS Fatal Error:", data.type, data.details);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        // Si hay más alternativas, probamos la siguiente
                        if (match.alternatives && sourceIndex < match.alternatives.length - 1) {
                            console.log("♻️ Intentando fuente alternativa...");
                            setIsRetrying(true);
                            setTimeout(() => {
                                setSourceIndex(prev => prev + 1);
                                setIsRetrying(false);
                            }, 2000);
                        } else {
                            setIsRetrying(true);
                            setTimeout(() => { hls.startLoad(); setIsRetrying(false); }, 3000);
                        }
                    } else if (match.alternatives && sourceIndex < match.alternatives.length - 1) {
                        setSourceIndex(prev => prev + 1);
                    } else {
                        hls.destroy();
                        setErrorMsg("Error de señal. Prueba otra alternativa o canal.");
                    }
                }
            });
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
            if (video) {
                video.pause();
                video.src = "";
                video.load();
            }
        };
    }, [match, sourceIndex]);

    const getEmbedUrl = () => {
        const id = match.stream_url.replace('stremio://', '');
        const type = match.type === 'series' ? 'tv' : 'movie';
        const suffix = match.type === 'series' ? `/${season}/${episode}` : '';
        
        if (movieServer === 'vidsrcin') return `https://vidsrc.in/embed/${type}/${id}${suffix}`;
        if (movieServer === 'vidsrc') return `https://vidsrc.cc/v2/embed/${type}/${id}${suffix}`;
        if (movieServer === 'autoembed') return `https://autoembed.to/${type}/tmdb/${id}`; // Note: needs TMDB potentially, or IMDB
        return `${FALLBACK_SERVERS.vidlink}/${type}/${id}${suffix}`;
    };

    if (!match) {
        return (
            <div className="player-empty glass">
                <Logo size="large" />
                <h2>AniFlix v3.0 [P2P Enabled]</h2>
                <p>Nuestra nueva arquitectura utiliza tecnología de enjambre para máxima estabilidad.</p>
            </div>
        );
    }

    return (
        <div className="player-container ani-flix-v3">
            <div className="player-header">
                <div className="player-meta">
                    <h2>{match.equipo_local} {match.type === 'series' ? `(T${season}: E${episode})` : ''}</h2>
                    <p className="match-tournament">{match.torneo}</p>
                </div>
                <div className="player-actions">
                    {match.stream_url.startsWith('stremio://') && (
                        <div className="playback-mode-toggle">
                            <button className={useP2P ? 'active' : ''} onClick={() => setUseP2P(true)}>MODO P2P</button>
                            <button className={!useP2P ? 'active' : ''} onClick={() => setUseP2P(false)}>SVR RESPALDO</button>
                        </div>
                    )}
                    {match.alternatives && match.alternatives.length > 1 && (
                        <div className="source-selector">
                            <button 
                                className="alt-source-btn"
                                onClick={() => setSourceIndex(prev => (prev + 1) % match.alternatives.length)}
                            >
                                ♻️ FUENTE {sourceIndex + 1}/{match.alternatives.length}
                            </button>
                        </div>
                    )}
                    <div className="viewers-badge">
                        <span className="pulsing-dot">🔴</span>
                        <span>{viewers.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="video-wrapper">
                {match.stream_url.startsWith('stremio://') && !useP2P ? (
                    <div className="iframe-box">
                        <div className="svr-overlay">
                           {['vidlink', 'vidsrc', 'vidsrcin', 'autoembed'].map(s => (
                               <button key={s} className={movieServer === s ? 'active' : ''} onClick={() => setMovieServer(s)}>{s.toUpperCase()}</button>
                           ))}
                        </div>
                        <iframe src={getEmbedUrl()} allowFullScreen sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts" />
                    </div>
                ) : (
                    <div className="native-player-box">
                        <video ref={videoRef} controls playsInline />
                        {useP2P && match.stream_url.startsWith('stremio://') && (
                            <div className="p2p-stats glass">
                                <span>🌐 {torrentStatus.peers} Peers</span>
                                <span>⚡ {torrentStatus.speed} KB/s</span>
                                <div className="p2p-progress-bar"><div style={{ width: `${torrentStatus.progress}%` }} /></div>
                            </div>
                        )}
                        {(errorMsg || isRetrying) && <div className="player-msg"><div className="spinner" /><span>{isRetrying ? "Sincronizando..." : errorMsg}</span></div>}
                    </div>
                )}
            </div>

            {match.type === 'series' && seriesMeta && (
                <div className="episode-selector glass">
                    <div className="sel-unit">
                        <label>Temporada</label>
                        <select value={season} onChange={(e) => { setSeason(parseInt(e.target.value)); setEpisode(1); }}>
                            {[...new Set(seriesMeta.videos.map(v => v.season))].sort((a,b)=>a-b).map(s => <option key={s} value={s}>Temp {s}</option>)}
                        </select>
                    </div>
                    <div className="sel-unit">
                        <label>Episodio</label>
                        <select value={episode} onChange={(e) => setEpisode(parseInt(e.target.value))}>
                            {seriesMeta.videos.filter(v => v.season === season).map(v => <option key={v.episode} value={v.episode}>E{v.episode}: {v.title}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
