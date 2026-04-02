import React from 'react';
import { PlayCircle, Clock, Tv, Film, Star, Heart } from 'lucide-react';

export default function MatchCard({ match, isActive, isFocused, isFavorite, onToggleFavorite, onClick }) {
    const defaultThumbnail = "https://ui-avatars.com/api/?name=TV&background=121212&color=00f2ff";

    const isMovie = match.categoria === "Películas";
    const isPremium = match.categoria === "Canales Premium";
    const isSport = match.categoria === "Deportes 24/7" || match.categoria === "Fútbol Argentino";

    const getImgUrl = (url) => {
        if (!url) return defaultThumbnail;
        if (window.Capacitor && window.Capacitor.platform !== 'web') return url;
        if (url.startsWith('http')) {
            return `/img-proxy?url=${encodeURIComponent(url)}`;
        }
        return url;
    };

    return (
        <div 
            className={`match-card ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`} 
            onClick={() => onClick(match)}
            data-category={match.categoria}
        >
            <div className="match-card-tournament">
                <div className="category-tag">
                    {isMovie ? <Film size={12} style={{marginRight: '5px'}}/> : isSport ? <Tv size={12} style={{marginRight: '5px'}}/> : <Star size={12} style={{marginRight: '5px'}}/>}
                    {match.torneo}
                </div>
                <button 
                  className={`fav-btn ${isFavorite ? 'active' : ''}`} 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(match.id); }}
                >
                    <Heart size={16} fill={isFavorite ? "#e50914" : "none"} color={isFavorite ? "#e50914" : "currentColor"} />
                </button>
            </div>

            <div className="match-card-teams">
                {isMovie ? (
                    <div className="movie-poster-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <div className="thumbnail-container" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '1rem' }}>
                            <img 
                                src={getImgUrl(match.escudo_local)} 
                                alt={match.equipo_local}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = defaultThumbnail; }}
                            />
                         </div>
                         <span className="channel-title">{match.equipo_local}</span>
                    </div>
                ) : (
                    <div className="channel-info-with-logo" style={{ width: '100%' }}>
                        <div className="channel-logo-wrapper" style={{ margin: '0 auto 1rem' }}>
                            <img
                                src={getImgUrl(match.escudo_local || match.logo_canal)}
                                alt={match.equipo_local}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = defaultThumbnail; }}
                            />
                        </div>
                        <span className="channel-title">
                            {match.titulo || match.equipo_local}
                        </span>
                    </div>
                )}
            </div>

            <div className="match-card-footer">
                <div className="match-card-time">
                    <Clock size={16} className="clock-icon" />
                    <span>{match.horario}</span>
                </div>
                <button className="match-card-btn">
                    <PlayCircle size={18} /> Ver Ahora
                </button>
            </div>
        </div>
    );
}
