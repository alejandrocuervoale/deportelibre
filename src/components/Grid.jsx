import React from 'react';
import { Play } from 'lucide-react';
import MatchCard from './MatchCard';

export default function Grid({ matches, activeCategory, onSelectMatch, selectedMatch, focusedIndex }) {
    const filteredMatches = matches.filter(m => m.categoria === activeCategory);

    return (
        <div className="section-grid-container">
            <h3 className="section-title">
                <Play className="icon-play" size={20} fill="currentColor" />
                {activeCategory} para tí
            </h3>

            {filteredMatches.length === 0 ? (
                <div className="empty-grid">
                    <p>No se encontraron contenidos en {activeCategory} en este momento.</p>
                </div>
            ) : (
                <div className="channels-grid">
                    {filteredMatches.map((match, index) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            isActive={selectedMatch?.id === match.id}
                            isFocused={focusedIndex === index}
                            onClick={onSelectMatch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
